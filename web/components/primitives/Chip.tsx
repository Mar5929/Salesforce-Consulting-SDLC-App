// Chip — port of project/components.jsx Chip.
// 11px font, 2px 7px padding, rounded-sm (4px).

import type { ReactNode } from "react";

export type ChipTone =
  | "gray"
  | "slate"
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "rose"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "teal"
  | "sky"
  | "cyan"
  | "outline";

export interface ChipProps {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<ChipTone, string> = {
  gray: "bg-stripe text-ink-3",
  slate: "bg-border text-ink-2",
  blue: "bg-blue-bg text-blue-text",
  indigo: "bg-indigo-bg-2 text-indigo-text",
  violet: "bg-violet-bg text-violet-text",
  pink: "bg-pink-bg text-pink-text",
  rose: "bg-rose-bg text-rose-text",
  red: "bg-red-bg text-red-text",
  orange: "bg-orange-bg text-orange-text",
  amber: "bg-amber-bg text-yellow-text-2",
  yellow: "bg-yellow-bg-2 text-yellow-text-3",
  lime: "bg-lime-bg text-lime-text",
  green: "bg-green-bg text-green-text",
  teal: "bg-teal-bg text-teal-text",
  sky: "bg-sky-bg text-sky-text",
  cyan: "bg-cyan-bg text-cyan-text",
  outline: "bg-surface border border-border text-ink-3",
};

const BASE =
  "inline-flex items-center gap-[4px] px-[7px] py-[2px] rounded-sm text-[11px] font-medium whitespace-nowrap";

export function Chip({ tone = "gray", children, className = "" }: ChipProps) {
  return <span className={`${BASE} ${TONE_CLASS[tone]} ${className}`}>{children}</span>;
}
