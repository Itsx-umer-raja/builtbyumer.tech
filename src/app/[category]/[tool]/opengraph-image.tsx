import { ImageResponse } from "next/og";
import { TOOL_MAP } from "@/data/tools";
import { CATEGORY_MAP } from "@/data/categories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = "BuiltByUmer — free online tool";

export default async function OpengraphImage({
  params,
}: {
  params: { category: string; tool: string };
}) {
  const tool = TOOL_MAP[params.tool];
  const category = CATEGORY_MAP[params.category];
  const title = tool?.title ?? "Free online tool";
  const cat = tool?.category && CATEGORY_MAP[tool.category]?.name ? CATEGORY_MAP[tool.category].name : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ECEAE4 0%, #E2E0DA 60%, #DCE5DA 100%)",
          padding: "72px 84px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #163D2B",
              borderRadius: 8,
              color: "#163D2B",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#121212", letterSpacing: "0.08em" }}>
            BUILTBYUMER
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "#163D2B", letterSpacing: "0.06em" }}>
            {cat.toUpperCase()} TOOL
          </div>
        </div>

        <div
          style={{
            fontSize: title.length > 24 ? 72 : 96,
            fontWeight: 700,
            color: "#121212",
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            display: "flex",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#6d6d66", maxWidth: 700 }}>
            Free · Private · Runs entirely in your browser
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#121212",
              background: "#C6F35C",
              padding: "12px 28px",
              borderRadius: 999,
            }}
          >
            builtbyumer.tech
          </div>
        </div>
      </div>
    ),
    size,
  );
}
