"use client";

import { useEffect, useState } from "react";

const COLOURS = [
  "#ec008c",
  "#48065a",
  "#66cccc",
  "#f2afff",
  "#ffb0cc",
  "#2ecc71",
  "#ffd166",
];

interface Piece {
  left: number;
  size: number;
  colour: string;
  delay: number;
  dur: number;
  drift: number;
  spin: number;
  round: boolean;
}

/** A one-off burst of brand-coloured confetti scattered over the page. */
export function Confetti({
  count = 140,
  burstKey = 0,
}: {
  count?: number;
  burstKey?: number;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    // Generated after mount so server and client markup match.
    const next = Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      delay: Math.random() * 1.2,
      dur: 2.6 + Math.random() * 2.2,
      drift: (Math.random() - 0.5) * 240,
      spin: 360 + Math.random() * 900,
      round: Math.random() < 0.3,
    }));
    const show = setTimeout(() => setPieces(next), 0);
    const hide = setTimeout(() => setPieces([]), 6500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [count, burstKey]);

  return (
    <div aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={`${burstKey}-${i}`}
          className="confetti-piece"
          style={
            {
              left: `${p.left}vw`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.colour,
              borderRadius: p.round ? "9999px" : "2px",
              "--delay": `${p.delay}s`,
              "--dur": `${p.dur}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
