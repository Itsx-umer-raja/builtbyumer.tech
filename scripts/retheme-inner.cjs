// Re-themes the inner pages (app routes, layout, tool components) from the
// old dark-green theme to the paper editorial theme. Ordered longest-first.
const fs = require("fs");

const REPLACEMENTS = [
  // panel + bar backgrounds
  ["bg-[#0B100D]/90", "bg-[#ECEAE4]/90"],
  ["bg-[#0B100D]/80", "bg-[#ECEAE4]/80"],
  ["bg-[#0B100D]", "bg-[#ECEAE4]"],
  ["bg-forest/40", "bg-white"],
  ["bg-forest/30", "bg-white"],
  ["bg-black/20", "bg-[#f6f1e6]"],
  ["bg-black/25", "bg-white"],
  ["bg-black/10", "bg-[#121212]/5"],
  ["bg-black/5", "bg-[#121212]/5"],
  ["bg-black/40", "bg-[#121212]/40"],
  // borders
  ["border-white/10", "border-[#121212]/12"],
  ["border-white/15", "border-[#121212]/15"],
  ["border-white/25", "border-[#121212]/25"],
  ["border-white/30", "border-[#121212]/30"],
  ["border-white/40", "border-[#121212]/40"],
  // lime accents (unreadable on paper → forest)
  ["text-lime/80", "text-[#163D2B]"],
  ["text-lime/70", "text-[#163D2B]"],
  ["text-lime", "text-[#163D2B]"],
  ["text-[#C6F35C]", "text-[#163D2B]"],
  ["bg-lime/15", "bg-[#163D2B]/10"],
  ["bg-lime/10", "bg-[#163D2B]/10"],
  ["bg-lime/5", "bg-[#163D2B]/5"],
  ["border-lime/60", "border-[#163D2B]/60"],
  ["border-lime/50", "border-[#163D2B]/50"],
  ["border-lime/40", "border-[#163D2B]/40"],
  ["border-lime/30", "border-[#163D2B]/30"],
  ["border-lime/25", "border-[#163D2B]/25"],
  // white text → ink
  ["text-white/80", "text-[#121212]/75"],
  ["text-white/70", "text-[#121212]/70"],
  ["text-white/60", "text-[#121212]/60"],
  ["text-white/50", "text-[#121212]/55"],
  ["text-white/40", "text-[#121212]/45"],
  ["text-white", "text-[#121212]"],
  ["bg-white/10", "bg-[#121212]/5"],
  ["bg-white/15", "bg-[#121212]/10"],
  ["bg-white/20", "bg-[#121212]/10"],
  ["text-forest", "text-[#163D2B]"],
  ["hover:text-lime", "hover:text-[#163D2B]"],
  ["hover:border-lime/50", "hover:border-[#163D2B]/50"],
  ["placeholder:text-muted/60", "placeholder:text-muted"],
];

const scope = ["src/app", "src/components/layout", "src/components/tools", "src/components/advertisements"];

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = d + "/" + f.name;
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith(".tsx") || f.name.endsWith(".ts")) out.push(p);
  }
}
const files = [];
scope.forEach((s) => walk(s, files));

let total = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  for (const [from, to] of REPLACEMENTS) s = s.split(from).join(to);
  if (s !== before) {
    fs.writeFileSync(f, s);
    const n = REPLACEMENTS.reduce(
      (acc, [from]) => acc + (before.split(from).length - 1),
      0,
    );
    total += n;
    console.log(f, "→", n, "replacements");
  }
}
console.log("TOTAL:", total);
