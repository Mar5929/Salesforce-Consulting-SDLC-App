// Card family — port of project/styles.css .card / .kpi / .ai-card / .q-card.
// All server-safe.

import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import { StatusChip } from "./StatusChip";
import { Avatar } from "./Avatar";
import type { Question } from "@/lib/types";

/* ---------------- Card (generic surface) ---------------- */

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-card p-[14px_16px] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------- KpiCard ---------------- */

export interface KpiDelta {
  value: string;
  direction: "up" | "down";
}

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: KpiDelta;
  className?: string;
}

export function KpiCard({ label, value, sub, delta, className = "" }: KpiCardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-card px-[14px] py-[12px] ${className}`}
    >
      <div className="text-xs text-muted uppercase tracking-[0.05em] font-semibold mb-[6px]">
        {label}
      </div>
      <div className="flex items-baseline gap-[6px] text-[22px] font-semibold text-ink tracking-[-0.02em]">
        <span>{value}</span>
        {delta && (
          <span
            className={`text-[11px] font-medium ${
              delta.direction === "up" ? "text-green-dot" : "text-red-text"
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>
      {sub && <div className="text-sm text-muted mt-[3px]">{sub}</div>}
    </div>
  );
}

/* ---------------- AiCard ---------------- */

export interface AiCardHead {
  label: string;
  ts?: string;
}

export interface AiCardProps {
  head?: AiCardHead;
  children: ReactNode;
  className?: string;
  foot?: ReactNode;
}

export function AiCard({ head, children, className = "", foot }: AiCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-violet-grad-start to-violet-grad-end border border-violet-border rounded-xl p-[14px_16px] ${className}`}
    >
      {head && (
        <div className="flex items-center gap-[8px] text-[11px] uppercase tracking-[0.06em] font-semibold text-violet-text-2 mb-[8px]">
          <span className="w-[18px] h-[18px] rounded-md grid place-items-center text-white text-[10px] bg-gradient-to-br from-violet-500 to-indigo">
            <Icon name="sparkle" size={10} color="#ffffff" />
          </span>
          <span>{head.label}</span>
          {head.ts && (
            <span className="ml-auto font-normal text-[10.5px] normal-case tracking-normal text-muted-2">
              {head.ts}
            </span>
          )}
        </div>
      )}
      <div className="text-md leading-[1.55] text-indigo-text-2">{children}</div>
      {foot && (
        <div className="mt-[10px] pt-[10px] border-t border-dashed border-violet-border-2 flex gap-[6px] items-center text-sm text-violet-text-2">
          {foot}
        </div>
      )}
    </div>
  );
}

/* ---------------- QuestionCard ---------------- */

export interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
  className?: string;
}

export function QuestionCard({ question, onClick, className = "" }: QuestionCardProps) {
  const blocking = question.blocks > 0;
  return (
    <div
      className={`bg-surface border border-border rounded-card p-[12px_14px] cursor-pointer hover:border-border-hover ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-[8px] mb-[6px]">
        <span className="font-mono text-[11px] text-ink-3 font-medium">{question.id}</span>
        <StatusChip status={question.state} />
        <Avatar person={question.owner.toLowerCase().split(" ")[0]} size="xs" />
      </div>
      <div className="text-md text-ink leading-[1.45] font-medium">{question.text}</div>
      {question.answer && (
        <div className="mt-[6px] text-base text-ink-2 bg-add-bg border-l-[3px] border-green-dot rounded-[6px] px-[10px] py-[8px]">
          {question.answer}
        </div>
      )}
      <div className="mt-[8px] flex items-center gap-[10px] text-sm text-muted">
        <span>{question.scope}</span>
        {blocking && (
          <span className="text-red-text font-medium">
            Blocks {question.blocks} item{question.blocks === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
