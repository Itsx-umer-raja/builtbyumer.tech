/**
 * Portfolio records for the VHS shelf experience.
 *
 * The twelve visual entries use the supplied Leon Vasari artwork sheets
 * as design-reference placeholders. They are DEMO records: they represent
 * slots for real BuiltByUmer projects and are clearly labelled as such in
 * the detail view. Replace the fields below with real project information
 * when available — the shelf, crops and interactions stay untouched.
 */

export interface SheetRef {
  src: string;
  w: number;
  h: number;
}

/** Supplied artwork sheets (all downloaded to /public/portfolio). */
export const SHEETS = {
  covers: { src: "/portfolio/vhs-covers.png", w: 1744, h: 2336 },
  spines: { src: "/portfolio/vhs-spines.png", w: 2688, h: 1152 },
  fixRiver: { src: "/portfolio/vhs-spines-fix-river.png", w: 1520, h: 2688 },
  fix2ObserverStorm: { src: "/portfolio/vhs-spines-fix2-observer-storm.png", w: 1520, h: 2688 },
} as const satisfies Record<string, SheetRef>;

export interface Crop {
  sheet: SheetRef;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PortfolioEntry {
  id: string;
  /** Title printed on the reference artwork. */
  artworkTitle: string;
  /** Demo project metadata (clearly labelled in the UI). */
  project: string;
  category: string;
  year: string;
  description: string;
  spine: Crop;
  cover: Crop;
}

const S = SHEETS;

/** Spec crop coordinates: x, y, width, height. */
export const PORTFOLIO: PortfolioEntry[] = [
  {
    id: "noon",
    artworkTitle: "Noon in Ashes",
    project: "Project slot 01 — DEMO",
    category: "Web application",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 44, y: 32, w: 184, h: 1088 },
    cover: { sheet: S.covers, x: 74, y: 72, w: 347, h: 659 },
  },
  {
    id: "valley",
    artworkTitle: "The Silent Valley",
    project: "Project slot 02 — DEMO",
    category: "SaaS project",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 266, y: 31, w: 189, h: 1089 },
    cover: { sheet: S.covers, x: 497, y: 72, w: 344, h: 659 },
  },
  {
    id: "bluehour",
    artworkTitle: "The Blue Hour",
    project: "Project slot 03 — DEMO",
    category: "Interface study",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 492, y: 31, w: 189, h: 1089 },
    cover: { sheet: S.covers, x: 914, y: 72, w: 342, h: 659 },
  },
  {
    id: "river",
    artworkTitle: "River of Salt",
    project: "Project slot 04 — DEMO",
    category: "Legal education platform",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.fixRiver, x: 197, y: 54, w: 324, h: 2566 },
    cover: { sheet: S.covers, x: 1332, y: 72, w: 344, h: 659 },
  },
  {
    id: "summer",
    artworkTitle: "The Last Summer",
    project: "Project slot 05 — DEMO",
    category: "Desktop application",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 937, y: 31, w: 188, h: 1089 },
    cover: { sheet: S.covers, x: 74, y: 813, w: 344, h: 676 },
  },
  {
    id: "green",
    artworkTitle: "The Green Road",
    project: "Project slot 06 — DEMO",
    category: "Tool experiment",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 1157, y: 31, w: 185, h: 1090 },
    cover: { sheet: S.covers, x: 497, y: 815, w: 344, h: 674 },
  },
  {
    id: "observer",
    artworkTitle: "The Observer",
    project: "Project slot 07 — DEMO",
    category: "Web application",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.fix2ObserverStorm, x: 371, y: 15, w: 349, h: 2655 },
    cover: { sheet: S.covers, x: 915, y: 815, w: 342, h: 675 },
  },
  {
    id: "birds",
    artworkTitle: "The Fallen Birds",
    project: "Project slot 08 — DEMO",
    category: "SaaS project",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 1573, y: 31, w: 183, h: 1089 },
    cover: { sheet: S.covers, x: 1331, y: 815, w: 345, h: 675 },
  },
  {
    id: "storm",
    artworkTitle: "Light in the Storm",
    project: "Project slot 09 — DEMO",
    category: "Developer tool",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.fix2ObserverStorm, x: 808, y: 15, w: 347, h: 2656 },
    cover: { sheet: S.covers, x: 74, y: 1571, w: 345, h: 681 },
  },
  {
    id: "tide",
    artworkTitle: "The Long Tide",
    project: "Project slot 10 — DEMO",
    category: "Data platform",
    year: "2025",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 2012, y: 31, w: 188, h: 1089 },
    cover: { sheet: S.covers, x: 496, y: 1577, w: 343, h: 678 },
  },
  {
    id: "war",
    artworkTitle: "A Quiet War",
    project: "Project slot 11 — DEMO",
    category: "Experiment",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 2236, y: 31, w: 189, h: 1089 },
    cover: { sheet: S.covers, x: 913, y: 1579, w: 343, h: 676 },
  },
  {
    id: "door",
    artworkTitle: "Red Door",
    project: "Project slot 12 — DEMO",
    category: "Visual experiment",
    year: "2026",
    description:
      "Placeholder record demonstrating the portfolio shelf. Replace this entry in src/data/portfolio.ts with a real BuiltByUmer project — title, category, year and description — and the shelf updates automatically.",
    spine: { sheet: S.spines, x: 2462, y: 31, w: 188, h: 1089 },
    cover: { sheet: S.covers, x: 1331, y: 1579, w: 344, h: 677 },
  },
];

/** Filters styled like decade tabs — one per project category. */
export const PORTFOLIO_FILTERS = [
  "All",
  ...Array.from(new Set(PORTFOLIO.map((e) => e.category))),
];
