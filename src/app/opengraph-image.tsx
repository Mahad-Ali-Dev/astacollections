import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Asta Collections — Timeless jewellery, crafted with care.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #fbf6f4 0%, #f3e6e0 50%, #e9cdc1 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Soft rose-gold radial accents */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(192, 135, 117, 0.45) 0%, rgba(192, 135, 117, 0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(192, 135, 117, 0.35) 0%, rgba(192, 135, 117, 0) 70%)",
          }}
        />

        {/* Top eyebrow */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 18,
            letterSpacing: 8,
            color: "#955a4d",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 36, height: 1, background: "#955a4d" }} />
          ASTACOLLECTIONS
        </div>

        {/* Main composition */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 100px 80px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 32,
            }}
          >
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.05,
                color: "#1a1a1a",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                textWrap: "balance",
              }}
            >
              Timeless jewellery,
            </div>
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.05,
                color: "#955a4d",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                marginTop: -32,
              }}
            >
              crafted with care.
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#5f3b34",
                fontFamily: "system-ui, sans-serif",
                marginTop: 12,
                fontWeight: 400,
                letterSpacing: "0.02em",
              }}
            >
              Rings · Necklaces · Earrings · Bridal
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "30px 80px",
            background: "rgba(26, 26, 26, 0.92)",
            color: "#fbf6f4",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontWeight: 600 }}>astacollections.com</span>
          <span style={{ color: "#daab97", fontWeight: 500 }}>
            Crafted with care · Made in Pakistan
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
