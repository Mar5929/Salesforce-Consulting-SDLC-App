"use client";

// Work > Items > Tree — port of work.jsx TreeLens.
// 3-level grid: phase → epic → work item. Click WI → workItem drawer.
// Click readiness bar → readiness drawer.

import { Fragment, useState } from "react";

import {
  Avatar,
  Chip,
  Icon,
  Readiness,
  StatusChip,
} from "@/components/primitives";
import { useDrawer } from "@/lib/context";
import { DATA } from "@/lib/data";

const HEADER_CLASSES =
  "grid grid-cols-[1fr_140px_100px_100px_120px_110px] items-center gap-[8px] border-b border-stripe px-[10px] py-[7px]";

export default function TreePage() {
  const { openDrawer } = useDrawer();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    P1: true,
    "LM-LA": true,
  });
  const toggle = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div
        className={`${HEADER_CLASSES} bg-canvas text-[10.5px] font-semibold uppercase tracking-[0.04em] text-muted`}
      >
        <div>Name</div>
        <div>Readiness</div>
        <div>Assignee</div>
        <div>Status</div>
        <div>Points / Qs</div>
        <div />
      </div>
      <div className="text-base">
        {DATA.phases.map((p) => {
          const epics = DATA.epics.filter((e) => e.phase === p.id);
          const open = !!expanded[p.id];
          return (
            <Fragment key={p.id}>
              <div
                className={`${HEADER_CLASSES} cursor-pointer border-b border-border bg-canvas font-semibold text-ink hover:bg-row-hover`}
                onClick={() => toggle(p.id)}
              >
                <div className="flex min-w-0 items-center gap-[8px]">
                  <span className="grid w-[14px] place-items-center text-muted-2">
                    <Icon
                      name={open ? "chevronDown" : "chevronRight"}
                      size={12}
                    />
                  </span>
                  <span
                    className={`mono rounded-sm px-[6px] py-[2px] text-xs font-semibold ${
                      p.reprop
                        ? "bg-yellow-dot text-white"
                        : "bg-indigo-bg-2 text-indigo-text"
                    }`}
                  >
                    {p.id}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {p.name}
                  </span>
                  {p.reprop && <Chip tone="amber">re-proposal pending</Chip>}
                </div>
                <div>
                  <Readiness
                    score={p.readiness}
                    onClick={() =>
                      openDrawer("readiness", {
                        score: p.readiness,
                        subject: `${p.id} ${p.name}`,
                      })
                    }
                  />
                </div>
                <div />
                <div />
                <div className="text-sm text-muted">{epics.length} epics</div>
                <div />
              </div>

              {open &&
                epics.map((e) => {
                  const wis = DATA.workItems.filter((w) => w.epic === e.id);
                  const eopen = !!expanded[e.id];
                  return (
                    <Fragment key={e.id}>
                      <div
                        className={`${HEADER_CLASSES} cursor-pointer bg-surface pl-[28px] font-medium hover:bg-row-hover`}
                        onClick={() => toggle(e.id)}
                      >
                        <div className="flex min-w-0 items-center gap-[8px]">
                          <span className="grid w-[14px] place-items-center text-muted-2">
                            <Icon
                              name={eopen ? "chevronDown" : "chevronRight"}
                              size={12}
                            />
                          </span>
                          <span
                            className={`mono rounded-sm px-[6px] py-[2px] text-xs font-semibold ${
                              e.reprop === "remove"
                                ? "bg-red-bg text-red-text line-through"
                                : "bg-stripe text-ink-3"
                            }`}
                          >
                            {e.id}
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {e.name}
                          </span>
                          {e.reprop === "remove" && <Chip tone="red">removing</Chip>}
                        </div>
                        <div>
                          <Readiness
                            score={e.readiness}
                            onClick={() =>
                              openDrawer("readiness", {
                                score: e.readiness,
                                subject: `${e.id} ${e.name}`,
                              })
                            }
                          />
                        </div>
                        <div />
                        <div />
                        <div className="text-sm text-muted">
                          {e.wiCount} items
                          {e.openQs > 0 && (
                            <span className="text-red-text">
                              {" · "}
                              {e.openQs} Qs
                            </span>
                          )}
                        </div>
                        <div />
                      </div>

                      {eopen &&
                        wis.map((w) => (
                          <div
                            key={w.id}
                            className={`${HEADER_CLASSES} cursor-pointer pl-[56px] text-ink-2 hover:bg-row-hover`}
                            onClick={() => openDrawer("workItem", { id: w.id })}
                          >
                            <div className="flex min-w-0 items-center gap-[8px]">
                              <span className="mono w-[94px] shrink-0 text-xs text-muted">
                                {w.id}
                              </span>
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-ink">
                                {w.title}
                              </span>
                              {w.blocked && <Chip tone="red">blocked</Chip>}
                              {w.affectedByReprop && (
                                <Chip tone="amber">reprop impact</Chip>
                              )}
                            </div>
                            <div />
                            <div>
                              {w.assignee ? (
                                <Avatar person={w.assignee} size="xs" />
                              ) : (
                                <span className="text-sm text-muted">—</span>
                              )}
                            </div>
                            <div>
                              <StatusChip status={w.status} />
                            </div>
                            <div className="text-sm font-medium text-ink-3">
                              {w.points} pts
                            </div>
                            <div />
                          </div>
                        ))}
                    </Fragment>
                  );
                })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
