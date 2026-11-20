/**
 * Hand-rolled metadata parsing for images — no external EXIF library.
 *
 * Supported, honestly and without fabrication:
 * - JPEG: SOF dimensions, JFIF APP0, EXIF APP1 (TIFF IFD0 / Exif sub-IFD / GPS),
 *   including camera make/model, orientation, dates, exposure settings, GPS.
 * - PNG: IHDR, pHYs, tEXt / iTXt (uncompressed), tIME, gAMA, sRGB, PLTE.
 * - WebP: RIFF chunk walk for VP8X / VP8 / VP8L dimensions, alpha, animation.
 * - GIF / BMP: header dimensions and bit depth.
 *
 * Maker notes, thumbnails, Photoshop resources and compressed text chunks are
 * deliberately skipped and reported as notes instead of guessed.
 */

import { errText } from "./canvas";

export interface MetadataField {
  label: string;
  value: string;
}

export interface ImageMetadata {
  format: string;
  fields: MetadataField[];
  textEntries: MetadataField[];
  notes: string[];
}

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

const ORIENTATIONS: Record<number, string> = {
  1: "Normal",
  2: "Mirrored horizontally",
  3: "Rotated 180°",
  4: "Mirrored vertically",
  5: "Mirrored horizontally, then rotated 90° clockwise",
  6: "Rotated 90° clockwise",
  7: "Mirrored horizontally, then rotated 90° counter-clockwise",
  8: "Rotated 90° counter-clockwise",
};

const PNG_COLOR_TYPES: Record<number, string> = {
  0: "Grayscale",
  2: "RGB (truecolour)",
  3: "Indexed palette",
  4: "Grayscale + alpha",
  6: "RGBA (truecolour + alpha)",
};

const SRGB_INTENTS: Record<number, string> = {
  0: "Perceptual",
  1: "Relative colorimetric",
  2: "Saturation",
  3: "Absolute colorimetric",
};

const utf8 = new TextDecoder();

function readAscii(dv: DataView, offset: number, max: number): string {
  let out = "";
  for (let i = 0; i < max && offset + i < dv.byteLength; i++) {
    const c = dv.getUint8(offset + i);
    if (c === 0) break;
    out += String.fromCharCode(c);
  }
  return out.trim();
}

function readAscii4(dv: DataView, offset: number): string {
  let out = "";
  for (let i = 0; i < 4 && offset + i < dv.byteLength; i++) {
    out += String.fromCharCode(dv.getUint8(offset + i));
  }
  return out;
}

