// Dashboards › QA
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `QADashboard` (lines 435-547) — coverage KPIs, test execution stacked bar,
// per-sprint pass rates, defect trend chart, defects table.

import { Card, Chip, Table, TD, TH, TR } from "@/components/primitives";

interface Defect {
  id: string;
  sev: "High" | "Medium" | "Low";
  title: string;
  wi: string;
  state: "Open" | "Assigned" | "Fixed" | "Verified";
  age: number;
}

const COVERAGE = 78;
const BY_RESULT = { pass: 124, fail: 11, blocked: 3, pending: 42 };
const DEFECTS: Defect[] = [
  {
    id: "DEF-011",
    sev: "High",
    title: "Audit trail missing reassignment events",
    wi: "WI-LM-LA-04",
    state: "Open",
    age: 2,
  },
  {
    id: "DEF-008",
    sev: "Medium",
    title: "Manager override UI shifts on long names",
    wi: "WI-LM-LA-02",
    state: "Assigned",
    age: 4,
  },
  {
    id: "DEF-005",
    sev: "Low",
    title: "CSV import rejects UTF-8 BOM",
    wi: "WI-LM-LC-02",
    state: "Fixed",
    age: 1,
  },
  {
    id: "DEF-003",
    sev: "Medium",
    title: "Round-robin skips inactive reps incorrectly",
    wi: "WI-LM-LA-01",
    state: "Verified",
    age: 0,
  },
];

const PER_SPRINT = [
  { s: "Sprint 1", pass: 92, total: 92 },
  { s: "Sprint 2", pass: 88, total: 94 },
  { s: "Sprint 3", pass: 44, total: 86 },
];

function sevTone(sev: Defect["sev"]) {
  if (sev === "High") return "red" as const;
  if (sev === "Medium") return "amber" as const;
  return "gray" as const;
}

function stateTone(state: Defect["state"]) {
  if (state === "Open") return "red" as const;
  if (state === "Assigned") return "amber" as const;
  if (state === "Fixed") return "blue" as const;
  if (state === "Verified") return "green" as const;
  return "gray" as const;
}

function DefectTrendChart() {
  const opens = [1, 0, 2, 1, 3, 1, 2, 1, 0, 1, 2, 0, 1, 0];
  const fixes = [0, 1, 0, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1];
  const w = 320;
  const h = 120;
  const pad = 14;
  const max = 4;
  const step = (w - pad * 2) / (opens.length - 1);
  const pts = (arr: number[]) =>
    arr
      .map((v, i) => `${pad + i * step},${h - (v / max) * (h - pad * 2) - pad}`)
      .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140 }}>
      {[0, 1, 2, 3, 4].map((v) => (
        <line
          key={v}
          x1={pad}
          x2={w - pad}
          y1={h - (v / max) * (h - pad * 2) - pad}
          y2={h - (v / max) * (h - pad * 2) - pad}
          stroke="#F1F5F9"
        />
      ))}
      <polyline fill="none" stroke="#EF4444" strokeWidth="1.8" points={pts(opens)} />
      <polyline fill="none" stroke="#16A34A" strokeWidth="1.8" points={pts(fixes)} />
      {opens.map((v, i) => (
        <circle
          key={i}
          cx={pad + i * step}
          cy={h - (v / max) * (h - pad * 2) - pad}
          r="2.5"
          fill="#EF4444"
        />
      ))}
      {fixes.map((v, i) => (
        <circle
          key={`f${i}`}
          cx={pad + i * step}
          cy={h - (v / max) * (h - pad * 2) - pad}
          r="2.5"
          fill="#16A34A"
        />
      ))}
      <text x={pad} y={h - 2} fontSize="8.5" fill="#94A3B8" fontFamily="Inter">
        Apr 11
      </text>
      <text x={w - pad - 20} y={h - 2} fontSize="8.5" fill="#94A3B8" fontFamily="Inter">
        Today
      </text>
    </svg>
  );
}

