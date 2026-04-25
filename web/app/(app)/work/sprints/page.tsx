"use client";

// Work > Sprints — port of work.jsx Sprints.
// Sections:
//   1. Active sprint summary (committed/completed/capacity + progress + actions)
//   2. AI sprint intelligence callouts (conflict + parallelization + capacity)
//   3. Backlog (Ready) ↔ Sprint 3 committed two-column lists
//   4. Burndown chart + sprint history

import {
  Avatar,
  Button,
  Chip,
  Icon,
  StatusChip,
} from "@/components/primitives";
import { Burndown } from "@/components/widgets/Burndown";
import { useDrawer } from "@/lib/context";
import { DATA } from "@/lib/data";

export default function SprintsPage() {
  const { openDrawer } = useDrawer();
  const sprintItems = DATA.workItems.filter((w) => w.sprint === 3);
  const backlog = DATA.workItems.filter((w) => !w.sprint && w.status === "ready");
  const sprint = DATA.sprint;
  const pctComplete = Math.min(
    100,
    Math.round((100 * sprint.completed) / Math.max(sprint.committed, 1)),
  );

  return (
    <>
      {/* Sprint summary header */}
      <div className="mb-[14px] rounded-card border border-border bg-surface p-[14px_16px] shadow-card">
        <div className="flex items-center gap-[14px]">
          <div>
            <div className="flex items-center gap-[8px] text-[16px] font-semibold">
              {sprint.name}
              <Chip tone="green">active</Chip>
            </div>
            <div className="text-base text-muted">{sprint.window} · 4 days left</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-[20px] text-base">
            <div>
              <div className="text-sm text-muted">Committed</div>
              <div className="text-lg font-semibold">{sprint.committed} pts</div>
            </div>
            <div>
              <div className="text-sm text-muted">Completed</div>
              <div className="text-lg font-semibold text-green-dot">
                {sprint.completed} pts
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Capacity</div>
              <div className="text-lg font-semibold">{sprint.capacity} pts</div>
            </div>
          </div>
          <Button>Plan next sprint</Button>
          <Button variant="danger">Close Sprint 3</Button>
        </div>
        <div className="mt-[12px] h-[6px] overflow-hidden rounded-xs bg-stripe">
          <div
            className="h-full rounded-xs bg-indigo"
            style={{ width: `${pctComplete}%` }}
          />
        </div>
      </div>

      {/* AI sprint intelligence */}
      <div className="mb-[14px] grid grid-cols-3 gap-[12px]">
        <div className="rounded-card border border-amber-border bg-amber-bg p-[10px_12px]">
          <div className="mb-[4px] flex items-center gap-[7px] text-base font-semibold text-yellow-text">
            <Icon name="warn" size={13} color="#78350F" /> Conflict · serialize
          </div>
          <div className="text-base leading-[1.5] text-yellow-text-2">
            WI-LM-LA-02 and WI-LM-LC-04 both modify the Lead object. Recommend
            serializing: LA-02 first, then LC-04.
          </div>
        </div>
        <div className="rounded-2xl border border-violet-border bg-gradient-to-br from-violet-grad-start to-violet-grad-end p-[12px]">
          <div className="mb-[8px] flex items-center gap-[8px] text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-text-2">
            <Icon name="sparkle" size={11} /> PARALLELIZATION
          </div>
          <div className="text-base leading-[1.5] text-indigo-text-2">
            WI-LM-LA-03 (notify) and WI-LM-LA-05 (reason logging) have no
            component overlap. Safe to run concurrently.
          </div>
        </div>
        <div className="rounded-2xl border border-violet-border bg-gradient-to-br from-violet-grad-start to-violet-grad-end p-[12px]">
          <div className="mb-[8px] flex items-center gap-[8px] text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-text-2">
            <Icon name="sparkle" size={11} /> CAPACITY
          </div>
          <div className="text-base leading-[1.5] text-indigo-text-2">
            David is at 29 pts · team capacity 45. Ship WI-LM-LC-02 to unassigned
            or spread across the team.
          </div>
        </div>
      </div>

      {/* Backlog vs Sprint committed */}
      <div className="mb-[14px] grid grid-cols-2 gap-[12px]">
        <div>
          <div className="mb-[10px] flex items-center gap-[10px]">
            <h2 className="m-0 text-md font-semibold uppercase tracking-[0.04em] text-ink-3">
              Backlog · Ready
            </h2>
            <div className="ml-auto flex gap-[6px]">
              <span className="text-sm text-muted">
                {backlog.length} items · drag into sprint →
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {backlog.map((w) => (
              <div
                key={w.id}
                className="flex cursor-grab items-center gap-[10px] border-b border-stripe px-[12px] py-[10px] hover:bg-row-hover"
                onClick={() => openDrawer("workItem", { id: w.id })}
              >
                <Icon name="grid" size={12} color="#94A3B8" />
                <span className="mono w-[100px] text-sm text-ink-3">{w.id}</span>
                <span className="flex-1 text-base font-medium">{w.title}</span>
                {w.blocked && <Chip tone="red">blocked</Chip>}
                <span className="text-sm font-semibold text-ink-3">{w.points}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-[10px] flex items-center gap-[10px]">
            <h2 className="m-0 text-md font-semibold uppercase tracking-[0.04em] text-ink-3">
              Sprint 3 committed
            </h2>
            <div className="ml-auto flex gap-[6px]">
              <span className="text-sm text-muted">
                {sprintItems.length} items · {sprint.committed} pts
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {sprintItems.map((w) => (
              <div
                key={w.id}
                className="flex cursor-pointer items-center gap-[10px] border-b border-stripe px-[12px] py-[10px] hover:bg-row-hover"
                onClick={() => openDrawer("workItem", { id: w.id })}
              >
                <span className="mono w-[100px] text-sm text-ink-3">{w.id}</span>
                <span className="flex-1 text-base font-medium">{w.title}</span>
                {w.assignee ? (
                  <Avatar person={w.assignee} size="xs" />
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
                <StatusChip status={w.status} />
                <span className="text-sm font-semibold text-ink-3">{w.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Burndown + history */}
      <div className="grid grid-cols-2 gap-[12px]">
        <div className="rounded-card border border-border bg-surface p-[14px_16px] shadow-card">
          <h3 className="m-0 mb-[10px] text-md font-semibold tracking-[-0.01em] text-ink">
            Burndown
          </h3>
          <Burndown pointsLeft={sprint.remaining} height={160} />
        </div>
        <div className="rounded-card border border-border bg-surface p-[14px_16px] shadow-card">
          <h3 className="m-0 mb-[10px] text-md font-semibold tracking-[-0.01em] text-ink">
            Sprint history
          </h3>
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.04em] text-muted">
                <th className="py-[6px] font-semibold">Sprint</th>
                <th className="py-[6px] font-semibold">Window</th>
                <th className="py-[6px] font-semibold">Committed</th>
                <th className="py-[6px] font-semibold">Completed</th>
                <th className="py-[6px] font-semibold">Carryover</th>
              </tr>
            </thead>
            <tbody>
              {sprint.history.map((h) => (
                <tr key={h.name} className="border-t border-stripe">
                  <td className="py-[8px] font-medium text-ink">{h.name}</td>
                  <td className="py-[8px] text-ink-3">{h.window}</td>
                  <td className="py-[8px] text-ink-3">{h.committed}</td>
                  <td className="py-[8px] text-ink-3">{h.completed}</td>
                  <td className="py-[8px] text-ink-3">
                    {h.carryover === null ? "—" : h.carryover}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
