import { ImageResponse } from "next/og";

/** Social share preview (og:image / twitter:image) for every page. */
export const alt = "PossAbilities Journey — your induction journey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: 80,
          color: "#ffffff",
          backgroundImage: "linear-gradient(135deg, #48065a, #e00085)",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700 }}>PossAbilities</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.05 }}>
            PossAbilities Journey
          </div>
          <div style={{ marginTop: 24, fontSize: 40, color: "#f5d9ff" }}>
            Your induction journey — welcome to the team.
          </div>
        </div>
        <div style={{ fontSize: 32, color: "#f5d9ff" }}>
          Live The Life You Choose
        </div>
      </div>
    ),
    size,
  );
}
