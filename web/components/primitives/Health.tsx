// Health — port of project/styles.css .health pill.
// Dot + label, rounded-pill, three tones.

import type { ReactNode } from "react";

export type HealthTone = "green" | "yellow" | "red";

export interface HealthProps {
  tone: HealthTone;
  children: ReactNode;
  className?: string;
}

const PILL_CLASS: Record<HealthTone, string> = {
  green: "bg-green-bg text-green-text-2",
  yellow: "bg-yellow-bg text-yellow-text",
  red: "bg-red-bg text-red-text-2",
};

const DOT_CLASS: Record<HealthTone, string> = {
  green: "bg-green-dot",
  yellow: "bg-yellow-dot",
  red: "bg-red-dot",
};

const BASE =
  "inline-flex items-center gap-[6px] pl-[7px] pr-[8px] py-[3px] rounded-pill text-sm font-medium";

export function Health({ tone, children, className = "" }: HealthProps) {
  return (
    <span className={`${BASE} ${PILL_CLASS[tone]} ${className}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${DOT_CLASS[tone]}`} aria-hidden />
      {children}
    </span>
  );
}
