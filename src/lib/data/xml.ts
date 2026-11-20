/**
 * Hand-rolled JSON ↔ XML converters.
 *
 * Conventions:
 *  - XML attributes are preserved under the "@attributes" key.
 *  - Mixed text alongside children is preserved under "#text".
 *  - Repeated sibling elements with the same name become arrays.
 */

/* ── XML parsing ─────────────────────────────────────────────── */

export type XmlNode = {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
};

export class XmlParseError extends Error {}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const NAME_RE = /^[A-Za-z_:][A-Za-z0-9._:-]*$/;

/**
 * Parse a well-formed XML document into a tree. Supports comments, PIs,
 * CDATA sections, attributes and entity references. Throws XmlParseError
 * on malformed input.
 */
export function parseXml(src: string): XmlNode {
  let i = 0;
  const s = src;

  const skipWhitespace = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };

  const skipMisc = () => {
    for (;;) {
      skipWhitespace();
      if (s.startsWith("<?", i)) {
        const end = s.indexOf("?>", i);
        if (end === -1) throw new XmlParseError("Unterminated processing instruction.");
        i = end + 2;
        continue;
      }
      if (s.startsWith("<!--", i)) {
        const end = s.indexOf("-->", i);
        if (end === -1) throw new XmlParseError("Unterminated comment.");
        i = end + 3;
        continue;
      }
      if (s.startsWith("<!DOCTYPE", i)) {
        const end = s.indexOf(">", i);
        if (end === -1) throw new XmlParseError("Unterminated DOCTYPE declaration.");
        i = end + 1;
        continue;
      }
      return;
    }
  };

  const parseAttributes = (): Record<string, string> => {
    const attrs: Record<string, string> = {};
    for (;;) {
      skipWhitespace();
      if (i >= s.length) throw new XmlParseError("Unexpected end of input inside a tag.");
      if (s[i] === ">" || (s[i] === "/" && s[i + 1] === ">")) return attrs;
      const m = /^[A-Za-z_:][A-Za-z0-9._:-]*/.exec(s.slice(i));
      if (!m) throw new XmlParseError(`Invalid attribute name at position ${i}.`);
      const name = m[0];
      i += name.length;
      skipWhitespace();
      if (s[i] !== "=") {
        attrs[name] = ""; // boolean-style attribute
        continue;
      }
      i++;
      skipWhitespace();
      const quote = s[i];
      if (quote !== '"' && quote !== "'") {
        throw new XmlParseError(`Attribute "${name}" is missing a quoted value.`);
      }
      const end = s.indexOf(quote, i + 1);
      if (end === -1) throw new XmlParseError(`Attribute "${name}" value is not closed.`);
      attrs[name] = decodeEntities(s.slice(i + 1, end));
      i = end + 1;
    }
  };

  const parseNode = (): XmlNode => {
    if (s[i] !== "<") throw new XmlParseError("Expected an element opening tag.");
    const openMatch = /^<([A-Za-z_:][A-Za-z0-9._:-]*)/.exec(s.slice(i));
    if (!openMatch) throw new XmlParseError(`Invalid element name at position ${i}.`);
    const node: XmlNode = { name: openMatch[1], attrs: {}, children: [], text: "" };
    i += openMatch[0].length;
    node.attrs = parseAttributes();
    if (s[i] === "/" && s[i + 1] === ">") {
      i += 2;
      return node; // self-closing
    }
    if (s[i] !== ">") throw new XmlParseError(`Malformed opening tag for <${node.name}>.`);
    i++;

    // Parse content until the matching close tag.
    for (;;) {
      if (i >= s.length) throw new XmlParseError(`Element <${node.name}> is never closed.`);
      if (s.startsWith("</", i)) {
        const closeMatch = /^<\/\s*([A-Za-z_:][A-Za-z0-9._:-]*)\s*>/.exec(s.slice(i));
        if (!closeMatch) throw new XmlParseError(`Malformed closing tag inside <${node.name}>.`);
        if (closeMatch[1] !== node.name) {
          throw new XmlParseError(
            `Expected </${node.name}> but found </${closeMatch[1]}>.`,
          );
        }
        i += closeMatch[0].length;
        return node;
      }
      if (s.startsWith("<![CDATA[", i)) {
        const end = s.indexOf("]]>", i);
        if (end === -1) throw new XmlParseError("Unterminated CDATA section.");
        node.text += s.slice(i + 9, end);
        i = end + 3;
        continue;
      }
      if (s.startsWith("<!--", i)) {
        const end = s.indexOf("-->", i);
        if (end === -1) throw new XmlParseError("Unterminated comment.");
        i = end + 3;
        continue;
      }
      if (s.startsWith("<?", i)) {
        const end = s.indexOf("?>", i);
        if (end === -1) throw new XmlParseError("Unterminated processing instruction.");
        i = end + 2;
        continue;
      }
      if (s[i] === "<") {
        node.children.push(parseNode());
        continue;
      }
      const next = s.indexOf("<", i);
      const stop = next === -1 ? s.length : next;
      node.text += decodeEntities(s.slice(i, stop));
      i = stop;
    }
  };

  skipMisc();
  if (i >= s.length || s[i] !== "<") {
    throw new XmlParseError("No root element found — the document must contain XML.");
  }
  const root = parseNode();
  skipMisc();
  if (i < s.length) {
    throw new XmlParseError("Unexpected content after the root element.");
  }
  return root;
}

/* ── XML tree → JSON ─────────────────────────────────────────── */

