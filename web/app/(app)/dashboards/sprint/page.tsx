// Dashboards › Sprint
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `SprintDashboard` (lines 231-325) — KPI tiles, burndown, workload by dev,
// items by status, sprint alerts.

import { Avatar, Card, Icon, StatusChip } from "@/components/primitives";
import { Burndown } from "@/components/widgets/Burndown";
import { DATA } from "@/lib/data";
import type { WIStatus } from "@/lib/types";

interface DevWorkload {
  who: string;
  wips: number;
  pts: number;
}

interface Conflict {
  text: string;
}

interface MissingFields {
  id: string;
  missing: string[];
}

const BY_DEV: DevWorkload[] = [
  { who: "david", wips: 4, pts: 21 },
  { who: "sarah", wips: 1, pts: 5 },
  { who: "priya", wips: 0, pts: 0 },
  { who: "marcus", wips: 1, pts: 3 },
];

const CONFLICTS: Conflict[] = [
  { text: "WI-LM-LA-02 and WI-LM-LC-04 both modify Lead object" },
];

const MANDATORY_MISSING: MissingFields[] = [
  { id: "WI-LM-LC-02", missing: ["GWT acceptance criteria"] },
  { id: "WI-LM-LC-04", missing: ["GWT acceptance criteria", "impacted components"] },
];

export default function SprintDashboardPage() {
  const sprint = DATA.sprint;
  const byStatus: Partial<Record<WIStatus, number>> = {};
  DATA.workItems
    .filter((w) => w.sprint === 3)
    .forEach((w) => {
      byStatus[w.status] = (byStatus[w.status] ?? 0) + 1;
    });

  const statusBuckets: { s: WIStatus; label: string; n: number }[] = [
    { s: "sprint", label: "Sprint Planned", n: byStatus.sprint ?? 0 },
    { s: "progress", label: "In Progress", n: byStatus.progress ?? 0 },
    { s: "review", label: "In Review", n: byStatus.review ?? 0 },
    { s: "qa", label: "QA", n: byStatus.qa ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-[12px]">
      {/* Top KPI band */}
      <div className="grid grid-cols-4 gap-[12px]">
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Sprint
          </div>
          <div className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
            {sprint.name}
          </div>
          <div className="mt-[3px] font-mono text-sm text-muted">{sprint.window}</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Committed
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {sprint.committed}
            <span className="ml-[4px] text-[13px] text-muted-2">pts</span>
          </div>
          <div className="mt-[3px] text-sm text-muted">capacity {sprint.capacity}</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Completed
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-green-dot">
            {sprint.completed}
            <span className="ml-[4px] text-[13px] text-muted-2">pts</span>
          </div>
          <div className="mt-[8px] h-[6px] w-full overflow-hidden rounded-[3px] bg-stripe">
            <div className="h-full rounded-[3px] bg-green-dot" style={{ width: "60%" }} />
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Remaining
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {sprint.remaining}
            <span className="ml-[4px] text-[13px] text-muted-2">pts</span>
          </div>
          <div className="mt-[3px] text-sm text-muted">4 days left</div>
        </div>
      </div>

      {/* Burndown + Workload */}
      <div className="grid gap-[12px] [grid-template-columns:2fr_1fr]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Burndown
          </h3>
          <Burndown pointsLeft={sprint.remaining} height={160} />
          <div className="mt-[8px] text-[11px] text-muted">
            On track — behind ideal by 2 points. Weekend dip typical; trajectory remains
            inside the sprint window.
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Workload by developer
          </h3>
          <div className="flex flex-col gap-[8px]">
            {BY_DEV.map((d) => (
              <div key={d.who} className="flex items-center gap-[10px]">
                <Avatar person={d.who} size="xs" />
                <span className="flex-1 text-[12px] font-medium text-ink">
                  {d.who[0].toUpperCase() + d.who.slice(1)}
                </span>
                <div className="h-[6px] w-[80px] overflow-hidden rounded-[3px] bg-stripe">
                  <div
                    className={`h-full ${d.pts > 15 ? "bg-yellow-dot" : "bg-indigo"}`}
                    style={{ width: `${Math.min(d.pts * 4, 100)}%` }}
                  />
                </div>
                <span className="w-[64px] text-right font-mono text-[11px] text-ink-3">
                  {d.pts}pts · {d.wips}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Items by status + Alerts */}
      <div className="grid grid-cols-2 gap-[12px]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Items by status
          </h3>
          <div className="grid grid-cols-4 gap-[8px]">
            {statusBuckets.map((b) => (
              <div
                key={b.s}
                className="rounded-lg border border-border bg-canvas px-[12px] py-[10px]"
              >
                <div className="text-[22px] font-semibold text-ink">{b.n}</div>
                <StatusChip status={b.s} />
                <div className="mt-[3px] text-xs text-muted">{b.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Alerts
            <span className="ml-auto rounded-pill bg-red-bg px-[7px] py-[2px] text-xs font-medium text-red-text">
              {CONFLICTS.length + MANDATORY_MISSING.length}
            </span>
          </h3>
          <div className="flex flex-col gap-[8px]">
            {CONFLICTS.map((c, i) => (
              <div
                key={i}
                className="rounded-card border border-amber-border bg-yellow-bg px-[12px] py-[10px]"
              >
                <div className="mb-[4px] flex items-center gap-[7px] text-[12px] font-semibold text-yellow-text">
                  <Icon name="warn" size={13} color="#78350F" />
                  Sprint conflict
                </div>
                <div className="text-[12px] leading-[1.5] text-yellow-text-2">
                  {c.text}. Recommended: serialize or split Lead-object changes.
                </div>
              </div>
            ))}
            {MANDATORY_MISSING.map((m, i) => (
              <div
                key={i}
                className="rounded-lg border border-red-soft-border bg-red-soft-bg px-[10px] py-[8px] text-[12px]"
              >
                <div className="mb-[2px] font-semibold text-red-text">
                  <span className="font-mono text-[11px]">{m.id}</span> · missing fields
                </div>
                <div className="text-red-text-2">{m.missing.join(" · ")}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
