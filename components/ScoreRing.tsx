"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const R = 62;
const CIRC = 2 * Math.PI * R;

export default function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? clamped : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(clamped);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * clamped));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped, reduce]);

  const color = clamped >= 75 ? "#F2B33D" : clamped >= 50 ? "#9DB8A6" : "#E2654E";

  return (
    <div className="relative h-40 w-40" role="img" aria-label={`Overall score ${clamped} out of 100`}>
      <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
        <circle cx="75" cy="75" r={R} fill="none" stroke="#1F4033" strokeWidth="9" />
        <motion.circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC * (1 - clamped / 100) }}
          transition={{ duration: reduce ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold tabular-nums">{display}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sage">/ 100</span>
      </div>
    </div>
  );
}
