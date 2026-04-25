"use client";

// Work > Items > Timeline — port of work.jsx TimelineLens.
// Gantt-ish horizontal phase bands across a 6-month axis with a "today" marker.

import { DATA } from "@/lib/data";

interface Band {
  start: number;
  end: number;
  color: string;
}

const BANDS: Band[] = [
  { start: 0, end: 35, color: "#4F46E5" },
  { start: 30, end: 55, color: "#0891B2" },
  { start: 50, end: 80, color: "#F59E0B" },
  { start: 75, end: 92, color: "#16A34A" },
];

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export default function TimelinePage() {
  return (
    <div className="rounded-card border border-border bg-surface p-[16px] shadow-card">
      <div className="mb-[8px] flex justify-between pl-[180px] text-sm text-muted">
        {MONTHS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      {DATA.phases.map((p, i) => {
        const b = BANDS[i];
        return (
          <div
            key={p.id}
            className="mb-[10px] grid h-[32px] grid-cols-[180px_1fr] items-center"
          >
            <div className="text-[12.5px]">
              <span className="mono mr-[6px] text-xs text-ink-3">{p.id}</span>
              <span className="font-medium">{p.name}</span>
            </div>
            <div className="relative h-[28px] rounded-sm bg-canvas">
              <div
                className="absolute top-[2px] bottom-[2px] flex items-center rounded-xs pl-[8px] text-sm font-medium"
                style={{
                  left: `${b.start}%`,
                  width: `${b.end - b.start}%`,
                  background: p.reprop
                    ? "repeating-linear-gradient(45deg, #FEF3C7, #FEF3C7 6px, #FDE68A 6px, #FDE68A 12px)"
                    : b.color,
                  color: p.reprop ? "#92400E" : "white",
                  border: p.reprop ? "1px dashed #F59E0B" : "none",
                }}
              >
                {p.descriptor.split("·")[0].trim()}
              </div>
              {/* Today marker */}
              <div className="absolute top-[-4px] bottom-[-4px] left-[42%] w-[2px] bg-indigo" />
            </div>
          </div>
        );
      })}
      <div className="mt-[8px] pl-[180px] text-sm text-indigo">Today · Apr 17</div>
    </div>
  );
}
