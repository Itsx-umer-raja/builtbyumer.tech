// Repairs the Landing.tsx structure after the footer edit:
// 1) closes the contact section before the footer
// 2) moves the orphaned landing CSS into a style block inside WorksSection
const fs = require("fs");
const p = "src/components/daiki/Landing.tsx";
let s = fs.readFileSync(p, "utf8");

// 1) close the contact section before the footer
s = s.replace(
  "      </footer>\n    </div>\n  );\n}\n        .dbu {",
  "      </section>\n      </footer>\n    </div>\n  );\n}\n        .dbu {",
);

// 2) extract the orphaned CSS (from `.dbu {` right after the landing close
//    to the `</style>` that follows) and remove the orphan tail
const startMark = "  );\n}\n        .dbu {";
const a = s.indexOf(startMark);
if (a === -1) {
  console.log("orphan start not found — nothing to do");
  process.exit(0);
}
const cssStart = a + "  );\n}\n".length;
const styleEnd = s.indexOf("</style>", cssStart);
const orphanEnd = s.indexOf(");", styleEnd) + 2; // end of the duplicated `);`
const cssText = s.slice(cssStart, s.indexOf("</style>", cssStart));

// remove the orphan from its current position
s = s.slice(0, a + "  );\n}".length) + s.slice(orphanEnd);

// 3) insert the CSS into WorksSection (rendered on the page) before </section>
const wEnd = s.lastIndexOf("    </section>\n  );\n}");
if (wEnd === -1) {
  console.log("works section end not found");
  process.exit(1);
}
s =
  s.slice(0, wEnd) +
  "      <style jsx global>{`\n" +
  cssText +
  "      `}</style>\n" +
  s.slice(wEnd);

fs.writeFileSync(p, s);
console.log("repaired — CSS moved into WorksSection");
