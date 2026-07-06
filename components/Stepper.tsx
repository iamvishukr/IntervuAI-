"use client";

import { motion } from "framer-motion";

const STEPS = ["Brief", "Interview", "Scorecard"];

export default function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center" aria-label={`Step ${current + 1} of 3`}>
      {STEPS.map((label, i) => (
        <div key={label} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
          {i > 0 && (
            <div className="relative mx-2 h-[2px] flex-1 overflow-hidden rounded-full bg-moss">
              <motion.div
                className="absolute inset-y-0 left-0 bg-amber"
                initial={false}
                animate={{ width: current >= i ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={false}
              animate={{
                scale: current === i ? 1.15 : 1,
                backgroundColor: current >= i ? "#F2B33D" : "#1F4033",
                color: current >= i ? "#0C1E17" : "#9DB8A6",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
            >
              {current > i ? "✓" : i + 1}
            </motion.div>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                current === i ? "text-amber" : "text-sage/70"
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
