"use client";

// Work > Items > Board — port of work.jsx BoardLens.
// 7-column kanban (statuses) over the active sprint's work items.

import { KanbanCard } from "@/components/widgets/KanbanCard";
import { KanbanColumn } from "@/components/widgets/KanbanColumn";
import { useDrawer } from "@/lib/context";
import { DATA } from "@/lib/data";

export default function BoardPage() {
  const { openDrawer } = useDrawer();
  const sprintItems = DATA.workItems.filter((w) => w.sprint === 3);

  return (
    <div className="grid min-h-[400px] grid-cols-7 gap-[10px]">
      {DATA.statuses.map((s) => {
        const cards = sprintItems.filter((w) => w.status === s.id);
        return (
          <KanbanColumn key={s.id} status={s} count={cards.length}>
            {cards.map((w) => (
              <KanbanCard
                key={w.id}
                wi={w}
                onClick={() => openDrawer("workItem", { id: w.id })}
              />
            ))}
            {cards.length === 0 && (
              <div className="px-[12px] py-[12px] text-center text-sm text-muted-2">
                —
              </div>
            )}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