function readUint24LE(dv: DataView, offset: number): number {
  return dv.getUint8(offset) | (dv.getUint8(offset + 1) << 8) | (dv.getUint8(offset + 2) << 16);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/* ── TIFF / EXIF ────────────────────────────────────────────── */

type IfdValue = number | number[] | string;

function readIfdValue(dv: DataView, tiffStart: number, entry: number, le: boolean): IfdValue {
  const type = dv.getUint16(entry + 2, le);
  const count = dv.getUint32(entry + 4, le);
  const size = (TYPE_SIZES[type] ?? 1) * count;
  const base = size > 4 ? tiffStart + dv.getUint32(entry + 8, le) : entry + 8;
  if (type === 2) return readAscii(dv, base, count);
  if (type === 3) {
    const out: number[] = [];
    for (let i = 0; i < count && base + i * 2 + 1 < dv.byteLength; i++) {
      out.push(dv.getUint16(base + i * 2, le));
    }
    return out;
  }
  if (type === 4) {
    const out: number[] = [];
    for (let i = 0; i < count && base + i * 4 + 3 < dv.byteLength; i++) {
      out.push(dv.getUint32(base + i * 4, le));
    }
    return out;
  }
  if (type === 5 || type === 10) {
    const signed = type === 10;
    const out: number[] = [];
    for (let i = 0; i < count && base + i * 8 + 7 < dv.byteLength; i++) {
      const n = signed ? dv.getInt32(base + i * 8, le) : dv.getUint32(base + i * 8, le);
      const d = signed ? dv.getInt32(base + i * 8 + 4, le) : dv.getUint32(base + i * 8 + 4, le);
      out.push(d !== 0 ? n / d : 0);
    }
    return out;
  }
  if (type === 1 || type === 7) {
    const out: number[] = [];
    for (let i = 0; i < count && base + i < dv.byteLength; i++) out.push(dv.getUint8(base + i));
    return out;
  }
  if (type === 9) return dv.getInt32(base, le);
  return dv.getUint32(base, le);
}

function parseIfd(
  dv: DataView,
  tiffStart: number,
  ifdStart: number,
  le: boolean,
): Map<number, IfdValue> {
  const tags = new Map<number, IfdValue>();
  const count = dv.getUint16(ifdStart, le);
  for (let i = 0; i < count; i++) {
    const entry = ifdStart + 2 + i * 12;
    if (entry + 12 > dv.byteLength) break;
    const tag = dv.getUint16(entry, le);
    tags.set(tag, readIfdValue(dv, tiffStart, entry, le));
  }
  return tags;
}

function asNumber(v: IfdValue | undefined): number | null {
  if (v === undefined) return null;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return typeof v[0] === "number" ? v[0] : null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(v: IfdValue | undefined): string | null {
  if (v === undefined || Array.isArray(v) || v === "") return null;
  return String(v);
}

function formatExposure(seconds: number): string {
  if (seconds >= 1) return `${Number(seconds.toFixed(3))} s`;
  const den = Math.round(1 / seconds);
  return `1/${den} s`;
}

function addField(fields: MetadataField[], label: string, value: string | null): void {
  if (value) fields.push({ label, value });
}

function parseExif(
  dv: DataView,
  tiffStart: number,
  fields: MetadataField[],
  notes: string[],
): void {
  if (tiffStart + 8 > dv.byteLength) return;
  const le = dv.getUint16(tiffStart) === 0x4949;
  if (dv.getUint16(tiffStart + 2, le) !== 42) {
    notes.push("EXIF block had an unexpected byte-order mark and was skipped.");
    return;
  }
  const ifd0 = parseIfd(dv, tiffStart, tiffStart + dv.getUint32(tiffStart + 4, le), le);

  addField(fields, "Camera make", asString(ifd0.get(0x010f)));
  addField(fields, "Camera model", asString(ifd0.get(0x0110)));
  addField(fields, "Software", asString(ifd0.get(0x0131)));
  addField(fields, "Date/time (saved)", asString(ifd0.get(0x0132)));
  addField(fields, "Copyright", asString(ifd0.get(0x8298)));

  const orientation = asNumber(ifd0.get(0x0112));
  if (orientation !== null && ORIENTATIONS[orientation]) {
    addField(fields, "Orientation", `${orientation} — ${ORIENTATIONS[orientation]}`);
  }

  const exifPtr = asNumber(ifd0.get(0x8769));
  if (exifPtr !== null && tiffStart + exifPtr < dv.byteLength) {
    const exif = parseIfd(dv, tiffStart, tiffStart + exifPtr, le);
    const exposure = asNumber(exif.get(0x829a));
    if (exposure !== null && exposure > 0) addField(fields, "Exposure", formatExposure(exposure));
    const fNumber = asNumber(exif.get(0x829d));
    if (fNumber !== null && fNumber > 0) {
      addField(fields, "Aperture", `f/${Number(fNumber.toFixed(2))}`);
    }
    const iso = asNumber(exif.get(0x8827));
    if (iso !== null && iso > 0) addField(fields, "ISO", String(iso));
    const focal = asNumber(exif.get(0x920a));
    if (focal !== null && focal > 0) {
      addField(fields, "Focal length", `${Number(focal.toFixed(1))} mm`);
    }
    addField(fields, "Date taken (original)", asString(exif.get(0x9003)));
    const pxW = asNumber(exif.get(0xa002));
    const pxH = asNumber(exif.get(0xa003));
    if (pxW !== null && pxH !== null && pxW > 0 && pxH > 0) {
      addField(fields, "EXIF recorded size", `${pxW} × ${pxH} px`);
    }
    addField(fields, "Lens model", asString(exif.get(0xa434)));
  }

  const gpsPtr = asNumber(ifd0.get(0x8825));
  if (gpsPtr !== null && tiffStart + gpsPtr < dv.byteLength) {
    const gps = parseIfd(dv, tiffStart, tiffStart + gpsPtr, le);
    const lat = gps.get(0x0002);
    const latRef = asString(gps.get(0x0001));
    const lon = gps.get(0x0004);
    const lonRef = asString(gps.get(0x0003));
    if (Array.isArray(lat) && lat.length === 3 && Array.isArray(lon) && lon.length === 3) {
      const toDegrees = (parts: number[], ref: string | null): number => {
        const d = parts[0] + parts[1] / 60 + parts[2] / 3600;
        return ref === "S" || ref === "W" ? -d : d;
      };
      const latDeg = toDegrees(lat, latRef);
      const lonDeg = toDegrees(lon, lonRef);
      fields.push({
        label: "GPS latitude",
        value: `${latDeg.toFixed(6)}° ${latRef ?? ""}`.trim(),
      });
      fields.push({
        label: "GPS longitude",
        value: `${lonDeg.toFixed(6)}° ${lonRef ?? ""}`.trim(),
      });
    }
  }
}

/* ── JPEG ───────────────────────────────────────────────────── */

function parseJpeg(
  dv: DataView,
  fields: MetadataField[],
  notes: string[],
): void {
  let offset = 2;
  let segments = 0;
  while (offset + 4 <= dv.byteLength && segments < 64) {
    segments++;
    if (dv.getUint8(offset) !== 0xff) break;
    const marker = dv.getUint8(offset + 1);
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) break; // start of scan — entropy-coded data follows
    const segLen = dv.getUint16(offset + 2);
    const segType = readAscii4(dv, offset + 4);

    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = dv.getUint16(offset + 5);
      const width = dv.getUint16(offset + 7);
      fields.push({ label: "Dimensions", value: `${width} × ${height} px` });
      fields.push({ label: "Bit depth", value: `${dv.getUint8(offset + 4)} bits per sample` });
    } else if (marker === 0xe0 && segType.startsWith("JFIF") && segLen >= 14) {
      const major = dv.getUint8(offset + 4 + 5);
      const minor = dv.getUint8(offset + 4 + 6);
      fields.push({ label: "JFIF version", value: `${major}.${pad2(minor)}` });
      const units = dv.getUint8(offset + 4 + 7);
      const xd = dv.getUint16(offset + 4 + 8);
      const yd = dv.getUint16(offset + 4 + 10);
      if (xd > 0 && yd > 0) {
        const unitName = units === 1 ? "DPI" : units === 2 ? "dots per cm" : "no units";
        fields.push({ label: "Density", value: `${xd} × ${yd} ${unitName}` });
      }
    } else if (marker === 0xe1 && segType === "Exif") {
      parseExif(dv, offset + 10, fields, notes);
    }
    offset += 2 + segLen;
  }
}

