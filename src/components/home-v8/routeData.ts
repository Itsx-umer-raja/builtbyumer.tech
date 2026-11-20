import {
  CATEGORIES,
  CATEGORY_MAP,
  type Category,
} from "@/data/categories";
import { TOOLS, TOOL_MAP, toolsByCategory, type Tool } from "@/data/tools";

/**
 * Route 145 — the journey data (V8). Everything factual (names,
 * counts, routes, tool order) comes from src/data; the stop
 * nicknames and story hooks are editorial design labels, not
 * factual claims. Reimplemented from the V7 system — home-v8
 * never imports from home-v7.
 */

export interface Stop {
  index: number; // 1-based stop number on the route
  slug: string;
  name: string;
  nickname: string;
  short: string;
  description: string;
  count: number;
  /** First five tools of the category, in registry order. */
  topTools: Tool[];
  /** Position of the pin along the hub road, 0 = START, 1 = DONE. */
  pinT: number;
}

const NICKNAMES: Record<string, string> = {
  "pdf-tools": "The Land of Paperwork",
  "image-tools": "The Valley of Pixels",
  "qr-tools": "The Signpost Stop",
  "network-tools": "The Signal Hills",
  "developer-tools": "The Code Canyon",
  "text-tools": "The Word Plains",
  calculators: "The Number Fields",
  "data-tools": "The Data Depot",
  "business-tools": "The Main Street",
  "productivity-tools": "The Fast Lane",
};

export const STOPS: Stop[] = CATEGORIES.map((c: Category, i: number) => {
  const tools = toolsByCategory(c.slug);
  return {
    index: i + 1,
    slug: c.slug,
    name: c.name,
    nickname: NICKNAMES[c.slug] ?? c.name,
    short: c.short,
    description: c.description,
    count: tools.length,
    topTools: tools.slice(0, 5),
    pinT:
      i === 0
        ? 0.03
        : i === CATEGORIES.length - 1
          ? 0.97
          : 0.08 + (i / (CATEGORIES.length - 1)) * 0.84,
  };
});

export const STOP_MAP: Record<string, Stop> = Object.fromEntries(
  STOPS.map((s) => [s.slug, s]),
);

/** The ten most-used tools, in registry order — the roadside stories. */
export const POPULAR_IDS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "image-resizer",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
  "word-counter",
  "age-calculator",
  "unit-converter",
];

const STORY_HOOKS: Record<string, string> = {
  "merge-pdf": "Three files walk in. One file walks out.",
  "compress-pdf": "Same document. A fraction of the weight.",
  "image-compressor": "Shrink the photo, keep the picture.",
  "image-resizer": "Exact pixels, no guesswork.",
  "qr-code-generator": "One scan, and you're there.",
  "password-generator": "A password nobody can guess — not even you.",
  "json-formatter": "Messy JSON, made readable in one click.",
  "word-counter": "Every word counted as you type.",
  "age-calculator": "Your exact age, down to the day.",
  "unit-converter": "Miles to kilometres before you finish the sentence.",
};

export interface Story {
  /** Cumulative number across the whole route, in registry order. */
  num: string; // "001".."010"
  tool: Tool;
  hook: string;
  stop: Stop;
}

export const STORIES: Story[] = POPULAR_IDS.map((id) => TOOL_MAP[id])
  .filter((t): t is Tool => Boolean(t))
  .map((tool) => ({ tool, index: TOOLS.indexOf(tool) }))
  .sort((a, b) => a.index - b.index)
  .map(({ tool }, i) => ({
    num: String(i + 1).padStart(3, "0"),
    tool,
    hook: STORY_HOOKS[tool.id] ?? tool.description,
    stop: STOP_MAP[tool.category] ?? STOPS[0],
  }));

export const DETOUR_IDS = POPULAR_IDS;

export const TRIVIA: string[] = [
  "145 free tools live on this road.",
  "181 pages — every one of them free.",
  "Your files never leave your device.",
  "No account. No upload. No catch.",
  "10 stops, from PDF Town to the Fast Lane.",
];

export type VehicleKind = "van" | "car" | "bike";

export const VEHICLES: Array<{
  kind: VehicleKind;
  label: string;
  blurb: string;
}> = [
  {
    kind: "van",
    label: "The Camper Van",
    blurb: "Slow, steady, carries everything.",
  },
  {
    kind: "car",
    label: "The Roadster",
    blurb: "The classic. Top down, radio up.",
  },
  {
    kind: "bike",
    label: "The Cruiser",
    blurb: "Two wheels, no traffic, all breeze.",
  },
];

export const PASSPORT_KEY = "bbu-route145-passport";
export const VEHICLE_KEY = "bbu-route145-vehicle";

export { CATEGORY_MAP };
