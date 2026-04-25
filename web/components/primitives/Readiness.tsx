// Readiness — port of project/components.jsx Readiness.
// Uses an onClick callback (consumer opens the readiness drawer) instead of
// the prototype's window event dispatch.

"use client";

import type { MouseEvent } from "react";

export interface ReadinessProps {
  score: number;
  onClick?: () => void;
}

type Tone = "green" | "yellow" | "red";

function tone(score: number): Tone {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

const FILL_CLASS: Record<Tone, string> = {
  green: "bg-green-dot",
  yellow: "bg-yellow-dot",
  red: "bg-red-dot",
};

export function Readiness({ score, onClick }: ReadinessProps) {
  const t = tone(score);
  const handle = (e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onClick?.();
  };
  return (
    <span
      className={`inline-flex items-center gap-[6px] ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick ? handle : undefined}
    >
      <span className="w-[60px] h-[6px] rounded-[3px] bg-border overflow-hidden">
        <span
          className={`block h-full rounded-[3px] ${FILL_CLASS[t]}`}
          style={{ width: `${score}%` }}
        />
      </span>
      <span className="text-[11px] font-medium text-ink-3 tabular-nums">{score}%</span>
    </span>
  );
}