/* ── PNG ────────────────────────────────────────────────────── */

function parsePng(
  dv: DataView,
  fields: MetadataField[],
  textEntries: MetadataField[],
  notes: string[],
): void {
  fields.push({
    label: "Dimensions",
    value: `${dv.getUint32(16)} × ${dv.getUint32(20)} px`,
  });
  fields.push({ label: "Bit depth", value: `${dv.getUint8(24)} bits per channel` });
  const colorType = dv.getUint8(25);
  fields.push({
    label: "Colour type",
    value: PNG_COLOR_TYPES[colorType] ?? `Type ${colorType}`,
  });
  if (dv.getUint8(28) === 1) fields.push({ label: "Interlacing", value: "Adam7 interlaced" });

  let offset = 8;
  let warnedCompressed = false;
  while (offset + 8 <= dv.byteLength) {
    const length = dv.getUint32(offset);
    const type = readAscii4(dv, offset + 4);
    const data = offset + 8;

    if (type === "IHDR") {
      // already handled above
    } else if (type === "pHYs" && length >= 9) {
      const ppuX = dv.getUint32(data);
      const ppuY = dv.getUint32(data + 4);
      const unit = dv.getUint8(data + 8);
      if (unit === 1 && ppuX > 0) {
        fields.push({
          label: "Pixel density",
          value: `${Math.round((ppuX * 0.0254))} × ${Math.round((ppuY * 0.0254))} DPI`,
        });
      } else {
        fields.push({
          label: "Pixel density",
          value: `${ppuX} × ${ppuY} px per ${unit === 1 ? "metre" : "unit"}`,
        });
      }
    } else if (type === "tEXt" && length > 0) {
      const raw = new Uint8Array(dv.buffer, dv.byteOffset + data, length);
      const nul = raw.indexOf(0);
      if (nul > 0) {
        textEntries.push({
          label: utf8.decode(raw.subarray(0, nul)),
          value: utf8.decode(raw.subarray(nul + 1)),
        });
      }
    } else if (type === "iTXt" && length > 0) {
      const raw = new Uint8Array(dv.buffer, dv.byteOffset + data, length);
      const nul = raw.indexOf(0);
      const compressed = nul >= 0 && raw[nul + 1] === 1;
      if (nul > 0 && !compressed) {
        const nextNul = (from: number): number => {
          const i = raw.indexOf(0, from);
          return i === -1 ? raw.length : i;
        };
        let p = nextNul(nul + 3) + 1; // skip compression flag/method + language tag
        p = nextNul(p) + 1; // skip translated keyword
        textEntries.push({
          label: utf8.decode(raw.subarray(0, nul)),
          value: utf8.decode(raw.subarray(p)),
        });
      } else if (compressed && !warnedCompressed) {
        warnedCompressed = true;
        notes.push("Compressed iTXt/zTXt text chunks exist but are not decoded by this viewer.");
      }
    } else if (type === "zTXt" && !warnedCompressed) {
      warnedCompressed = true;
      notes.push("Compressed zTXt text chunks exist but are not decoded by this viewer.");
    } else if (type === "tIME" && length >= 7) {
      fields.push({
        label: "Last modified (tIME)",
        value: `${dv.getUint16(data)}-${pad2(dv.getUint8(data + 2))}-${pad2(dv.getUint8(data + 3))} ${pad2(dv.getUint8(data + 4))}:${pad2(dv.getUint8(data + 5))}:${pad2(dv.getUint8(data + 6))}`,
      });
    } else if (type === "gAMA" && length >= 4) {
      fields.push({ label: "Gamma", value: (dv.getUint32(data) / 100000).toFixed(3) });
    } else if (type === "sRGB" && length >= 1) {
      const intent = dv.getUint8(data);
      fields.push({ label: "sRGB intent", value: SRGB_INTENTS[intent] ?? String(intent) });
    } else if (type === "PLTE") {
      fields.push({ label: "Palette", value: `${Math.floor(length / 3)} colours` });
    }

    if (type === "IEND") break;
    offset += 12 + length;
  }
}

