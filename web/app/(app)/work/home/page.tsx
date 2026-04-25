// Work › Home
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/work.jsx
// `WorkHome` component (lines 29-83).

"use client";

import { Avatar, Button, Card, Chip, Icon, KpiCard, Table, TD, TR } from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer } from "@/lib/context";
import type { AdminTaskStatus } from "@/lib/types";

interface ActivityRow {
  who: string;
  what: string;
  when: string;
  initials: string;
  colorClass: string;
}

const ACTIVITY_ROWS: ActivityRow[] = [
  { who: "AI", what: "fired P3 roadmap re-proposal", when: "08:14", initials: "AI", colorClass: "bg-a-michael" },
  { who: "David Kim", what: "moved WI-LM-LA-01 to In Review", when: "Yesterday", initials: "DK", colorClass: "bg-a-david" },
  { who: "Sarah Chen", what: "approved v3 roadmap", when: "Apr 2", initials: "SC", colorClass: "bg-a-sarah" },
];

function StatusChipInline({ status }: { status: AdminTaskStatus }) {
  if (status === "Done") return <Chip tone="green">Done</Chip>;
  if (status === "In Progress") return <Chip tone="amber">In Progress</Chip>;
  return <Chip tone="gray">Open</Chip>;
}

export default function WorkHomePage() {
  const { openDrawer } = useDrawer();
  const adminTasks = DATA.adminTasks.slice(0, 4);

  return (
    <>
      {/* Re-proposal banner */}
      <div className="mb-[14px] flex items-center gap-[12px] rounded-card border border-amber-border bg-gradient-to-r from-amber-grad-1 to-amber-grad-2 px-[14px] py-[12px]">
        <div className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-card bg-yellow-dot text-white">
          <Icon name="sparkle" size={16} color="#ffffff" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-yellow-text">
            Roadmap re-proposal pending SA review
          </div>
          <div className="mt-[2px] text-[12px] text-yellow-text-2">
            P3 CPQ restructure · Jump to Roadmap to review diff
          </div>
        </div>
        <Button variant="amber" onClick={() => openDrawer("reproposal", {})}>
          Review diff
        </Button>
      </div>

      {/* KPIs */}
      <div className="mb-[14px] grid grid-cols-4 gap-[12px]">
        <KpiCard label="Phases" value="4" />
        <KpiCard label="Epics" value="7" sub="1 being removed" />
        <KpiCard label="Work items" value="41" sub="+12 proposed" />
        <KpiCard
          label="Blocked"
          value={<span className="text-red-text">1</span>}
        />
      </div>

      {/* Two-column row: admin tasks + activity */}
      <div className="grid grid-cols-2 gap-[12px]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Admin tasks due this week
          </h3>
          <Table>
            <tbody>
              {adminTasks.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium">{t.title}</TD>
                  <TD>
                    <Avatar person={t.owner} size="xs" />
                  </TD>
                  <TD className="font-mono text-sm">{t.due}</TD>
                  <TD>
                    <StatusChipInline status={t.status} />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Recent activity · 48h
          </h3>
          <div className="flex flex-col gap-[10px]">
            {ACTIVITY_ROWS.map((r, i) => (
              <div key={i} className="flex items-start gap-[10px]">
                <div
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white ${r.colorClass}`}
                >
                  {r.initials}
                </div>
                <div className="text-[12px] leading-[1.5] text-ink-2">
                  <span className="font-semibold text-ink">{r.who}</span>{" "}
                  <span className="text-muted">{r.what}</span>{" "}
                  <span className="ml-[4px] text-[11px] text-muted-2">· {r.when}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
