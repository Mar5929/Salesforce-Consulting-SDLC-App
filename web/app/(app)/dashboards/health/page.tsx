// Dashboards › Health score
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `HealthDashboard` (lines 708-749) — current score panel, score history band chart,
// and a per-signal breakdown with Yellow/Red traffic-light dots.

import { Button, Card } from "@/components/primitives";

interface HealthSignal {
  kind: string;
  count: number;
  thresh: string;
  examples: string[];
  impact: "ok" | "yellow" | "red";
}

const SIGNALS: HealthSignal[] = [
  {
    kind: "Stale open question",
    count: 2,
    thresh: "> 7 days",
    examples: ["Q-CPQ-003 · 11 days", "Q-OPP-002 · 9 days"],
    impact: "yellow",
  },
  {
    kind: "Client Qs past follow-up",
    count: 2,
    thresh: "> 3 days",
    examples: ["Q-LM-LC-003 · 5 days", "Q-OPP-001 · 4 days"],
    impact: "yellow",
  },
  {
    kind: "Blocked items",
    count: 1,
    thresh: "> 5 days",
    examples: ["WI-LM-LC-01 · 6 days"],
    impact: "yellow",
  },
  {
    kind: "High-severity risks w/o plan",
    count: 0,
    thresh: "any open",
    examples: [],
    impact: "ok",
  },
];

function HealthHistoryChart() {
  // Band chart: Green=2, Yellow=1, Red=0 (axis inverted: higher y = better).
  const d = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  // Wait — original maps 0→bottom (Red), 1→middle (Yellow), 2→top (Green). The first
  // 12 days are 0 here but the prototype's `d` array is the same — 0 means Green
  // because of the `(2 - v) / 2` mapping. We replicate verbatim.
  const w = 560;
  const h = 100;
  const pad = 14;
  const step = (w - pad * 2) / (d.length - 1);
  const y = (v: number) => pad + ((2 - v) / 2) * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 110 }}>
      <rect
        x={pad}
        y={pad}
        width={w - pad * 2}
        height={(h - pad * 2) / 3}
        fill="#FEE2E2"
        opacity="0.35"
      />
      <rect
        x={pad}
        y={pad + (h - pad * 2) / 3}
        width={w - pad * 2}
        height={(h - pad * 2) / 3}
        fill="#FEF3C7"
        opacity="0.45"
      />
      <rect
        x={pad}
        y={pad + (2 * (h - pad * 2)) / 3}
        width={w - pad * 2}
        height={(h - pad * 2) / 3}
        fill="#DCFCE7"
        opacity="0.4"
      />
      <polyline
        fill="none"
        stroke="#0F172A"
        strokeWidth="1.8"
        points={d.map((v, i) => `${pad + i * step},${y(v)}`).join(" ")}
      />
      {d.map((v, i) => (
        <circle key={i} cx={pad + i * step} cy={y(v)} r="1.8" fill="#0F172A" />
      ))}
      <text x={w - pad} y={y(2) + 3} fontSize="9" fill="#16A34A" textAnchor="end" fontFamily="Inter">
        Green
      </text>
      <text x={w - pad} y={y(1) + 3} fontSize="9" fill="#D97706" textAnchor="end" fontFamily="Inter">
        Yellow
      </text>
      <text x={w - pad} y={y(0) + 3} fontSize="9" fill="#DC2626" textAnchor="end" fontFamily="Inter">
        Red
      </text>
    </svg>
  );
}

function dotColor(signal: HealthSignal) {
  if (signal.count === 0) return "bg-green-dot";
  if (signal.impact === "yellow") return "bg-yellow-dot";
  return "bg-red-dot";
}

export default function HealthDashboardPage() {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="grid grid-cols-3 gap-[12px]">
        {/* Current score */}
        <div className="rounded-xl border border-amber-border bg-gradient-to-br from-amber-grad-1 to-amber-grad-2 p-[20px]">
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-yellow-text-2">
            Current score
          </div>
          <div className="mt-[6px] text-[38px] font-bold tracking-[-0.02em] text-yellow-text">
            Yellow
          </div>
          <div className="mt-[2px] text-[12px] text-yellow-text-2">
            3 active signals · thresholds per PRD §17.6
          </div>
          <div className="mt-[14px] border-t border-dashed border-amber-border pt-[12px] text-sm text-yellow-text">
            Drop below 4 signals to stay Yellow. One more signal → <b>Red</b>.
          </div>
        </div>

        {/* History */}
        <Card className="col-span-2">
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Score history · 30 days
          </h3>
          <HealthHistoryChart />
          <div className="mt-[6px] text-[11px] text-muted">
            Flipped to Yellow on Apr 12 after Q-LM-LC-003 crossed the client follow-up
            threshold.
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Signals driving score
        </h3>
        {SIGNALS.map((s, i) => (
          <div
            key={i}
            className={`grid items-center gap-[12px] py-[10px] ${
              i < SIGNALS.length - 1 ? "border-b border-stripe" : ""
            }`}
            style={{ gridTemplateColumns: "20px 1fr auto auto" }}
          >
            <div
              className={`h-[12px] w-[12px] rounded-full ${dotColor(s)}`}
              aria-hidden
            />
            <div>
              <div className="text-base font-medium text-ink">{s.kind}</div>
              <div className="mt-[2px] text-[11px] text-muted">
                Threshold {s.thresh} ·{" "}
                {s.examples.length ? s.examples.join(" · ") : "none active"}
              </div>
            </div>
            <div
              className={`min-w-[30px] text-right text-[18px] font-semibold ${
                s.count === 0 ? "text-green-dot" : "text-yellow-dot-2"
              }`}
            >
              {s.count}
            </div>
            <Button size="sm">Configure</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
