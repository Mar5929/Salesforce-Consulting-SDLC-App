// Dashboards › Roadmap
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// `RoadmapDashboard` (lines 328-432) — epic × phase grid, milestone tracker,
// AI "what must happen" callout, dependency chains.

import { AiCard, Card, Chip, Icon } from "@/components/primitives";
import { RoadmapGrid } from "@/components/widgets/RoadmapGrid";
import type { RoadmapPhase, RoadmapPhaseStatus } from "@/components/widgets/RoadmapGrid";
import { DATA } from "@/lib/data";
import type { Epic } from "@/lib/types";

const PHASES: RoadmapPhase[] = [
  { id: "Discovery", done: "done" },
  { id: "Design", done: "done" },
  { id: "Build", done: "current" },
  { id: "Test", done: "upcoming" },
  { id: "Deploy", done: "upcoming" },
];

function statusFor(epic: Epic, phase: string): RoadmapPhaseStatus {
  if (epic.readiness >= 90 && phase === "Discovery") return "done";
  if (epic.readiness >= 90 && phase === "Design") return "done";
  if (epic.readiness >= 70 && phase === "Discovery") return "done";
  if (epic.readiness >= 70 && phase === "Design")
    return epic.id === "LM-LA" ? "done" : "current";
  if (epic.readiness >= 50 && phase === "Discovery") return "done";
  if (epic.readiness >= 50 && phase === "Design") return "current";
  if (phase === "Discovery") return "current";
  return "upcoming";
}

interface Milestone {
  name: string;
  date: string;
  progress: number;
  blocks: number;
  risk?: boolean;
}

const MILESTONES: Milestone[] = [
  { name: "M1 · Lead Mgmt ready for UAT", date: "Apr 28", progress: 78, blocks: 1 },
  { name: "M2 · Opportunity flow live", date: "May 19", progress: 52, blocks: 2 },
  { name: "M3 · Quoting Phase 3 sign-off", date: "Jun 12", progress: 18, blocks: 4, risk: true },
  { name: "M4 · Reporting & hand-off", date: "Jul 03", progress: 6, blocks: 0 },
];

function progressTone(progress: number) {
  if (progress >= 70) return "green" as const;
  if (progress >= 40) return "amber" as const;
  return "gray" as const;
}

function progressBg(progress: number) {
  if (progress >= 70) return "bg-green-dot";
  if (progress >= 40) return "bg-yellow-dot";
  return "bg-muted-2";
}

function progressLabel(progress: number) {
  if (progress >= 70) return "on track";
  if (progress >= 40) return "at risk";
  return "upcoming";
}

export default function RoadmapDashboardPage() {
  return (
    <div className="flex flex-col gap-[12px]">
      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Epic × phase grid
        </h3>
        <RoadmapGrid phases={PHASES} epics={DATA.epics} statusFor={statusFor} />
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Milestones
        </h3>
        <div className="flex flex-col gap-[4px]">
          <div
            className="grid items-center gap-[12px] px-[8px] py-[4px] text-xs font-semibold uppercase tracking-[0.05em] text-muted"
            style={{ gridTemplateColumns: "2fr 80px 1fr 80px 80px" }}
          >
            <div>Milestone</div>
            <div>Target</div>
            <div>Progress</div>
            <div>Blocks</div>
            <div>State</div>
          </div>
          {MILESTONES.map((m, i) => (
            <div
              key={i}
              className="grid items-center gap-[12px] border-t border-stripe px-[8px] py-[9px] text-[12px]"
              style={{ gridTemplateColumns: "2fr 80px 1fr 80px 80px" }}
            >
              <div>
                <div className="font-medium text-ink">{m.name}</div>
                {m.risk && <Chip tone="red">reprop pending</Chip>}
              </div>
              <div className="font-mono text-sm text-muted">{m.date}</div>
              <div className="flex items-center gap-[6px]">
                <div className="h-[6px] flex-1 rounded-[3px] bg-stripe">
                  <div
                    className={`h-full rounded-[3px] ${progressBg(m.progress)}`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <span className="w-[32px] text-right font-mono text-sm text-muted">
                  {m.progress}%
                </span>
              </div>
              <div>
                {m.blocks > 0 ? (
                  <span className="font-medium text-red-text">{m.blocks}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
              <div>
                <Chip tone={progressTone(m.progress)}>{progressLabel(m.progress)}</Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-[12px]">
        <AiCard
          head={{ label: "WHAT MUST HAPPEN" }}
          foot={
            <>
              <Icon name="sparkle" size={11} />
              Synthesized from blocking questions + linked stories
            </>
          }
        >
          <p className="m-0 text-[12.5px]">
            To hit <b>M1 Apr 28</b>, QA needs to close DEF-011 on WI-LM-LA-04 (2 pts), and
            WI-LM-LC-01 must un-block by getting Q-LM-LC-003 answered. For{" "}
            <b>M3 Jun 12</b>, the P3 re-proposal must be accepted or rejected this week —
            every day of delay pushes the milestone by ~1 day.
          </p>
        </AiCard>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Dependency chains
          </h3>
          <div className="text-[12px] leading-[1.8] text-ink-2">
            <div className="flex items-center gap-[6px]">
              <span className="font-mono">WI-LM-LA-04</span> →{" "}
              <span className="font-mono">WI-LM-LA-05</span> → <Chip tone="violet">M1</Chip>
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="font-mono">WI-OPP-MG-01</span> →{" "}
              <span className="font-mono">WI-OPP-ST-01</span> → <Chip tone="violet">M2</Chip>
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="font-mono">WI-CPQ-IM-01</span> →{" "}
              <span className="font-mono">WI-CPQ-PR-01</span> →{" "}
              <span className="font-mono">WI-QT-TG-02</span> → <Chip tone="violet">M3</Chip>
            </div>
            <div className="mt-[8px] text-[11px] text-muted">
              Computed from overlapping impacted components and explicit deps.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