/* ── WebP ───────────────────────────────────────────────────── */

function parseWebp(
  dv: DataView,
  fields: MetadataField[],
  notes: string[],
): void {
  let offset = 12;
  while (offset + 8 <= dv.byteLength) {
    const fourcc = readAscii4(dv, offset);
    const size = dv.getUint32(offset + 4, true);
    const data = offset + 8;

    if (fourcc === "VP8X" && size >= 10) {
      const flags = dv.getUint8(data);
      const width = readUint24LE(dv, data + 4) + 1;
      const height = readUint24LE(dv, data + 7) + 1;
      fields.push({ label: "Dimensions", value: `${width} × ${height} px` });
      if (flags & 0x10) fields.push({ label: "Alpha channel", value: "Yes" });
      if (flags & 0x02) fields.push({ label: "Animation", value: "Yes (animated WebP)" });
      if (flags & 0x08) {
        notes.push("This WebP carries an EXIF block; EXIF inside WebP is not decoded here.");
      }
      if (flags & 0x04) notes.push("This WebP carries an XMP block (not decoded).");
      break;
    }
    if (fourcc === "VP8 " && size >= 10) {
      const width = dv.getUint16(data + 6, true) & 0x3fff;
      const height = dv.getUint16(data + 8, true) & 0x3fff;
      fields.push({ label: "Dimensions", value: `${width} × ${height} px` });
      break;
    }
    if (fourcc === "VP8L" && size >= 5) {
      const bits = dv.getUint32(data + 1, true);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      fields.push({ label: "Dimensions", value: `${width} × ${height} px` });
      break;
    }
    if (fourcc === "ALPH") {
      fields.push({ label: "Alpha channel", value: "Yes" });
    }
    if (fourcc === "XMP ") {
      notes.push("This WebP carries an XMP block (not decoded).");
    }
    offset += 8 + size + (size % 2);
  }
}

