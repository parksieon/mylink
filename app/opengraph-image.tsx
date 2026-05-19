import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "박시언 — TimeFilm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const imageBuffer = fs.readFileSync(
    path.join(process.cwd(), "public", "CelloIMG.png")
  );
  const celloDataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fafafa 0%, #f4f4f5 50%, #e4e4e7 100%)",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: "9999px",
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            marginBottom: 36,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={celloDataUrl} width={160} height={160} alt="" />
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#09090b",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            textAlign: "center",
          }}
        >
          박시언의 TimeFilm
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 30,
            color: "#52525b",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          광운대 정보융합학부 22학번
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#71717a",
            letterSpacing: "0.02em",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "9999px",
              background: "#18181b",
            }}
          />
          TimeFilm
        </div>
      </div>
    ),
    { ...size }
  );
}
