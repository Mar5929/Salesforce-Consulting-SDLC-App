// Dashboards › Usage & Costs
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `UsageDashboard` (lines 569-705) — token / cost KPIs, daily trend, by-task and
// by-team-member breakdowns. Visibility banner kept verbatim.

import { Avatar, Card, Icon, Table, TD, TH, TR } from "@/components/primitives";
import { DATA } from "@/lib/data";

interface UsageByTask {
  t: string;
  tok: number;
  pct: number;
  cost: number;
}

interface UsageByUser {
  who: string;
  tok: number;
  cost: number;
  topTask: string;
}

const TOKENS_IN = 2_840_000;
const TOKENS_OUT = 612_000;
const COST = (TOKENS_IN / 1000) * 0.003 + (TOKENS_OUT / 1000) * 0.015;

const BY_TASK: UsageByTask[] = [
  { t: "Transcript processing", tok: 1_180_000, pct: 34, cost: 4.45 },
  { t: "Story generation", tok: 720_000, pct: 21, cost: 2.72 },
  { t: "Briefing synthesis", tok: 480_000, pct: 14, cost: 1.82 },
  { t: "Org knowledge refresh", tok: 420_000, pct: 12, cost: 1.58 },
  { t: "Impact analysis", tok: 280_000, pct: 8, cost: 1.05 },
  { t: "Document generation", tok: 192_000, pct: 6, cost: 0.72 },
  { t: "Other", tok: 180_000, pct: 5, cost: 0.68 },
];

const BY_USER: UsageByUser[] = [
  { who: "priya", tok: 1_120_000, cost: 4.21, topTask: "Transcript" },
  { who: "sarah", tok: 880_000, cost: 3.34, topTask: "Briefings" },
  { who: "david", tok: 740_000, cost: 2.78, topTask: "Context pkg" },
  { who: "jamie", tok: 480_000, cost: 1.82, topTask: "Status gen" },
  { who: "marcus", tok: 232_000, cost: 0.86, topTask: "Test gen" },
];

function UsageTrend() {
  const data = [
    80, 120, 140, 90, 110, 160, 180, 150, 130, 240, 200, 170, 190, 210, 160, 140, 180,
    150, 120, 140, 160, 130, 110, 150, 170, 140, 100, 130, 150, 110,
  ];
  const w = 420;
  const h = 130;
  const pad = 16;
  const max = 250;
  const step = (w - pad * 2) / (data.length - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 150 }}>
      <defs>
        <linearGradient id="usageFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.22" />
          <stop offset="1" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((p) => (
        <line
          key={p}
          x1={pad}
          x2={w - pad}
          y1={h - p * (h - pad * 2) - pad}
          y2={h - p * (h - pad * 2) - pad}
          stroke="#F1F5F9"
        />
      ))}
      <polyline
        fill="url(#usageFill)"
        stroke="none"
        points={`${pad},${h - pad} ${data
          .map((v, i) => `${pad + i * step},${h - (v / max) * (h - pad * 2) - pad}`)
          .join(" ")} ${pad + (data.length - 1) * step},${h - pad}`}
      />
      <polyline
        fill="none"
        stroke="#4F46E5"
        strokeWidth="1.6"
        points={data
          .map((v, i) => `${pad + i * step},${h - (v / max) * (h - pad * 2) - pad}`)
          .join(" ")}
      />
      <text x={pad} y={h - 2} fontSize="9" fill="#94A3B8" fontFamily="Inter">
        Mar 25
      </text>
      <text x={w - pad - 30} y={h - 2} fontSize="9" fill="#94A3B8" fontFamily="Inter">
        Today
      </text>
    </svg>
  );
}

