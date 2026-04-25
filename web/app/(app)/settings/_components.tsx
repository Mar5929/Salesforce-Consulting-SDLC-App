// Shared building blocks for the Settings tab.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// (SectionHead / Field / TextInput / SelectInput helpers).
//
// These are visual mocks — inputs are read-only displays, not wired to state.

import type { ReactNode } from "react";

/* ---------------- SectionHead ---------------- */

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
      {actions && <div className="flex gap-[6px]">{actions}</div>}
    </div>
  );
}

/* ---------------- Field ---------------- */

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  half?: boolean;
  children: ReactNode;
}

export function Field({ label, hint, children, half = false }: FieldProps) {
  return (
    <div
      className={`grid items-start gap-[16px] border-b border-stripe py-[12px] ${
        half ? "grid-cols-[180px_1fr]" : "grid-cols-[220px_1fr]"
      } last:border-b-0`}
    >
      <div>
        <div className="text-[12.5px] font-medium text-ink">{label}</div>
        {hint && <div className="mt-[3px] text-[11px] leading-[1.5] text-muted">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ---------------- TextMock ---------------- */
// Read-only text-input mock — looks like an input, won't accept input.

export interface TextMockProps {
  value: string;
  mono?: boolean;
  wide?: boolean;
  className?: string;
}

export function TextMock({ value, mono = false, wide = false, className = "" }: TextMockProps) {
  return (
    <input
      type="text"
      defaultValue={value}
      readOnly
      className={`rounded-md border border-border-hover bg-surface px-[10px] py-[6px] text-[12px] focus:outline-none ${
        mono ? "font-mono" : ""
      } ${wide ? "w-full" : "w-[280px]"} ${className}`}
    />
  );
}

/* ---------------- SelectMock ---------------- */

export interface SelectMockProps {
  value: string;
  options: string[];
  wide?: boolean;
  className?: string;
}

export function SelectMock({ value, options, wide = false, className = "" }: SelectMockProps) {
  return (
    <select
      defaultValue={value}
      className={`rounded-md border border-border-hover bg-surface px-[10px] py-[6px] text-[12px] ${
        wide ? "w-full" : "w-[280px]"
      } ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ---------------- RangeMock ---------------- */

export interface RangeMockProps {
  min: number;
  max: number;
  defaultValue: number;
  width?: number;
  className?: string;
}

export function RangeMock({ min, max, defaultValue, width = 220, className = "" }: RangeMockProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      defaultValue={defaultValue}
      readOnly
      className={className}
      style={{ width }}
    />
  );
}
