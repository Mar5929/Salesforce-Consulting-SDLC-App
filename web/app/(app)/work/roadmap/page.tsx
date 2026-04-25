// Work › Roadmap
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/work.jsx
// `Roadmap` component (lines 117-163).

"use client";

import { Button, Chip, Icon, Readiness } from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer } from "@/lib/context";

export default function RoadmapPage() {
  const { openDrawer } = useDrawer();

  return (
    <>
      {/* Re-proposal banner */}
      <div className="mb-[14px] flex items-center gap-[12px] rounded-card border border-amber-border bg-gradient-to-r from-amber-grad-1 to-amber-grad-2 px-[14px] py-[12px]">
        <div className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-card bg-yellow-dot text-white">
          <Icon name="sparkle" size={16} color="#ffffff" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-yellow-text">
            AI roadmap re-proposal · fired 4h ago
          </div>
          <div className="mt-[2px] text-[12px] text-yellow-text-2">
            Phase 3 &quot;Quoting&quot; restructure · replace with &quot;CPQ Implementation&quot;
          </div>
        </div>
        <Button
          variant="amber"
          onClick={() => openDrawer("reproposal", {})}
          iconRight={<Icon name="arrowRight" size={12} color="#ffffff" />}
        >
          Review diff
        </Button>
      </div>

      {/* Section header */}
      <div className="mb-[10px] flex items-center gap-[10px]">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Current roadmap
        </h2>
        <div className="text-[11.5px] text-muted">{DATA.project.version}</div>
        <div className="ml-auto flex gap-[6px]">
          <Button iconLeft={<Icon name="refresh" size={12} />}>
            Trigger re-proposal
          </Button>
          <Button iconLeft={<Icon name="clock" size={12} />}>
            Version history
          </Button>
          <Button
            variant="primary"
            iconLeft={<Icon name="edit" size={12} color="#ffffff" />}
          >
            Edit phases
          </Button>
        </div>
      </div>

      {/* Phase rows */}
      {DATA.phases.map((p, i) => {
        const reprop = !!p.reprop;
        return (
          <div
            key={p.id}
            className="mb-[10px] overflow-hidden rounded-card border border-border bg-surface"
          >
            <div
              className={`grid items-center gap-[8px] border-b border-stripe px-[14px] py-[12px] ${
                reprop ? "bg-amber-grad-1" : "bg-surface"
              }`}
              style={{ gridTemplateColumns: "60px 1fr 100px 120px 100px" }}
            >
              <div>
                <div
                  className={`grid h-[32px] w-[32px] place-items-center rounded-lg text-[12.5px] font-bold text-white ${
                    reprop ? "bg-yellow-dot" : "bg-indigo"
                  }`}
                >
                  P{i + 1}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-[10px] text-[14px] font-semibold text-ink">
                  {p.name}
                  {reprop && <Chip tone="amber">re-proposal pending</Chip>}
                </div>
                <div className="mt-[3px] text-[12px] text-muted">{p.descriptor}</div>
              </div>
              <div className="text-[11px] text-muted">{p.epicCount} epics</div>
              <div className="text-[11px] text-muted">{p.duration}</div>
              <div>
                <Readiness
                  score={p.readiness}
                  onClick={() =>
                    openDrawer("readiness", { score: p.readiness, subject: p.name })
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