export default function UsageDashboardPage() {
  return (
    <div className="flex flex-col gap-[12px]">
      {/* Visibility banner */}
      <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-[12px] py-[10px] text-[12px] text-blue-text">
        <Icon name="shield" size={12} /> &nbsp;Visible to Solution Architects, PMs, and
        Firm Admins only. Individual consumption shown in aggregate; users cannot see
        each other&apos;s detail.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-[12px]">
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Total tokens · last 30d
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {(TOKENS_IN / 1_000_000).toFixed(2)}M
            <span className="ml-[6px] text-[12px] text-muted-2">in</span>
          </div>
          <div className="mt-[3px] text-sm text-muted">
            {(TOKENS_OUT / 1000).toFixed(0)}K out · haiku-4.5 default
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Estimated cost
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            ${COST.toFixed(2)}
          </div>
          <div className="mt-[3px] text-sm text-muted">Within soft cap ($40/mo)</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            AI sessions
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">312</div>
          <div className="mt-[3px] text-sm text-muted">218 chat · 94 background</div>
        </div>
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Inngest events
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            4,820
          </div>
          <div className="mt-[3px] text-sm text-muted">
            of 5,000 free tier · {((4820 / 5000) * 100).toFixed(0)}%
          </div>
          <div className="mt-[4px] h-[6px] w-full overflow-hidden rounded-[3px] bg-stripe">
            <div className="h-full rounded-[3px] bg-yellow-dot" style={{ width: "96%" }} />
          </div>
        </div>
      </div>

      {/* Trend + by-task */}
      <div className="grid grid-cols-2 gap-[12px]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Daily tokens · trend
          </h3>
          <UsageTrend />
          <div className="mt-[6px] text-[11px] text-muted">
            Spike on Apr 16 from bulk transcript reprocessing.
          </div>
        </Card>
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            By task type
          </h3>
          <Table className="text-sm">
            <thead>
              <tr>
                <TH>Task</TH>
                <TH style={{ width: 80, textAlign: "right" }}>Tokens</TH>
                <TH style={{ width: 50, textAlign: "right" }}>%</TH>
                <TH style={{ width: 60, textAlign: "right" }}>Cost</TH>
              </tr>
            </thead>
            <tbody>
              {BY_TASK.map((r) => (
                <TR key={r.t}>
                  <TD>{r.t}</TD>
                  <TD className="text-right font-mono">{(r.tok / 1000).toFixed(0)}K</TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-[6px]">
                      <div className="h-[4px] w-[34px] rounded-[2px] bg-stripe">
                        <div
                          className="h-full rounded-[2px] bg-indigo"
                          style={{ width: `${r.pct * 2.2}%` }}
                        />
                      </div>
                      <span className="w-[24px] font-mono text-sm">{r.pct}%</span>
                    </div>
                  </TD>
                  <TD className="text-right font-mono">${r.cost.toFixed(2)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          By team member
        </h3>
        <Table className="text-sm">
          <thead>
            <tr>
              <TH>Member</TH>
              <TH>Role</TH>
              <TH style={{ width: 100, textAlign: "right" }}>Tokens</TH>
              <TH style={{ width: 120 }}>Share</TH>
              <TH style={{ width: 80, textAlign: "right" }}>Cost</TH>
              <TH style={{ width: 100, textAlign: "right" }}>Top task</TH>
            </tr>
          </thead>
          <tbody>
            {BY_USER.map((u) => {
              const who = DATA.team.find((p) => p.id === u.who);
              if (!who) return null;
              const pct = (u.tok / TOKENS_IN) * 100;
              return (
                <TR key={u.who}>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <Avatar person={u.who} size="xs" />
                      {who.name}
                    </div>
                  </TD>
                  <TD className="text-sm text-muted-2">{who.role}</TD>
                  <TD className="text-right font-mono">{(u.tok / 1000).toFixed(0)}K</TD>
                  <TD>
                    <div className="flex items-center gap-[6px]">
                      <div className="h-[5px] flex-1 rounded-[2px] bg-stripe">
                        <div
                          className="h-full rounded-[2px] bg-indigo"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-[34px] text-right font-mono text-sm">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </TD>
                  <TD className="text-right font-mono">${u.cost.toFixed(2)}</TD>
                  <TD className="text-right text-sm text-muted-2">{u.topTask}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
