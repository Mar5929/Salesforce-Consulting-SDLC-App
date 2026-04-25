// Shared building blocks for the Firm Admin tab.
// Mirrors web/app/(app)/settings/_components.tsx so each tab stays self-contained.

import type { ReactNode } from "react";

export interface SectionHeadProps {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
}

export function SectionHead({ title, sub, actions }: SectionHeadProps) {
  return (
    <div className="mb-[14px] flex items-end justify-between border-b border-border pb-[10px]">
      <div>
        <div className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</div>
        {sub && <div className="mt-[3px] text-[12px] text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-[6px]">{actions}</div>}
    </div>
  );
}
