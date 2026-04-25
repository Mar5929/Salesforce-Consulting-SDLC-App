// KanbanColumn — port of project/styles.css .kcol.
// Renders a status column on the Board lens with a header chip + cards.

"use client";

import type { ReactNode } from "react";

import type { StatusDef } from "@/lib/types";

const STATUS_HEAD_CLASS: Record<string, string> = {
  draft: "bg-stripe text-ink-3",
  ready: "bg-blue-bg text-blue-text",
  sprint: "bg-violet-bg text-violet-text",
  progress: "bg-amber-bg text-yellow-text-2",
  review: "bg-orange-bg text-orange-text",
  qa: "bg-pink-bg text-pink-text",
  done: "bg-green-bg text-green-text",
  blocked: "bg-red-bg text-red-text",
};

export interface KanbanColumnProps {
  status: StatusDef;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ status, count, children }: KanbanColumnProps) {
  const chip = STATUS_HEAD_CLASS[status.id] ?? "bg-stripe text-ink-3";
  return (
    <div className="flex min-w-0 flex-col gap-[8px] rounded-card border border-border bg-stripe p-[8px]">
      <div className="flex items-center gap-[6px] px-[4px] py-[2px] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
        <span
          className={`inline-flex items-center gap-[4px] rounded-sm px-[7px] py-[2px] text-xs font-medium ${chip}`}
        >
          {status.label}
        </span>
        <span className="ml-auto rounded-pill bg-surface px-[6px] py-[1px] text-xs font-medium normal-case tracking-normal text-muted">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
