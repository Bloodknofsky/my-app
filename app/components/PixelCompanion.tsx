"use client";

// A small, hand-drawn pixel-art mascot — original artwork/code, not from any
// third-party "pixel agent" tool. Purely decorative (aria-hidden); reacts to
// the chatbot's real `thinking` state rather than running on its own timer.

const T = null; // transparent
const B = "B"; // body
const D = "D"; // dark shading
const V = "V"; // visor
const A = "A"; // antenna

const COLOR_BODY = "#2563eb"; // blue-600
const COLOR_DARK = "#1e3a8a"; // blue-900
const COLOR_VISOR = "#bfdbfe"; // blue-200
const COLOR_ANTENNA = "#f59e0b"; // amber-500

// 12x14 pixel grid of a small robot. Each cell is a color key or null (transparent).
const SPRITE: (string | null)[][] = [
  [T, T, T, T, T, A, A, T, T, T, T, T],
  [T, T, T, T, T, A, A, T, T, T, T, T],
  [T, T, T, T, B, B, B, B, T, T, T, T],
  [T, T, T, B, B, B, B, B, B, T, T, T],
  [T, T, T, B, V, V, V, V, B, T, T, T],
  [T, T, T, B, V, D, V, D, B, T, T, T],
  [T, T, T, B, V, V, V, V, B, T, T, T],
  [T, T, T, B, B, B, B, B, B, T, T, T],
  [T, T, T, T, B, B, B, B, T, T, T, T],
  [T, T, B, B, T, B, B, T, B, B, T, T],
  [T, T, B, B, T, B, B, T, B, B, T, T],
  [T, T, B, B, T, T, T, T, B, B, T, T],
  [T, T, T, T, T, D, D, T, T, T, T, T],
  [T, T, T, T, T, D, D, T, T, T, T, T],
];

function paletteFor(key: string | null): string | null {
  switch (key) {
    case "B":
      return COLOR_BODY;
    case "D":
      return COLOR_DARK;
    case "V":
      return COLOR_VISOR;
    case "A":
      return COLOR_ANTENNA;
    default:
      return null;
  }
}

const PIXEL = 4; // px per grid cell

function spriteBoxShadow(): string {
  const shadows: string[] = [];
  SPRITE.forEach((row, y) => {
    row.forEach((cell, x) => {
      const color = paletteFor(cell);
      if (color) {
        shadows.push(`${x * PIXEL}px ${y * PIXEL}px 0 0 ${color}`);
      }
    });
  });
  return shadows.join(", ");
}

export default function PixelCompanion({ thinking = false }: { thinking?: boolean }) {
  const spriteWidth = SPRITE[0].length * PIXEL;
  const spriteHeight = SPRITE.length * PIXEL;

  return (
    <div aria-hidden="true" className="pointer-events-none select-none flex flex-col items-center gap-2">
      {thinking && (
        <div className="flex gap-1">
          <span className="pixel-dot" style={{ animationDelay: "0ms" }} />
          <span className="pixel-dot" style={{ animationDelay: "150ms" }} />
          <span className="pixel-dot" style={{ animationDelay: "300ms" }} />
        </div>
      )}
      <div
        className={thinking ? "pixel-bot pixel-bot-thinking" : "pixel-bot pixel-bot-idle"}
        style={{
          width: spriteWidth,
          height: spriteHeight,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: PIXEL,
            height: PIXEL,
            boxShadow: spriteBoxShadow(),
          }}
        />
      </div>
      <style>{`
        .pixel-bot {
          image-rendering: pixelated;
        }
        .pixel-bot-idle {
          animation: pixel-bob 2.4s ease-in-out infinite;
        }
        .pixel-bot-thinking {
          animation: pixel-bob 0.6s ease-in-out infinite;
        }
        @keyframes pixel-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .pixel-dot {
          width: ${PIXEL}px;
          height: ${PIXEL}px;
          background: #1e3a8a;
          display: inline-block;
          animation: pixel-dot-bounce 0.9s ease-in-out infinite;
        }
        @keyframes pixel-dot-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pixel-bot-idle, .pixel-bot-thinking, .pixel-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
