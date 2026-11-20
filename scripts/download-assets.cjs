// Downloads the supplied remote assets into public/ so the site is
// self-contained and does not depend on temporary CDN links.
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

function get(url, out, cb) {
  const mod = url.startsWith("https") ? https : http;
  const follow = (u) => {
    mod
      .get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) {
          console.log(out, "HTTP", res.statusCode);
          return cb(new Error("HTTP " + res.statusCode));
        }
        const f = fs.createWriteStream(out);
        res.pipe(f);
        f.on("finish", () => {
          f.close();
          console.log(out, "ok", fs.statSync(out).size, "bytes");
          cb(null);
        });
      })
      .on("error", (e) => {
        console.log(out, "ERR", e.message);
        cb(e);
      });
  };
  follow(url);
}

const HIGGS = (u, w, q) =>
  `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(u)}&w=${w}&q=${q}`;
const CF = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/";

const jobs = [
  [
    "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4",
    "public/videos/valley-hero.mp4",
  ],
  [CF + "hf_20261106_025717_906b686d-9a9a-4dea-bab4-ae2454f8390e.mp4", "public/videos/mossline-flyin.mp4"],
  [
    HIGGS(CF + "hf_20261106_031618_8ce6dca1-972d-429d-8d13-bf0691c37848.png", 2400, 88),
    "public/images/mossline-hero-island.webp",
  ],
  [
    HIGGS(CF + "hf_20261106_031657_baaa3380-5ece-482a-a623-a1838fd7653c.png", 2400, 90),
    "public/images/mossline-island-cutout.webp",
  ],
  [
    HIGGS(CF + "hf_20261106_025635_82593f6a-1cf7-41c1-94ac-96fb89ebfd1a.png", 2400, 85),
    "public/images/mossline-rocks-sheet.webp",
  ],
  [
    HIGGS(CF + "hf_20261106_025630_9a37a1e0-2547-4973-8160-c75205993914.png", 1400, 82),
    "public/images/mossline-sensor-mast.webp",
  ],
  [
    HIGGS(CF + "hf_20261106_025545_b003e5cc-e68f-4fee-b686-c217a5d81eea.png", 1400, 82),
    "public/images/mossline-island-clouds.webp",
  ],
  // Leon Vasari sheets
  [
    HIGGS(CF + "hf_20261029_010644_837e04ca-2418-45c1-b8e0-0233265c4cd5.png", 1744, 85),
    "public/portfolio/vhs-covers.png",
  ],
  [
    HIGGS(CF + "hf_20261029_010738_a3e47ead-18f2-4974-9468-06d16a25edc5.png", 2688, 85),
    "public/portfolio/vhs-spines.png",
  ],
  [
    HIGGS(CF + "hf_20261029_010831_3ebb874b-93dc-433e-87ed-6299aba720f0.png", 1520, 85),
    "public/portfolio/vhs-spines-fix-river.png",
  ],
  [
    HIGGS(CF + "hf_20261029_092020_f96bc094-db7b-46de-9298-074a24e0a3b8.png", 1520, 85),
    "public/portfolio/vhs-spines-fix2-observer-storm.png",
  ],
];

fs.mkdirSync("public/videos", { recursive: true });
fs.mkdirSync("public/images", { recursive: true });
fs.mkdirSync("public/portfolio", { recursive: true });

let i = 0;
let failed = 0;
(function next() {
  if (i >= jobs.length) {
    console.log(failed === 0 ? "ALL DONE" : `DONE WITH ${failed} FAILURES`);
    return;
  }
  const [u, o] = jobs[i++];
  get(u, o, (err) => {
    if (err) failed++;
    next();
  });
})();
