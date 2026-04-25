// Dashboards › PM Overview
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `PMDashboard` (lines 71-228) — KPI band, velocity chart, risks, deliverables,
// client-owned questions, phase readiness.

import { Avatar, Card, Chip, Readiness } from "@/components/primitives";
import { DATA } from "@/lib/data";

type DeliverableState = "draft" | "pending reprop" | "not started" | "on track";

interface Deliverable {
  name: string;
  due: string;
  owner: string;
  state: DeliverableState;
}

const DELIVERABLES: Deliverable[] = [
  { name: "Sprint 3 status report", due: "Apr 28", owner: "jamie", state: "draft" },
  { name: "BRD v3 · CPQ addendum", due: "May 2", owner: "priya", state: "pending reprop" },
  { name: "Phase 2 readout deck", due: "May 8", owner: "sarah", state: "not started" },
  { name: "SDD · Lead Assignment", due: "May 12", owner: "sarah", state: "on track" },
];

function deliverableTone(state: DeliverableState) {
  if (state === "on track") return "green" as const;
  if (state === "draft") return "amber" as const;
  if (state === "pending reprop") return "red" as const;
  return "gray" as const;
}

function deliverableBadge(state: DeliverableState) {
  if (state === "on track") return "✓";
  if (state === "draft") return "wip";
  if (state === "pending reprop") return "!";
  return "—";
}

function VelocityChart() {
  const data = [
    { name: "S-4", c: 28, d: 25 },
    { name: "S-3", c: 34, d: 30 },
    { name: "S-2", c: 36, d: 32 },
    { name: "S-1", c: 38, d: 40 },
    { name: "S+0", c: 32, d: 28 },
    { name: "S1", c: 32, d: 28 },
    { name: "S2", c: 38, d: 36 },
    { name: "S3", c: 40, d: 24 },
  ];
  const max = 45;
  const w = 620;
  const h = 180;
  const pad = 28;
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: "100%", height: 200 }}>
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={pad} x2={w - pad} y1={h - h * p} y2={h - h * p} stroke="#F1F5F9" />
          <text
            x={pad - 6}
            y={h - h * p + 3}
            fontSize="9"
            fill="#94A3B8"
            textAnchor="end"
            fontFamily="Inter"
          >
            {Math.round(max * p)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad + bw * i + 4;
        const cH = (d.c / max) * h;
        const dH = (d.d / max) * h;
        return (
          <g key={d.name}>
            <rect x={x} y={h - cH} width={bw * 0.4} height={cH} fill="#CBD5E1" rx="2" />
            <rect
              x={x + bw * 0.42}
              y={h - dH}
              width={bw * 0.4}
              height={dH}
              fill={i === data.length - 1 ? "#4F46E5" : "#6366F1"}
              rx="2"
            />
            <text
              x={x + bw * 0.42}
              y={h + 14}
              fontSize="9.5"
              fill="#64748B"
              fontFamily="Inter"
            >
              {d.name}
            </text>
          </g>
        );
      })}
      {/* trend line */}
      <polyline
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        points={data
          .map((d, i) => {
            const avg = (d.c + d.d) / 2;
            return `${pad + bw * i + bw / 2},${h - (avg / max) * h}`;
          })
          .join(" ")}
      />
    </svg>
  );
}

