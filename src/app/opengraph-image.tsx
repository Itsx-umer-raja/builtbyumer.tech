import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BuiltByUmer — Every tool. One destination.";

export default function OpengraphImage() {
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
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#121212", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Every tool.
          </div>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#163D2B", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            One destination.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#6d6d66" }}>
            145 free tools · PDF · Images · QR · Code · Calculators
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
