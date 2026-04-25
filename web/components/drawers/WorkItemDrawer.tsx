"use client";

// WorkItemDrawer — port of project/drawers.jsx WorkItemDrawer.
// Width lg (1080px). 2-column body: main 1fr + sidebar 300px.

import { Drawer } from "@/components/primitives";
import { Avatar, Button, Chip, Icon, StatusChip } from "@/components/primitives";
import { DATA } from "@/lib/data";
import type { WIStatus } from "@/lib/types";

export interface WorkItemDrawerProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

interface ImpactComponent {
  api: string;
  type: string;
  impact: string;
  chip: "amber" | "green";
}

interface TestRow {
  t: string;
  type: "positive" | "negative";
  s: "Pass" | "Not Executed";
}

const IMPACTED_COMPONENTS: ImpactComponent[] = [
  { api: "Lead", type: "Object", impact: "Modify", chip: "amber" },
  { api: "LeadAssignmentHandler", type: "Apex class", impact: "Modify", chip: "amber" },
  { api: "Manager_Override__c", type: "Field", impact: "Create", chip: "green" },
  { api: "Lead_Audit_Trail__c", type: "Object", impact: "Modify", chip: "amber" },
];

const TEST_ROWS: TestRow[] = [
  { t: "Manager can override via UI with reason captured", type: "positive", s: "Pass" },
  { t: "Override audit entry written with manager ID", type: "positive", s: "Pass" },
  { t: "Override blocked when manager lacks territory permission", type: "negative", s: "Not Executed" },
];

interface ActivityRow {
  who: string;
  what: string;
  when: string;
  person: string;
}

const ACTIVITY: ActivityRow[] = [
  { who: "David Kim", what: "moved to In Progress", when: "Apr 15", person: "david" },
  { who: "Sarah Chen", what: "approved implementation plan", when: "Apr 14", person: "sarah" },
  { who: "Priya Patel", what: "marked Ready with acceptance criteria", when: "Apr 13", person: "priya" },
];

