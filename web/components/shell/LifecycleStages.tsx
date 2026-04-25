// LifecycleStages — port of project/components.jsx ProjectHeader stages strip.
// 8 stages, 2px bottom border per stage, active stage gets pulsing dot below.

import { DATA } from "@/lib/data";

export function LifecycleStages() {
  const stages = DATA.stages;
  const activeIdx = stages.indexOf(DATA.project.activeStage as (typeof stages)[number]);

  return (
    <div className="mb-[14px] flex items-center gap-0">
      {stages.map((stage, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;

        const base =
          "flex-1 relative text-center px-[10px] py-[8px] pb-[9px] text-[10.5px] border-b-2";
        const tone = isDone
          ? "text-green-dot border-green-dot font-medium"
          : isActive
            ? "text-indigo border-indigo font-semibold"
            : "text-muted-2 border-border font-medium";

        return (
          <div key={stage} className={`${base} ${tone}`}>
            {stage}
            {isActive && (
              <span
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 h-[6px] w-[6px] rounded-full bg-indigo animate-pulse"
                style={{ bottom: -4, border: "1.5px solid #ffffff" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