export function nodeToJson(node: XmlNode): unknown {
  const attrs = Object.keys(node.attrs);
  const text = node.text.trim();

  if (node.children.length === 0) {
    if (attrs.length === 0) return text;
    const obj: Record<string, unknown> = { "@attributes": { ...node.attrs } };
    if (text !== "") obj["#text"] = text;
    return obj;
  }

  const obj: Record<string, unknown> = {};
  if (attrs.length > 0) obj["@attributes"] = { ...node.attrs };
  for (const child of node.children) {
    const value = nodeToJson(child);
    const existing = obj[child.name];
    if (existing === undefined) {
      obj[child.name] = value;
    } else if (Array.isArray(existing) && Array.isArray(value)) {
      // Cannot happen in practice; keeps types honest.
      obj[child.name] = [...existing, ...value];
    } else if (Array.isArray(existing)) {
      obj[child.name] = [...existing, value];
    } else {
      obj[child.name] = [existing, value];
    }
  }
  if (text !== "") obj["#text"] = text;
  return obj;
}

/** Parse an XML document string and return { root, json }. */
export function xmlToJson(src: string): { root: string; json: unknown } {
  const root = parseXml(src);
  return { root: root.name, json: { [root.name]: nodeToJson(root) } };
}

/* ── JSON → XML ──────────────────────────────────────────────── */

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttrValue(s: string): string {
  return escapeText(s).replace(/"/g, "&quot;");
}

const RESERVED_KEYS = new Set(["@attributes", "#text"]);

function renderNode(
  name: string,
  value: unknown,
  indent: string,
  pretty: boolean,
  out: string[],
): void {
  const nl = pretty ? "\n" : "";
  // Attributes (if any)
  let attrs = "";
  let textContent: string | null = null;
  let objEntries: Array<[string, unknown]> = [];

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const attrObj = obj["@attributes"];
    if (attrObj !== null && typeof attrObj === "object" && !Array.isArray(attrObj)) {
      attrs = Object.entries(attrObj as Record<string, unknown>)
        .map(([k, v]) => ` ${k}="${escapeAttrValue(String(v))}"`)
        .join("");
    }
    const textVal = obj["#text"];
    if (textVal !== undefined && textVal !== null && !Array.isArray(textVal) && typeof textVal !== "object") {
      textContent = String(textVal);
    }
    objEntries = Object.entries(obj).filter(([k]) => !RESERVED_KEYS.has(k));
  }

  if (value === null || value === undefined) {
    out.push(`${indent}<${name}${attrs}/>`);
    return;
  }

  const prim = typeof value;
  if (prim === "string" || prim === "number" || prim === "boolean") {
    out.push(`${indent}<${name}${attrs}>${escapeText(String(value))}</${name}>`);
    return;
  }

  if (Array.isArray(value)) {
    // Repeat the element for each item in the array.
    for (const item of value) renderNode(name, item, indent, pretty, out);
    return;
  }

  // Object node
  if (objEntries.length === 0) {
    if (textContent !== null) {
      out.push(`${indent}<${name}${attrs}>${escapeText(textContent)}</${name}>`);
    } else {
      out.push(`${indent}<${name}${attrs}/>`);
    }
    return;
  }

  out.push(`${indent}<${name}${attrs}>${textContent !== null ? escapeText(textContent) : ""}`);
  for (const [k, v] of objEntries) {
    if (!NAME_RE.test(k)) {
      throw new Error(`"${k}" cannot be used as an XML element name.`);
    }
    renderNode(k, v, pretty ? indent + "  " : indent, pretty, out);
  }
  out.push(`${indent}</${name}>`);
}

/**
 * Convert a JSON value to XML. `root` is the configurable root element name.
 * A top-level object's properties become children of the root; a top-level
 * array is rendered as repeated <item> elements inside the root.
 */
export function jsonToXml(
  input: unknown,
  root = "root",
  options: { pretty?: boolean } = {},
): string {
  const pretty = options.pretty ?? true;
  if (!NAME_RE.test(root)) {
    throw new Error(`"${root}" is not a valid XML element name.`);
  }
  const nl = pretty ? "\n" : "";
  const body: string[] = [];
  if (Array.isArray(input)) {
    for (const item of input) renderNode("item", item, pretty ? "  " : "", pretty, body);
  } else if (input !== null && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    // Render "@attributes" of the root object as attributes of the root element.
    let attrs = "";
    const attrObj = obj["@attributes"];
    if (attrObj !== null && typeof attrObj === "object" && !Array.isArray(attrObj)) {
      attrs = Object.entries(attrObj as Record<string, unknown>)
        .map(([k, v]) => ` ${k}="${escapeAttrValue(String(v))}"`)
        .join("");
    }
    const entries = Object.entries(obj).filter(([k]) => !RESERVED_KEYS.has(k));
    if (entries.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>${nl}<${root}${attrs}/>${nl}`;
    }
    for (const [k, v] of entries) {
      if (!NAME_RE.test(k)) {
        throw new Error(`"${k}" cannot be used as an XML element name.`);
      }
      renderNode(k, v, pretty ? "  " : "", pretty, body);
    }
    return (
      `<?xml version="1.0" encoding="UTF-8"?>${nl}<${root}${attrs}>${nl}` +
      body.join(nl) +
      (pretty ? "\n" : "") +
      `</${root}>${nl}`
    );
  } else if (input !== null && input !== undefined) {
    body.push(pretty ? `  ${escapeText(String(input))}` : escapeText(String(input)));
    return (
      `<?xml version="1.0" encoding="UTF-8"?>${nl}<${root}>${nl}` +
      body.join(nl) +
      (pretty ? "\n" : "") +
      `</${root}>${nl}`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>${nl}<${root}>${nl}` +
    body.join(nl) +
    (pretty ? "\n" : "") +
    `</${root}>${nl}`;
}
