// RoadmapGrid — Phase × Sprint heatmap-style grid.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `RoadmapDashboard` (lines 328-382) — extracted so other dashboards can reuse it.
// Cells use the styles.css `.roadmap-cell` color logic (done / current / upcoming / skipped).

import type { Epic } from "@/lib/types";

export type RoadmapPhaseStatus = "done" | "current" | "upcoming" | "skipped";

export interface RoadmapPhase {
  id: string;
  done: RoadmapPhaseStatus;
}

export interface RoadmapGridProps {
  phases: RoadmapPhase[];
  epics: Epic[];
  statusFor: (epic: Epic, phaseId: string) => RoadmapPhaseStatus;
}

const CELL_TONES: Record<RoadmapPhaseStatus, string> = {
  done: "bg-add-bg text-green-text",
  current: "bg-indigo-bg text-indigo-text",
  upcoming: "bg-surface text-muted-2",
  skipped: "bg-stripe text-muted-2",
};

const CELL_LABELS: Record<RoadmapPhaseStatus, string> = {
  done: "✓ done",
  current: "in progress",
  upcoming: "—",
  skipped: "skipped",
};

export function RoadmapGrid({ phases, epics, statusFor }: RoadmapGridProps) {
  const cols = `200px repeat(${phases.length}, 1fr)`;
  return (
    <div className="grid gap-[6px]" style={{ gridTemplateColumns: cols }}>
      <div />
      {phases.map((p) => (
        <div
          key={p.id}
          className="px-[6px] py-[4px] text-center text-xs font-semibold uppercase tracking-[0.05em] text-ink-3"
        >
          {p.id}
        </div>
      ))}
      {epics.map((e) => (
        <div key={e.id} className="contents">
          <div className="px-[8px] py-[6px] text-[12px]">
            <div className="font-medium text-ink">{e.name}</div>
            <div className="font-mono text-xs text-muted">
              {e.id} · {e.phase}
            </div>
          </div>
          {phases.map((p) => {
            const s = statusFor(e, p.id);
            return (
              <div
                key={p.id}
                className={`rounded-sm border border-border px-[8px] py-[6px] text-center text-xs font-medium ${CELL_TONES[s]}`}
              >
                {CELL_LABELS[s]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
