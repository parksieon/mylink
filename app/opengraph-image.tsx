import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MyLink — 나만의 링크를 한곳에";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
            width: 128,
            height: 128,
            borderRadius: "9999px",
            background: "#18181b",
            color: "#fafafa",
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          H
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#09090b",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            textAlign: "center",
          }}
        >
          홍길동의 MyLink
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#52525b",
            letterSpacing: "-0.02em",
          }}
        >
          관심 있는 모든 채널을 한 곳에서
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
