// Toggle — port of project/settings.jsx Toggle component.
// Visual-only switch used across Settings screens (Salesforce, Jira, AI,
// Health, Notifications, Security). Optional inline label.

"use client";

import type { ReactNode } from "react";

export interface ToggleProps {
  on: boolean;
  onChange?: (next: boolean) => void;
  label?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Toggle({ on, onChange, label, className = "", disabled = false }: ToggleProps) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange?.(!on)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange?.(!on);
        }
      }}
      className={`inline-flex items-center gap-[8px] ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className}`}
    >
      <span
        className={`relative inline-block h-[18px] w-[32px] rounded-pill p-[2px] transition-colors ${
          on ? "bg-indigo" : "bg-border-hover"
        }`}
      >
        <span
          className={`block h-[14px] w-[14px] rounded-full bg-surface transition-transform ${
            on ? "translate-x-[14px]" : "translate-x-0"
          }`}
        />
      </span>
      {label !== undefined && label !== null && (
        <span className="text-[12px] text-ink">{label}</span>
      )}
    </span>
  );
}
