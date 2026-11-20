import type { VehicleKind } from "./routeData";

/**
 * Shared Route 145 SVG motifs, restyled into the V8 dark
 * cinematic system: violet #8B7CFF + cyan #36D9FF on #070912.
 * All hand-drawn inline SVG; no photos, no external assets.
 * Reimplemented from the V7 system — home-v8 never imports
 * from home-v7.
 */

/** Contour-line tile used as a background pattern (id must be unique per SVG). */
export function TopoDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={id}
        width="260"
        height="260"
        patternUnits="userSpaceOnUse"
      >
        <g
          fill="none"
          stroke="#f5f6ff"
          strokeOpacity="0.06"
          strokeWidth="1.2"
        >
          <ellipse cx="130" cy="130" rx="34" ry="26" />
          <ellipse cx="130" cy="130" rx="62" ry="48" />
          <ellipse cx="130" cy="130" rx="92" ry="72" />
          <ellipse cx="130" cy="130" rx="122" ry="96" />
          <ellipse cx="130" cy="130" rx="152" ry="120" />
          <path d="M-20 250 C 60 210, 180 260, 280 220" />
          <path d="M-20 20 C 80 60, 170 -10, 280 30" />
        </g>
      </pattern>
    </defs>
  );
}

/** US-route-style shield badge with ROUTE 145 on it. */
export function RouteShield({
  className,
  width = 84,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      width={width}
      height={(width * 88) / 84}
      viewBox="0 0 84 88"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M42 2 78 12v34c0 18-14 32-36 40C20 78 6 64 6 46V12L42 2Z"
        fill="#101525"
        stroke="#8b7cff"
        strokeWidth="3"
      />
      <path
        d="M42 7 73 15.5V46c0 15-12 27-31 34C23 73 11 61 11 46V15.5L42 7Z"
        fill="#8b7cff"
      />
      <text
        x="42"
        y="30"
        textAnchor="middle"
        fontFamily="Anta, 'Space Grotesk', sans-serif"
        fontSize="11"
        fontWeight="400"
        letterSpacing="2.5"
        fill="#f5f6ff"
      >
        ROUTE
      </text>
      <text
        x="42"
        y="62"
        textAnchor="middle"
        fontFamily="Anta, 'Space Grotesk', sans-serif"
        fontSize="30"
        fontWeight="400"
        fill="#f5f6ff"
      >
        145
      </text>
    </svg>
  );
}

/** Small checkered flag on a pole. */
export function CheckeredFlag({
  className,
  width = 34,
}: {
  className?: string;
  width?: number;
}) {
  const cell = 7;
  const squares: Array<[number, number, boolean]> = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      squares.push([c, r, (r + c) % 2 === 0]);
    }
  }
  return (
    <svg
      width={width}
      height={(width * 34) / 34}
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="2.5" height="30" fill="#f5f6ff" />
      {squares.map(([c, r, dark]) => (
        <rect
          key={`${r}-${c}`}
          x={5 + c * cell}
          y={3 + r * cell}
          width={cell}
          height={cell}
          fill={dark ? "#101525" : "#f5f6ff"}
          stroke="#8b7cff"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}

/** The three rideable vehicles — simple flat SVG, ink + violet. */
export function VehicleIcon({
  kind,
  className,
  width = 72,
}: {
  kind: VehicleKind;
  className?: string;
  width?: number;
}) {
  if (kind === "van") {
    return (
      <svg
        width={width}
        height={(width * 40) / 72}
        viewBox="0 0 72 40"
        fill="none"
        aria-hidden
        className={className}
      >
        <path
          d="M4 30V12a4 4 0 0 1 4-4h38a4 4 0 0 1 4 4v18H4Z"
          fill="#f5f6ff"
        />
        <path d="M50 14h10l8 8v8H50V14Z" fill="#f5f6ff" />
        <rect x="10" y="13" width="12" height="8" rx="1.5" fill="#101525" />
        <rect x="26" y="13" width="12" height="8" rx="1.5" fill="#101525" />
        <rect x="53" y="16" width="7" height="6" rx="1" fill="#101525" />
        <rect x="4" y="30" width="64" height="3" fill="#8b7cff" />
        <circle cx="18" cy="33" r="5" fill="#101525" stroke="#f5f6ff" strokeWidth="2" />
        <circle cx="54" cy="33" r="5" fill="#101525" stroke="#f5f6ff" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "bike") {
    return (
      <svg
        width={width}
        height={(width * 40) / 72}
        viewBox="0 0 72 40"
        fill="none"
        aria-hidden
        className={className}
      >
        <circle cx="14" cy="29" r="9" stroke="#f5f6ff" strokeWidth="3" fill="none" />
        <circle cx="56" cy="29" r="9" stroke="#f5f6ff" strokeWidth="3" fill="none" />
        <path
          d="M14 29 28 12h16l12 17M28 12l-6 17h22M44 12l-4 8"
          stroke="#8b7cff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M26 10h8" stroke="#f5f6ff" strokeWidth="3" strokeLinecap="round" />
        <path d="M56 29l4-12" stroke="#f5f6ff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      width={width}
      height={(width * 40) / 72}
      viewBox="0 0 72 40"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M10 30v-6c0-2 1.5-3.5 3.5-3.8L24 19l6-8a4 4 0 0 1 3.2-1.6h12a4 4 0 0 1 3 1.4l6 7.2h6a4 4 0 0 1 4 4v8H10Z"
        fill="#f5f6ff"
      />
      <path d="M32 19.5 37 12h7l-1.5 7.5H32Z" fill="#101525" />
      <path d="M48 19.5 51 12h2.5l5 6.5-1 1H48Z" fill="#101525" />
      <rect x="10" y="30" width="54" height="2.5" fill="#8b7cff" />
      <circle cx="21" cy="33" r="5" fill="#101525" stroke="#f5f6ff" strokeWidth="2" />
      <circle cx="52" cy="33" r="5" fill="#101525" stroke="#f5f6ff" strokeWidth="2" />
    </svg>
  );
}