function SectionHeader({
  children,
  count,
  action,
  className = "",
}: {
  children: React.ReactNode;
  count?: number | string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-[10px] mb-[10px] ${className}`}>
      <h3 className="m-0 text-[12px] font-semibold text-ink uppercase tracking-[0.06em]">
        {children}
      </h3>
      {count !== undefined && (
        <span className="text-sm text-muted-2">{count}</span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function GwtBlock({ given, when, then }: { given: string; when: string; then: string }) {
  return (
    <div className="bg-canvas border border-border rounded-lg px-[12px] py-[10px] text-[12px] leading-[1.6]">
      <div>
        <span className="text-indigo font-semibold font-mono text-[11px] inline-block w-[52px]">
          GIVEN
        </span>
        {given}
      </div>
      <div>
        <span className="text-indigo font-semibold font-mono text-[11px] inline-block w-[52px]">
          WHEN
        </span>
        {when}
      </div>
      <div>
        <span className="text-indigo font-semibold font-mono text-[11px] inline-block w-[52px]">
          THEN
        </span>
        {then}
      </div>
    </div>
  );
}

export function WorkItemDrawer({ open, onClose, id }: WorkItemDrawerProps) {
  const wi = DATA.workItems.find((w) => w.id === id);
  if (!wi) {
    return (
      <Drawer open={open} onClose={onClose} width="lg">
        <header className="flex items-center justify-between px-[18px] py-[14px] border-b border-border">
          <h2 className="text-md font-semibold">Work item not found</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
            <Icon name="x" size={14} />
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-[18px] text-sm text-muted">
          No work item with id <span className="font-mono">{id}</span>.
        </div>
      </Drawer>
    );
  }

  const epic = DATA.epics.find((e) => e.id === wi.epic);
  const phase = epic ? DATA.phases.find((p) => p.id === epic.phase) : undefined;
  const assignee = wi.assignee
    ? DATA.team.find((t) => t.id === wi.assignee)
    : null;
  const wiStatus: WIStatus = wi.status;

  return (
    <Drawer open={open} onClose={onClose} width="lg">
      {/* HEADER */}
      <div className="flex-shrink-0 px-[22px] pt-[14px] border-b border-border bg-surface">
        <div className="flex items-center pb-[8px]">
          <div className="flex items-center gap-[6px] text-sm text-muted">
            {phase && (
              <>
                <span className="text-indigo font-medium cursor-pointer">{phase.name}</span>
                <Icon name="chevronRight" size={11} color="#94A3B8" />
              </>
            )}
            {epic && (
              <>
                <span className="text-indigo font-medium cursor-pointer">{epic.name}</span>
                <Icon name="chevronRight" size={11} color="#94A3B8" />
              </>
            )}
            <span className="text-ink font-semibold text-[11px] font-mono">{wi.id}</span>
          </div>
          <div className="ml-auto flex items-center gap-[2px]">
            <Button variant="ghost" iconLeft={<Icon name="link" size={13} />}>
              Open full
            </Button>
            <div className="w-px h-[16px] bg-border mx-[4px]" />
            <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
              <Icon name="x" size={14} />
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-[10px] py-[2px] pb-[8px]">
          <span className="inline-flex items-center gap-[4px] px-[8px] py-[3px] border border-border rounded-md text-[11px] font-medium text-ink-3 bg-canvas mt-[4px] flex-shrink-0">
            User Story
          </span>
          <h2 className="m-0 text-xl font-semibold text-ink tracking-[-0.01em] leading-[1.25] flex-1">
            {wi.title}
          </h2>
        </div>

        <div className="flex items-center gap-[10px] py-[4px] pb-[12px] text-[12px] text-ink-3 flex-wrap">
          <span className="inline-flex items-center gap-[4px] cursor-pointer">
            <StatusChip status={wiStatus} />
          </span>
          <span className="text-border-hover">·</span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="text-ink-2 font-medium">Assignee</span>
            {assignee ? (
              <>
                <Avatar person={assignee.id} size="xs" />
                {assignee.name}
              </>
            ) : (
              <span className="text-muted">Unassigned</span>
            )}
          </span>
          <span className="text-border-hover">·</span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="text-ink-2 font-medium">Sprint</span>
            {wi.sprint ? `Sprint ${wi.sprint}` : "—"}
          </span>
          <span className="text-border-hover">·</span>
          <span className="inline-flex items-center gap-[6px]">
            <span className="text-ink-2 font-medium">Points</span>
            <b>{wi.points}</b>
          </span>
        </div>

        <div className="flex gap-[2px] mt-[2px]">
          <button
            type="button"
            className="px-[14px] pb-[10px] pt-[8px] text-[12.5px] font-medium text-ink border-b-[2px] border-indigo inline-flex items-center gap-[6px] cursor-pointer"
          >
            Detail
          </button>
          <button
            type="button"
            className="px-[14px] pb-[10px] pt-[8px] text-[12.5px] font-medium text-muted border-b-[2px] border-transparent inline-flex items-center gap-[6px] cursor-pointer hover:text-ink-2"
          >
            Activity
            <span className="text-[10.5px] text-muted bg-stripe rounded-[9px] px-[6px] py-[1px] font-medium">
              {ACTIVITY.length}
            </span>
          </button>
          <button
            type="button"
            className="px-[14px] pb-[10px] pt-[8px] text-[12.5px] font-medium text-muted border-b-[2px] border-transparent inline-flex items-center gap-[6px] cursor-pointer hover:text-ink-2"
          >
            Discussion
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-auto bg-canvas">
        <div className="grid grid-cols-[1fr_300px] min-h-full">
          {/* MAIN */}
          <div className="px-[22px] py-[20px] pb-[24px] border-r border-border bg-surface">
            <section>
              <SectionHeader>Description</SectionHeader>
              <div className="text-md2 leading-[1.65] text-ink-2">
                Sales managers need the ability to override the round-robin lead
                assignment when a specific rep is best-suited based on relationship
                history or territory expertise. The override must be auditable and
                reversible within a 24-hour window.
              </div>
            </section>

            <section className="mt-[22px]">
              <SectionHeader count={2}>Acceptance criteria</SectionHeader>
              <div className="border border-border rounded-card p-[12px_14px] mb-[8px] bg-surface">
                <div className="flex items-center gap-[10px] mb-[10px]">
                  <span className="w-[20px] h-[20px] rounded-[5px] bg-indigo-bg text-indigo text-[11px] font-semibold grid place-items-center font-mono">
                    1
                  </span>
                  <div className="text-md font-semibold text-ink flex-1">
                    Manager can override auto-assignment
                  </div>
                </div>
                <GwtBlock
                  given="a lead has been auto-assigned via round-robin"
                  when="a manager reassigns it to a specific rep with a reason"
                  then="the system records the override, notifies both reps, and logs audit entry"
                />
              </div>
              <div className="border border-border rounded-card p-[12px_14px] mb-[8px] bg-surface">
                <div className="flex items-center gap-[10px] mb-[10px]">
                  <span className="w-[20px] h-[20px] rounded-[5px] bg-indigo-bg text-indigo text-[11px] font-semibold grid place-items-center font-mono">
                    2
                  </span>
                  <div className="text-md font-semibold text-ink flex-1">
                    Override is reversible within 24 hours
                  </div>
                </div>
                <GwtBlock
                  given="an override was logged within the last 24 hours"
                  when="the original rep requests reversal"
                  then="assignment rolls back and audit shows both entries"
                />
              </div>
            </section>

            <section className="mt-[22px]">
              <SectionHeader count={1}>Linked discovery</SectionHeader>
              <div className="flex gap-[12px] px-[13px] py-[11px] border border-border rounded-card bg-surface mb-[6px] cursor-pointer hover:border-border-hover">
                <div className="w-[28px] h-[28px] rounded-lg grid place-items-center bg-green-bg flex-shrink-0">
                  <Icon name="messageSquare" size={14} color="#16A34A" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <span className="text-[11px] text-indigo font-medium">Q-LM-LA-001</span>
                    <Chip tone="green">answered</Chip>
                    <span className="text-sm text-muted ml-auto">Apr 12</span>
                  </div>
                  <div className="text-md text-ink font-medium leading-[1.4]">
                    What happens if a round-robin target is out of office?
                  </div>
                  <div className="mt-[6px] text-[12px] text-green-text-2 flex items-center gap-[5px]">
                    → Skip to next available rep; log skip reason on audit trail.
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-[22px]">
              <SectionHeader count={IMPACTED_COMPONENTS.length}>
                Impacted Salesforce components
              </SectionHeader>
              <div className="border border-border rounded-card overflow-hidden bg-surface">
                <div className="grid grid-cols-[1.7fr_1fr_1fr_90px] gap-[10px] bg-canvas px-[14px] py-[7px] text-[10.5px] uppercase tracking-[0.05em] text-muted font-semibold">
                  <span>Component</span>
                  <span>Type</span>
                  <span>Namespace</span>
                  <span>Impact</span>
                </div>
                {IMPACTED_COMPONENTS.map((c) => (
                  <div
                    key={c.api}
                    className="grid grid-cols-[1.7fr_1fr_1fr_90px] gap-[10px] items-center px-[14px] py-[9px] border-b border-stripe text-[12px] last:border-b-0"
                  >
                    <span className="inline-flex items-center gap-[7px]">
                      <Icon name="database" size={12} color="#64748B" />
                      <span className="font-mono font-medium text-ink">{c.api}</span>
                    </span>
                    <span className="text-ink-3">{c.type}</span>
                    <span className="text-[9.5px] uppercase tracking-[0.04em] text-orange-text bg-orange-bg px-[5px] py-[1px] rounded-xs font-semibold w-fit">
                      standard
                    </span>
                    <span>
                      <Chip tone={c.chip}>{c.impact}</Chip>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-[22px]">
              <SectionHeader
                count={TEST_ROWS.length}
                action={<Button size="sm">+ Test case</Button>}
              >
                Tests
              </SectionHeader>
              <div className="flex flex-col gap-[4px]">
                {TEST_ROWS.map((t) => (
                  <div
                    key={t.t}
                    className="flex items-center gap-[10px] px-[12px] py-[9px] border border-border rounded-[7px] bg-surface text-[12.5px]"
                  >
                    <div
                      className={`w-[20px] h-[20px] rounded-full grid place-items-center flex-shrink-0 ${
                        t.s === "Pass" ? "bg-green-bg" : "bg-stripe"
                      }`}
                    >
                      <Icon name="check" size={12} color={t.s === "Pass" ? "#16A34A" : "#94A3B8"} />
                    </div>
                    <span className="flex-1 text-ink">{t.t}</span>
                    <Chip tone={t.type === "positive" ? "sky" : "pink"}>{t.type}</Chip>
                    <Chip tone={t.s === "Pass" ? "green" : "gray"}>{t.s}</Chip>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="px-[16px] py-[16px] pb-[20px] flex flex-col gap-[12px] bg-canvas">
            {/* Properties */}
            <div className="bg-surface border border-border rounded-card overflow-hidden">
              <div className="px-[12px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted bg-canvas border-b border-border flex items-center gap-[6px]">
                <Icon name="list" size={12} color="#64748B" /> Properties
              </div>
              <div className="py-[4px]">
                {[
                  { k: "Reporter", v: "Sarah Chen" },
                  { k: "Parent epic", v: epic ? `${epic.id} ${epic.name}` : "—" },
                  { k: "Sprint", v: wi.sprint ? `Sprint ${wi.sprint} · active` : "—" },
                  { k: "Story points", v: String(wi.points) },
                  { k: "Priority", v: "High" },
                ].map((p) => (
                  <div
                    key={p.k}
                    className="grid grid-cols-[90px_1fr] gap-[10px] px-[12px] py-[6px] text-[12px] items-center min-h-[28px] hover:bg-canvas cursor-pointer"
                  >
                    <span className="text-muted font-medium">{p.k}</span>
                    <span className="text-ink inline-flex items-center gap-[6px] min-w-0">{p.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini tree */}
            <div className="bg-surface border border-border rounded-card overflow-hidden">
              <div className="px-[12px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted bg-canvas border-b border-border flex items-center gap-[6px]">
                <Icon name="folder" size={12} color="#64748B" /> Hierarchy
              </div>
              <div className="px-[12px] py-[10px] text-[12px]">
                {phase && (
                  <div className="flex items-center gap-[7px] py-[4px]">
                    <Icon name="folder" size={11} color="#64748B" />
                    <span className="text-ink-2">{phase.id} · {phase.name}</span>
                  </div>
                )}
                {epic && (
                  <div className="flex items-center gap-[7px] py-[4px] pl-[14px]">
                    <Icon name="folder" size={11} color="#64748B" />
                    <span className="text-ink-2">{epic.id} {epic.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-[7px] py-[4px] pl-[28px] -mx-[12px] px-[12px] bg-indigo-bg rounded-md">
                  <Icon name="file" size={11} color="#4F46E5" />
                  <span className="text-indigo-text font-medium">{wi.id}</span>
                </div>
              </div>
            </div>

            {/* Checks */}
            <div className="bg-surface border border-border rounded-card overflow-hidden">
              <div className="px-[12px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted bg-canvas border-b border-border flex items-center gap-[6px]">
                <Icon name="check" size={12} color="#64748B" /> Readiness checks
              </div>
              <div className="px-[12px] py-[10px] flex flex-col gap-[5px]">
                {[
                  { t: "Description filled", done: true },
                  { t: "Acceptance criteria written", done: true },
                  { t: "Components linked", done: true },
                  { t: "Tests defined", done: true },
                  { t: "Reviewer approval", done: false },
                ].map((c) => (
                  <div
                    key={c.t}
                    className={`flex items-center gap-[7px] text-[12px] ${
                      c.done ? "text-ink" : "text-muted"
                    }`}
                  >
                    <Icon name="check" size={12} color={c.done ? "#16A34A" : "#94A3B8"} />
                    <span>{c.t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI card */}
            <div className="bg-gradient-to-b from-violet-grad-start to-surface border border-violet-border rounded-card overflow-hidden">
              <div className="px-[12px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-violet-text bg-violet-grad-end border-b border-violet-border flex items-center gap-[6px]">
                <Icon name="sparkle" size={12} color="#5B21B6" /> AI suggestion
              </div>
              <div className="px-[12px] py-[11px] pb-[13px] text-[12px] leading-[1.55] text-ink-2">
                Consider adding a negative test for managers without territory permission — current
                draft only verifies positive override paths.
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex gap-[6px] items-center px-[18px] py-[10px] border-t border-border bg-surface flex-shrink-0">
        <Button>Reassign</Button>
        <Button>Change status</Button>
        <div className="flex-1" />
        <Button variant="primary" iconLeft={<Icon name="plus" size={11} color="#ffffff" />}>
          Comment
        </Button>
      </div>
    </Drawer>
  );
}

export default WorkItemDrawer;
