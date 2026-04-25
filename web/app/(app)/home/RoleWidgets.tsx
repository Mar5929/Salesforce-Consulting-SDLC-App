// Role-adaptive widget band on the Home tab.
// Port of `RoleWidgets` + `BurndownMini` from
// visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/home.jsx.
//
// Each role gets 3 cards. The widget set surfaces what that persona cares
// about most when the briefing opens. We keep the layout in a 3-column grid
// and let each card click navigate to a richer view.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import {
  Avatar,
  Chip,
  Icon,
  Readiness,
  StatusChip,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer } from "@/lib/context";

/* ---------------- Routing helpers ---------------- */

type WorkSub = "home" | "items" | "sprints" | "admin" | "roadmap";

function workHref(sub?: WorkSub): string {
  switch (sub) {
    case "items":
      return "/work/items";
    case "sprints":
      return "/work/sprints";
    case "admin":
      return "/work/admin";
    case "roadmap":
      return "/work/roadmap";
    case "home":
    default:
      return "/work/home";
  }
}

function tabHref(tab: string, sub?: string): string {
  if (tab === "work") return workHref(sub as WorkSub | undefined);
  return `/${tab}`;
}

/* ---------------- Section link pill ---------------- */

interface SectionLinkProps {
  href: string;
  label?: string;
}

function SectionLink({ href, label = "View all →" }: SectionLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="ml-auto rounded-pill bg-indigo-bg px-[7px] py-[2px] text-[10.5px] font-medium text-indigo no-underline"
    >
      {label}
    </Link>
  );
}

/* ---------------- Inline tlink-style button ---------------- */

interface TLinkProps {
  onClick: () => void;
  children: ReactNode;
}

function TLink({ onClick, children }: TLinkProps) {
  return (
    <button
      type="button"
      data-stop
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer font-medium text-indigo hover:underline"
    >
      {children}
    </button>
  );
}

/* ---------------- Card shell ---------------- */
//
// The prototype attaches an onClick to the whole card that navigates, but
// only when the click target isn't a button / link / .tlink / [data-stop].
// We re-create that behavior with a shouldNavigate guard.

interface RoleCardProps {
  title: string;
  pill?: string;
  pillHot?: boolean;
  link?: ReactNode;
  cardHref?: string;
  children: ReactNode;
}

