import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuiltByUmer — Every tool. One destination.",
    short_name: "BuiltByUmer",
    description:
      "145 free browser-based tools: convert documents, compress images, create QR codes and simplify everyday digital work.",
    start_url: "/",
    display: "standalone",
    background_color: "#ECEAE4",
    theme_color: "#0C0C0D",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