export default function QADashboardPage() {
  const totalRun = BY_RESULT.pass + BY_RESULT.fail + BY_RESULT.blocked;
  const totalAll = totalRun + BY_RESULT.pending;
  const openDefects = DEFECTS.filter(
    (d) => d.state !== "Verified" && d.state !== "Fixed",
  ).length;

  return (
    <div className="flex flex-col gap-[12px]">
      {/* KPI band */}
      <div className="grid grid-cols-4 gap-[12px]">
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Coverage
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {COVERAGE}%
          </div>
          <div className="mt-[3px] text-sm text-muted">stories with all tests passed</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Tests executed
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {totalRun}
            <span className="ml-[4px] text-[13px] text-muted-2">/{totalAll}</span>
          </div>
          <div className="mt-[3px] text-sm text-muted">{BY_RESULT.pending} pending</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Open defects
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-red-text">
            {openDefects}
          </div>
          <div className="mt-[3px] text-sm text-muted">1 High · 1 Medium · 1 Low</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Stories missing tests
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-yellow-dot-2">
            4
          </div>
          <div className="mt-[3px] text-sm text-muted">Draft items without test cases</div>
        </div>
      </div>

      {/* Test execution + Defect trend */}
      <div className="grid gap-[12px] [grid-template-columns:2fr_1fr]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Test execution
          </h3>
          <div className="mb-[12px] flex h-[18px] overflow-hidden rounded-sm">
            <div
              className="bg-green-dot"
              style={{ flex: BY_RESULT.pass }}
              title={`Pass ${BY_RESULT.pass}`}
            />
            <div
              className="bg-red-dot"
              style={{ flex: BY_RESULT.fail }}
              title={`Fail ${BY_RESULT.fail}`}
            />
            <div
              className="bg-yellow-dot"
              style={{ flex: BY_RESULT.blocked }}
              title={`Blocked ${BY_RESULT.blocked}`}
            />
            <div
              className="bg-border"
              style={{ flex: BY_RESULT.pending }}
              title={`Pending ${BY_RESULT.pending}`}
            />
          </div>
          <div className="grid grid-cols-4 gap-[12px] text-sm">
            {[
              { l: "Pass", n: BY_RESULT.pass, c: "bg-green-dot" },
              { l: "Fail", n: BY_RESULT.fail, c: "bg-red-dot" },
              { l: "Blocked", n: BY_RESULT.blocked, c: "bg-yellow-dot" },
              { l: "Pending", n: BY_RESULT.pending, c: "bg-muted-2" },
            ].map((r) => (
              <div key={r.l}>
                <div className="flex items-center gap-[5px]">
                  <i className={`inline-block h-[8px] w-[8px] rounded-full ${r.c}`} />
                  <span className="text-muted">{r.l}</span>
                </div>
                <div className="mt-[2px] text-[18px] font-semibold text-ink">{r.n}</div>
              </div>
            ))}
          </div>

          <div className="mt-[16px] border-t border-stripe pt-[12px]">
            <div className="mb-[8px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
              Per sprint
            </div>
            {PER_SPRINT.map((s) => (
              <div
                key={s.s}
                className="flex items-center gap-[10px] py-[5px] text-[12px]"
              >
                <span className="w-[80px] text-ink-3">{s.s}</span>
                <div className="h-[6px] flex-1 overflow-hidden rounded-[3px] bg-stripe">
                  <div
                    className="h-full bg-green-dot"
                    style={{ width: `${(s.pass / s.total) * 100}%` }}
                  />
                </div>
                <span className="w-[60px] text-right font-mono text-sm text-muted">
                  {s.pass}/{s.total}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Defect trend · 14 days
          </h3>
          <DefectTrendChart />
          <div className="mt-[8px] text-[11px] leading-[1.5] text-muted">
            Opens peaked Apr 15 after round-robin rule test run. Fix rate catching up;{" "}
            <b>MTTR 2.1d</b>.
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Defects
          <span className="ml-auto rounded-pill bg-stripe px-[7px] py-[2px] text-xs font-medium text-ink-3">
            {DEFECTS.length}
          </span>
        </h3>
        <Table>
          <thead>
            <tr>
              <TH style={{ width: 90 }}>ID</TH>
              <TH>Defect</TH>
              <TH style={{ width: 110 }}>Work item</TH>
              <TH style={{ width: 90 }}>Severity</TH>
              <TH style={{ width: 100 }}>State</TH>
              <TH style={{ width: 60 }}>Age</TH>
            </tr>
          </thead>
          <tbody>
            {DEFECTS.map((d) => (
              <TR key={d.id}>
                <TD className="font-mono text-[11px] text-ink-3">{d.id}</TD>
                <TD className="font-medium text-ink">{d.title}</TD>
                <TD className="font-mono text-[11px] text-ink-3">{d.wi}</TD>
                <TD>
                  <Chip tone={sevTone(d.sev)}>{d.sev}</Chip>
                </TD>
                <TD>
                  <Chip tone={stateTone(d.state)}>{d.state}</Chip>
                </TD>
                <TD className="text-sm text-muted-2">{d.age}d</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