/* ── GIF / BMP ──────────────────────────────────────────────── */

function parseGif(dv: DataView, fields: MetadataField[], notes: string[]): void {
  fields.push({ label: "Version", value: readAscii(dv, 0, 6) });
  fields.push({
    label: "Dimensions",
    value: `${dv.getUint16(6, true)} × ${dv.getUint16(8, true)} px`,
  });
  notes.push("GIF comment and application extensions are not decoded by this viewer.");
}

function parseBmp(dv: DataView, fields: MetadataField[], notes: string[]): void {
  const dibSize = dv.getUint32(14, true);
  if (dibSize < 40) {
    notes.push("This BMP uses an old header variant; only the file signature was read.");
    return;
  }
  const width = Math.abs(dv.getInt32(18, true));
  const height = Math.abs(dv.getInt32(22, true));
  fields.push({ label: "Dimensions", value: `${width} × ${height} px` });
  fields.push({ label: "Bit depth", value: `${dv.getUint16(28, true)} bits per pixel` });
}

/* ── Entry point ────────────────────────────────────────────── */

export function parseImageMetadata(buffer: ArrayBuffer): ImageMetadata {
  const dv = new DataView(buffer);
  const fields: MetadataField[] = [];
  const textEntries: MetadataField[] = [];
  const notes: string[] = [];
  let format = "Unknown";

  try {
    const b = (i: number) => dv.getUint8(i);
    const isPng = b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47;
    const isJpeg = b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff;
    const isGif = readAscii(dv, 0, 3) === "GIF";
    const isWebp = readAscii(dv, 0, 4) === "RIFF" && readAscii(dv, 8, 4) === "WEBP";
    const isBmp = b(0) === 0x42 && b(1) === 0x4d;

    if (buffer.byteLength < 12) {
      notes.push("The file is too small to contain meaningful metadata.");
    } else if (isPng) {
      format = "PNG";
      parsePng(dv, fields, textEntries, notes);
    } else if (isJpeg) {
      format = "JPEG";
      parseJpeg(dv, fields, notes);
    } else if (isWebp) {
      format = "WebP";
      parseWebp(dv, fields, notes);
    } else if (isGif) {
      format = "GIF";
      parseGif(dv, fields, notes);
    } else if (isBmp) {
      format = "BMP";
      parseBmp(dv, fields, notes);
    } else {
      notes.push("Unrecognised file signature — only JPEG, PNG, WebP, GIF and BMP are parsed.");
    }
  } catch (e) {
    notes.push(`Metadata parsing stopped early: ${errText(e)}`);
  }

  return { format, fields, textEntries, notes };
}
