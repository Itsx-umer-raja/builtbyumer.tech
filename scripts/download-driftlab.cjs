// Downloads Driftlab media (sky, jellyfish still + green-screen video) locally.
const https = require("https");
const fs = require("fs");

function get(url, out, cb) {
  const follow = (u) => {
    https
      .get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return follow(new URL(res.headers.location, u).toString());
        }
        if (res.statusCode !== 200) {
          console.log(out, "HTTP", res.statusCode);
          return cb(new Error("HTTP " + res.statusCode));
        }
        const f = fs.createWriteStream(out);
        res.pipe(f);
        f.on("finish", () => {
          f.close();
          console.log(out, "ok", Math.round(fs.statSync(out).size / 1024) + "KB");
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

fs.mkdirSync("public/videos", { recursive: true });
fs.mkdirSync("public/images", { recursive: true });

const jobs = [
  [HIGGS(CF + "hf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png", 1920, 80), "public/images/driftlab-sky.webp"],
  [HIGGS(CF + "hf_20261102_045249_4f7fe287-c84b-479f-a953-04990fe1a3ac.png", 1080, 85), "public/images/driftlab-still.webp"],
  [CF + "hf_20261102_045327_a6584765-3154-43e6-b1c9-4e574f83a811.mp4", "public/videos/driftlab-jelly.mp4"],
];

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
