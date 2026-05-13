import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "박시언 — MyLink";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CELLO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5a1.5 1.5 0 1 1 2 0v1h-2z"/><path d="M12 3.5v6.5"/><path d="M10.5 10h3"/><path d="M12 10c-2.6 0-4 1.4-4 2.8 0 .9.4 1.4.9 1.9-1.2.6-1.9 2-1.9 3.5 0 2.1 1.7 3.8 5 3.8s5-1.7 5-3.8c0-1.5-.7-2.9-1.9-3.5.5-.5.9-1 .9-1.9 0-1.4-1.4-2.8-4-2.8z"/><path d="M10 15.5v2"/><path d="M14 15.5v2"/></svg>`;

export default async function OpengraphImage() {
  const celloDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(CELLO_SVG)}`;

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
            width: 180,
            height: 180,
            borderRadius: "9999px",
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            marginBottom: 36,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={celloDataUrl} width={110} height={110} alt="" />
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
          박시언의 MyLink
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
          MyLink
        </div>
      </div>
    ),
    { ...size }
  );
}
