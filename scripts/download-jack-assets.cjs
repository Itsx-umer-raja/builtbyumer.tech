// Downloads the Jack landing-page assets (portrait, decorations, project
// images). Reports sizes for the 21 marquee GIFs so we can decide between
// local hosting and hotlinking.
const https = require("https");
const fs = require("fs");

function head(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(head(new URL(res.headers.location, url).toString()));
        }
        const len = Number(res.headers["content-length"] || 0);
        res.resume();
        resolve({ status: res.statusCode, len });
      })
      .on("error", (e) => resolve({ status: 0, len: 0, err: e.message }));
  });
}

function get(url, out) {
  return new Promise((resolve) => {
    const follow = (u) => {
      https
        .get(u, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return follow(new URL(res.headers.location, u).toString());
          }
          if (res.statusCode !== 200) {
            console.log(out, "HTTP", res.statusCode);
            return resolve(false);
          }
          const f = fs.createWriteStream(out);
          res.pipe(f);
          f.on("finish", () => {
            f.close();
            console.log(out, "ok", Math.round(fs.statSync(out).size / 1024) + "KB");
            resolve(true);
          });
        })
        .on("error", (e) => {
          console.log(out, "ERR", e.message);
          resolve(false);
        });
    };
    follow(url);
  });
}

const FIG = "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/";
const HIGGS = (u) =>
  "https://images.higgs.ai/?default=1&output=webp&url=" + encodeURIComponent(u) + "&w=1280&q=85";
const CF = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/";

async function main() {
  fs.mkdirSync("public/jack", { recursive: true });

  // Portrait lives under a different path on the figma site.
  await get(
    "https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png",
    "public/jack/portrait.png",
  );
  await get(FIG + "moon_icon.11395d36.png", "public/jack/moon.png");
  await get(FIG + "p59_1.4659672e.png", "public/jack/object.png");
  await get(FIG + "lego_icon-1.703bb594.png", "public/jack/lego.png");
  await get(FIG + "Group_134-1.2e04f3ce.png", "public/jack/group.png");

  const projects = [
    ["hf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png", "p1-a.webp"],
    ["hf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png", "p1-b.webp"],
    ["hf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png", "p1-c.webp"],
    ["hf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png", "p2-a.webp"],
    ["hf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png", "p2-b.webp"],
    ["hf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png", "p2-c.webp"],
    ["hf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png", "p3-a.webp"],
    ["hf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png", "p3-b.webp"],
    ["hf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png", "p3-c.webp"],
  ];
  for (const [file, out] of projects) await get(HIGGS(CF + file), "public/jack/" + out);

  // Marquee GIFs — measure sizes only.
  const gifs = [
    "hero-space-voyage-preview-eECLH3Yc.gif",
    "hero-codenest-preview-Cgppc2qV.gif",
    "hero-vex-ventures-preview-BczMFIiw.gif",
    "hero-stellar-ai-v2-preview-DjvxjG3C.gif",
    "hero-asme-preview-B_nGDnTP.gif",
    "hero-transform-data-preview-Cx5OU29N.gif",
    "hero-vitara-preview-Cjz2QYyU.gif",
    "hero-terra-preview-BFjrCr7T.gif",
    "hero-skyelite-preview-DHaZIgUv.gif",
    "hero-aethera-preview-DknSlcTa.gif",
    "hero-designpro-preview-D8c5_een.gif",
    "hero-stellar-ai-preview-D3HL6bw1.gif",
    "hero-xportfolio-preview-D4A8maiC.gif",
    "hero-orbit-web3-preview-BXt4OttD.gif",
    "hero-nexora-preview-cx5HmUgo.gif",
    "hero-evr-ventures-preview-DZxeVFEX.gif",
    "hero-planet-orbit-preview-DWAP8Z1P.gif",
    "hero-new-era-preview-CocuDUm9.gif",
    "hero-wealth-preview-B70idl_u.gif",
    "hero-luminex-preview-CxOP7ce6.gif",
    "hero-celestia-preview-0yO3jXO8.gif",
  ];
  let total = 0;
  for (const g of gifs) {
    const { status, len } = await head("https://motionsites.ai/assets/" + g);
    total += len;
    console.log(g, status, Math.round(len / 1024) + "KB");
  }
  console.log("GIF TOTAL:", Math.round(total / 1024 / 1024) + "MB");
}
main();