export default function PMDashboardPage() {
  return (
    <div className="flex flex-col gap-[12px]">
      {/* KPI band */}
      <div className="grid grid-cols-4 gap-[12px]">
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Health
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-yellow-dot-2">
            Yellow
          </div>
          <div className="mt-[3px] text-sm text-muted">2 signals · timeline risk</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Velocity · last 3 sprints
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            32.7
            <span className="ml-[4px] text-[12px] font-medium text-muted">pts/spr</span>
          </div>
          <div className="mt-[3px] text-sm text-muted">
            <span className="text-[11px] font-medium text-green-dot">+8%</span> vs prior three
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Roadmap progress
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">38%</div>
          <div className="mt-[8px] h-[6px] w-full overflow-hidden rounded-[3px] bg-stripe">
            <div className="h-full rounded-[3px] bg-indigo" style={{ width: "38%" }} />
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Client-owned Qs overdue
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-red-text">2</div>
          <div className="mt-[3px] text-sm text-muted">&gt; 3 days since follow-up</div>
        </div>
      </div>

      {/* Velocity + Risks */}
      <div className="grid gap-[12px] [grid-template-columns:2fr_1fr]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Velocity · last 8 sprints
          </h3>
          <VelocityChart />
          <div className="mt-[8px] flex gap-[16px] text-[11px] text-muted">
            <span className="inline-flex items-center gap-[4px]">
              <i className="inline-block h-[10px] w-[10px] rounded-[2px] bg-[#CBD5E1]" />
              Completed
            </span>
            <span className="inline-flex items-center gap-[4px]">
              <i className="inline-block h-[10px] w-[10px] rounded-[2px] bg-indigo" />
              Committed
            </span>
            <span className="ml-auto">
              Avg commit 37 · avg complete 33 · spillover 10%
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Active risks
            <span className="ml-auto rounded-pill bg-stripe px-[7px] py-[2px] text-xs font-medium text-ink-3">
              {DATA.risks.length}
            </span>
          </h3>
          <div className="flex flex-col gap-[10px]">
            {DATA.risks.map((r) => {
              const accent =
                r.sev === "High"
                  ? "border-red-dot"
                  : r.sev === "Medium"
                    ? "border-yellow-dot"
                    : "border-muted-2";
              const tone =
                r.sev === "High" ? "red" : r.sev === "Medium" ? "amber" : "gray";
              return (
                <div key={r.id} className={`border-l-[3px] ${accent} pl-[10px]`}>
                  <div className="text-base font-medium leading-[1.4] text-ink">
                    {r.text}
                  </div>
                  <div className="mt-[3px] flex items-center gap-[8px] text-[11px] text-muted">
                    <Chip tone={tone}>{r.sev}</Chip>
                    <span>{r.owner.split(" ")[0]}</span>
                    <span className="font-mono">{r.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Deliverables + Client-owned + Phase readiness */}
      <div className="grid grid-cols-3 gap-[12px]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Upcoming deliverables
          </h3>
          <div className="flex flex-col gap-[8px] text-[12px]">
            {DELIVERABLES.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-[8px] border-b border-stripe py-[6px] last:border-b-0"
              >
                <Avatar person={d.owner} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink">{d.name}</div>
                  <div className="text-[11px] text-muted">
                    Due {d.due} · {d.state}
                  </div>
                </div>
                <Chip tone={deliverableTone(d.state)}>{deliverableBadge(d.state)}</Chip>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Client-owned Qs · needs follow-up
          </h3>
          <div className="flex flex-col gap-[8px] text-[12px]">
            {DATA.questions
              .filter((q) => q.ownerType === "client" && q.state === "open")
              .slice(0, 4)
              .map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-amber-border bg-yellow-bg px-[10px] py-[7px]"
                >
                  <div className="mb-[3px] flex items-center gap-[8px]">
                    <span className="font-mono text-[10.5px] font-semibold text-yellow-text-2">
                      {q.id}
                    </span>
                    <span className="ml-auto text-[11px] text-muted">
                      asked {q.askedDate.slice(5)}
                    </span>
                  </div>
                  <div className="text-[12px] leading-[1.4] text-ink-2">{q.text}</div>
                  <div className="mt-[6px] text-[10.5px] text-yellow-text">
                    Owner: {q.owner} · blocks {q.blocks || 0}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Phase readiness
          </h3>
          <div className="flex flex-col gap-[10px]">
            {DATA.phases.map((p) => (
              <div key={p.id} className="flex items-center gap-[10px]">
                <div className="grid h-[22px] w-[28px] place-items-center rounded-sm bg-stripe text-xs font-semibold text-ink-3">
                  {p.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-muted">{p.duration}</div>
                </div>
                <Readiness score={p.readiness} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
