// KanbanCard — port of project/styles.css .kcard.
// Renders one work-item card on the Board lens.

"use client";

import { Avatar } from "@/components/primitives";
import type { WorkItem } from "@/lib/types";

export interface KanbanCardProps {
  wi: WorkItem;
  onClick?: () => void;
}

export function KanbanCard({ wi, onClick }: KanbanCardProps) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-border bg-surface px-[10px] py-[8px] shadow-card hover:border-border-hover"
      onClick={onClick}
    >
      <div className="mono mb-[4px] text-xs text-muted">{wi.id}</div>
      <div className="mb-[6px] text-base font-medium leading-[1.3] text-ink">
        {wi.title}
      </div>
      <div className="flex items-center gap-[6px]">
        {wi.assignee ? (
          <Avatar person={wi.assignee} size="xs" />
        ) : (
          <span className="text-sm text-muted">unassigned</span>
        )}
        <span className="ml-auto text-xs font-semibold text-muted">{wi.points}</span>
      </div>
    </div>
  );
}