function RoleCard({
  title,
  pill,
  pillHot,
  link,
  cardHref,
  children,
}: RoleCardProps) {
  const router = useRouter();
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardHref) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [data-stop]")) return;
    router.push(cardHref);
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-[14px_16px] ${
        cardHref ? "cursor-pointer" : ""
      }`}
      onClick={cardHref ? handleClick : undefined}
    >
      <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
        <span>{title}</span>
        {pill && (
          <span
            className={`ml-auto rounded-pill px-[7px] py-[2px] text-[10.5px] font-medium normal-case tracking-normal ${
              pillHot ? "bg-red-bg text-red-text" : "bg-stripe text-ink-3"
            }`}
          >
            {pill}
          </span>
        )}
        {link && !pill && link}
      </h3>
      {children}
      {link && pill && (
        <div className="mt-[10px] flex justify-end border-t border-dashed border-border pt-[8px]">
          {link}
        </div>
      )}
    </div>
  );
}

/* ---------------- BurndownMini ---------------- */

function BurndownMini() {
  return (
    <svg
      viewBox="0 0 260 100"
      style={{ width: "100%", height: 100 }}
      aria-hidden
    >
      <defs>
        <linearGradient id="burnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.2" />
          <stop offset="1" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="20" x2="250" y1={y} y2={y} stroke="#F1F5F9" />
      ))}
      <line
        x1="20"
        y1="20"
        x2="250"
        y2="80"
        stroke="#CBD5E1"
        strokeDasharray="3 3"
        strokeWidth="1.2"
      />
      <polyline
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2"
        points="20,20 60,28 100,34 140,42 180,54"
      />
      <polyline
        fill="url(#burnFill)"
        stroke="none"
        points="20,20 60,28 100,34 140,42 180,54 180,80 20,80"
      />
      <line
        x1="180"
        y1="15"
        x2="180"
        y2="80"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text x="186" y="22" fontSize="9" fill="#4F46E5" fontFamily="Inter">
        Today · 16 pts left
      </text>
      <text x="20" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 14
      </text>
      <text x="110" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 21
      </text>
      <text x="228" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 28
      </text>
    </svg>
  );
}

/* ---------------- RoleWidgets ---------------- */

export interface RoleWidgetsProps {
  viewingAs: string;
}

export function RoleWidgets({ viewingAs }: RoleWidgetsProps) {
  const { openDrawer } = useDrawer();

  const role = (DATA.team.find((m) => m.id === viewingAs) ? viewingAs : "sarah");

  return (
    <div className="grid grid-cols-3 gap-[12px]">
      {role === "sarah" && <SarahWidgets openDrawer={openDrawer} />}
      {role === "jamie" && <JamieWidgets openDrawer={openDrawer} />}
      {role === "david" && <DavidWidgets openDrawer={openDrawer} />}
      {role === "priya" && <PriyaWidgets openDrawer={openDrawer} />}
      {role === "marcus" && <MarcusWidgets openDrawer={openDrawer} />}
      {role === "michael" && <SarahWidgets openDrawer={openDrawer} />}
    </div>
  );
}

/* ---------------- Per-role widget sets ---------------- */

interface RoleSetProps {
  openDrawer: ReturnType<typeof useDrawer>["openDrawer"];
}

function SarahWidgets({ openDrawer }: RoleSetProps) {
  return (
    <>
      {/* Pending AI proposals */}
      <RoleCard title="Pending AI proposals" pill="2 pending" pillHot>
        <div className="flex flex-col gap-[8px]">
          <button
            type="button"
            data-stop
            onClick={() => openDrawer("reproposal", {})}
            className="block w-full cursor-pointer rounded-lg border border-amber-border bg-amber-grad-1 px-[12px] py-[10px] text-left"
          >
            <div className="flex items-center gap-[8px]">
              <Icon name="warn" size={14} color="#D97706" />
              <div className="text-[12.5px] font-semibold text-ink">
                P3 CPQ restructure
              </div>
              <Chip tone="amber">requires SA</Chip>
            </div>
            <div className="mt-[4px] text-[11.5px] text-yellow-text-2">
              13 work items · 1 in-flight build · fired 4h ago
            </div>
          </button>
          <div className="rounded-lg border border-violet-border bg-violet-grad-start px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px]">
              <Icon name="database" size={14} color="#6D28D9" />
              <div className="text-[12.5px] font-semibold text-ink">
                Opportunity Workflow domain
              </div>
              <Chip tone="violet">AI-proposed</Chip>
            </div>
            <div className="mt-[4px] text-[11.5px] text-violet-text">
              22 components clustered · awaiting SA confirm
            </div>
          </div>
        </div>
      </RoleCard>

      {/* Epic readiness rollup */}
      <RoleCard
        title="Epic readiness rollup"
        link={<SectionLink href={tabHref("work", "roadmap")} />}
        cardHref={tabHref("work", "roadmap")}
      >
        <div className="flex flex-col gap-[7px]">
          {DATA.epics.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-[10px] text-[12px]"
            >
              <span className="w-[52px] font-mono text-[10.5px] text-ink-3">
                {e.id}
              </span>
              <span className="flex-1 text-ink">{e.name}</span>
              {e.openQs > 0 && (
                <Chip tone="amber" className="text-[10.5px]">
                  {e.openQs}Q
                </Chip>
              )}
              <Readiness score={e.readiness} />
            </div>
          ))}
        </div>
      </RoleCard>

      {/* Decisions awaiting my signoff */}
      <RoleCard
        title="Decisions awaiting my signoff"
        link={<SectionLink href={tabHref("knowledge")} label="Open Knowledge →" />}
        cardHref={tabHref("knowledge")}
      >
        <div className="py-[10px] text-[12.5px] text-muted">
          <div className="flex items-center gap-[10px] border-b border-stripe py-[6px]">
            <span className="font-mono text-[10.5px] text-ink-3">D-?-DRAFT</span>
            <span className="flex-1 text-ink">
              Migrate closed-lost opps only if client IT confirms format
            </span>
            <button
              type="button"
              data-stop
              className="rounded-lg border border-border bg-surface px-[9px] py-[3px] text-[11.5px] font-medium text-ink-2 hover:bg-canvas hover:border-border-hover"
            >
              Review
            </button>
          </div>
          <div className="flex items-center gap-[10px] py-[6px]">
            <span className="font-mono text-[10.5px] text-ink-3">D-?-DRAFT</span>
            <span className="flex-1 text-ink">
              Adopt Acme 7-stage opportunity model globally
            </span>
            <button
              type="button"
              data-stop
              className="rounded-lg border border-border bg-surface px-[9px] py-[3px] text-[11.5px] font-medium text-ink-2 hover:bg-canvas hover:border-border-hover"
            >
              Review
            </button>
          </div>
        </div>
      </RoleCard>
    </>
  );
}

function JamieWidgets({ openDrawer }: RoleSetProps) {
  return (
    <>
      {/* Sprint 3 burndown */}
      <RoleCard
        title="Sprint 3 burndown"
        link={
          <SectionLink href={tabHref("work", "sprints")} label="Open Sprints →" />
        }
        cardHref={tabHref("work", "sprints")}
      >
        <BurndownMini />
      </RoleCard>

      {/* Blockers */}
      <RoleCard
        title="Blockers"
        pill="1 blocker"
        pillHot
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <div className="py-[8px] text-[12.5px] text-ink-2">
          <div>
            <span className="font-mono text-[10.5px]">WI-LM-LC-01</span> blocked
            by{" "}
            <TLink onClick={() => openDrawer("question", { id: "Q-LM-LC-003" })}>
              Q-LM-LC-003
            </TLink>{" "}
            · owner Priya
          </div>
        </div>
      </RoleCard>

      {/* Admin tasks */}
      <RoleCard
        title="Admin tasks due this week"
        link={
          <SectionLink
            href={tabHref("work", "admin")}
            label="Open Admin Tasks →"
          />
        }
        cardHref={tabHref("work", "admin")}
      >
        <div className="flex flex-col gap-[6px]">
          {DATA.adminTasks
            .filter((t) => t.status !== "Done")
            .slice(0, 3)
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-[10px] text-[12px]"
              >
                <Avatar person={t.owner} size="xs" />
                <span className="flex-1 text-ink">{t.title}</span>
                <span className="text-[11.5px] text-muted">
                  {t.due.slice(5)}
                </span>
              </div>
            ))}
        </div>
      </RoleCard>
    </>
  );
}

function DavidWidgets({ openDrawer }: RoleSetProps) {
  return (
    <>
      {/* My work items */}
      <RoleCard
        title="My work items"
        pill="4 assigned"
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <div className="flex flex-col gap-[6px]">
          {DATA.workItems
            .filter((w) => w.assignee === "david")
            .slice(0, 5)
            .map((w) => (
              <button
                type="button"
                key={w.id}
                data-stop
                onClick={() => openDrawer("workItem", { id: w.id })}
                className="flex w-full cursor-pointer items-center gap-[10px] text-left text-[12px]"
              >
                <span className="w-[100px] font-mono text-[10.5px] text-ink-3">
                  {w.id}
                </span>
                <span className="flex-1 text-ink">{w.title}</span>
                <StatusChip status={w.status} />
              </button>
            ))}
        </div>
      </RoleCard>

      {/* Context-package readiness */}
      <RoleCard
        title="Context-package readiness"
        link={<SectionLink href={tabHref("work", "items")} />}
        cardHref={tabHref("work", "items")}
      >
        <div className="text-[12px] text-ink-2 leading-[1.6]">
          <button
            type="button"
            data-stop
            onClick={() => openDrawer("workItem", { id: "WI-LM-LA-02" })}
            className="block w-full cursor-pointer text-left"
          >
            WI-LM-LA-02: <Chip tone="green">plan approved</Chip>
          </button>
          <button
            type="button"
            data-stop
            onClick={() => openDrawer("workItem", { id: "WI-LM-LA-03" })}
            className="block w-full cursor-pointer text-left"
          >
            WI-LM-LA-03: <Chip tone="amber">needs solutioning</Chip>
          </button>
          <button
            type="button"
            data-stop
            onClick={() => openDrawer("workItem", { id: "WI-LM-LC-04" })}
            className="block w-full cursor-pointer text-left"
          >
            WI-LM-LC-04: <Chip tone="red">plan stale · BR changed</Chip>
          </button>
        </div>
      </RoleCard>

      {/* Sprint conflicts touching me */}
      <RoleCard
        title="Sprint conflicts touching me"
        link={
          <SectionLink href={tabHref("work", "sprints")} label="Open Sprints →" />
        }
        cardHref={tabHref("work", "sprints")}
      >
        <div className="text-[12px] text-yellow-text-2">
          <div>
            WI-LM-LA-02 and WI-LM-LC-04 both modify Lead object — serialize?
          </div>
        </div>
      </RoleCard>
    </>
  );
}

function PriyaWidgets({ openDrawer }: RoleSetProps) {
  return (
    <>
      {/* Stories to write */}
      <RoleCard
        title="Stories to write"
        pill="7 in queue"
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <div className="flex flex-col gap-[6px] text-[12px]">
          {[
            "WI-CPQ-IM-01 Bundle data model",
            "WI-CPQ-IM-02 Attribute picklists",
            "WI-CPQ-PR-01 Volume tiers",
            "WI-OPP-MG-02 Renewal stage path",
          ].map((t) => (
            <div key={t} className="flex items-center gap-[10px]">
              <Icon name="edit" size={12} color="#64748B" />
              <span className="flex-1">{t}</span>
              <Chip tone="gray" className="text-[10.5px]">
                draft
              </Chip>
            </div>
          ))}
        </div>
      </RoleCard>

      {/* Pending review from my transcripts */}
      <RoleCard
        title="Pending review from my transcripts"
        pill="6 items"
        pillHot
        link={<SectionLink href={tabHref("discovery")} label="Open Discovery →" />}
        cardHref={tabHref("discovery")}
      >
        <div className="text-[12px] text-ink-2">
          <div>2 requirements · 2 questions · 1 scope change · 1 annotation</div>
          <Link
            href={tabHref("discovery")}
            data-stop
            onClick={(e) => e.stopPropagation()}
            className="mt-[8px] inline-flex cursor-pointer items-center gap-[6px] rounded-lg border border-indigo bg-indigo px-[9px] py-[3px] text-[11.5px] font-medium text-white no-underline hover:bg-indigo-2 hover:border-indigo-2"
          >
            Open review queue
          </Link>
        </div>
      </RoleCard>

      {/* My open questions */}
      <RoleCard
        title="My open questions"
        link={<SectionLink href={tabHref("questions")} label="Open Questions →" />}
        cardHref={tabHref("questions")}
      >
        <div className="text-[12px]">
          <button
            type="button"
            data-stop
            onClick={() => openDrawer("question", { id: "Q-LM-LC-003" })}
            className="block w-full cursor-pointer py-[5px] text-left"
          >
            Q-LM-LC-003 · blocks WI-LM-LC-01
          </button>
        </div>
      </RoleCard>
    </>
  );
}

function MarcusWidgets({ openDrawer }: RoleSetProps) {
  return (
    <>
      {/* Items waiting for QA */}
      <RoleCard
        title="Items waiting for QA"
        pill="1 in QA"
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <button
          type="button"
          data-stop
          onClick={() => openDrawer("workItem", { id: "WI-LM-LA-04" })}
          className="block w-full cursor-pointer text-left text-[12px]"
        >
          <div>
            WI-LM-LA-04 Assignment audit trail · 3 tests · 1 open defect
          </div>
        </button>
      </RoleCard>

      {/* Open defects */}
      <RoleCard
        title="Open defects"
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <div className="text-[12px]">
          <div>DEF-011 · High · audit trail missing reassignment events</div>
          <div>DEF-008 · Medium · manager override UI shifts on long names</div>
        </div>
      </RoleCard>

      {/* Test cases to write */}
      <RoleCard
        title="Test cases to write"
        link={
          <SectionLink
            href={tabHref("work", "items")}
            label="Open Work Items →"
          />
        }
        cardHref={tabHref("work", "items")}
      >
        <div className="text-[12px]">
          <div>4 work items in Draft have zero test cases.</div>
        </div>
      </RoleCard>
    </>
  );
}
