// StatusChip — port of project/components.jsx StatusChip.
// Looks up label + class from DATA.statuses for work-item statuses,
// plus a parallel question-state map for "open" / "answered" / "parked".
// 10.5px font, otherwise matches Chip layout.

import { DATA } from "@/lib/data";
import type { QuestionState, WIStatus } from "@/lib/types";

type AnyStatus = WIStatus | QuestionState;

interface StatusEntry {
  label: string;
  className: string;
}

const QUESTION_STATES: Record<QuestionState, StatusEntry> = {
  open: { label: "Open", className: "bg-yellow-bg text-yellow-text-2" },
  answered: { label: "Answered", className: "bg-green-bg text-green-text" },
  parked: { label: "Parked", className: "bg-stripe text-ink-3" },
};

// Mirrors the .status-* classes in project/styles.css → Tailwind tokens.
const WI_STATUS_CLASS: Record<WIStatus, string> = {
  draft: "bg-stripe text-ink-3",
  ready: "bg-blue-bg text-blue-text",
  sprint: "bg-violet-bg text-violet-text",
  progress: "bg-amber-bg text-yellow-text-2",
  review: "bg-orange-bg text-orange-text",
  qa: "bg-pink-bg text-pink-text",
  done: "bg-green-bg text-green-text",
  blocked: "bg-red-bg text-red-text",
};

export interface StatusChipProps {
  status: AnyStatus;
}

const BASE =
  "inline-flex items-center gap-[4px] px-[7px] py-[2px] rounded-sm text-[10.5px] font-medium whitespace-nowrap";

function lookup(status: AnyStatus): StatusEntry | null {
  if (status in QUESTION_STATES) {
    return QUESTION_STATES[status as QuestionState];
  }
  const map = DATA.statuses.find((s) => s.id === status);
  if (!map) return null;
  return {
    label: map.label,
    className: WI_STATUS_CLASS[map.id] ?? "bg-stripe text-ink-3",
  };
}

export function StatusChip({ status }: StatusChipProps) {
  const entry = lookup(status);
  if (!entry) return null;
  return <span className={`${BASE} ${entry.className}`}>{entry.label}</span>;
}
