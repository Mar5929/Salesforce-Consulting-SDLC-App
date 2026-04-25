// Home tab — Project Briefing.
// Port of visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/home.jsx.
//
// Layout, top to bottom:
//   1. Re-proposal banner (amber)
//   2. KPI grid (4 tiles)
//   3. Current Focus AI card + Recommended focus card (2:1)
//   4. Role-adaptive widget band (3 cards, varies by viewing-as)
//   5. Recent activity + Phase readiness (1:1)
//
// This file is a client component because it dispatches drawer-open events
// via useDrawer() and reads the current viewing-as role from useViewingAs().

"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  AiCard,
  Avatar,
  Chip,
  Icon,
  KpiCard,
  Readiness,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer, useViewingAs } from "@/lib/context";

import { RoleWidgets } from "./RoleWidgets";

/* ---------------- Inline tlink for AI-card prose ---------------- */

interface TLinkProps {
  onClick: () => void;
  children: ReactNode;
}

function TLink({ onClick, children }: TLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer font-medium text-indigo hover:underline"
    >
      {children}
    </button>
  );
}

/* ---------------- Recent activity rows ---------------- */

interface ActivityRow {
  who: string;
  what: string;
  when: string;
  avatar: string;
  initials: string;
  colorKey:
    | "a-sarah"
    | "a-david"
    | "a-jamie"
    | "a-priya"
    | "a-marcus"
    | "a-michael";
}

const ACTIVITY: ActivityRow[] = [
  {
    who: "AI",
    what: "fired roadmap re-proposal on P3 CPQ restructure",
    when: "08:14",
    avatar: "a-michael",
    initials: "AI",
    colorKey: "a-michael",
  },
  {
    who: "Priya Patel",
    what: "processed transcript: Acme Sales & IT Joint Session",
    when: "Yesterday",
    avatar: "a-priya",
    initials: "PP",
    colorKey: "a-priya",
  },
  {
    who: "Sarah Chen",
    what: "answered Q-P3-001 · Salesforce CPQ",
    when: "Apr 16",
    avatar: "a-sarah",
    initials: "SC",
    colorKey: "a-sarah",
  },
  {
    who: "David Kim",
    what: "moved WI-LM-LA-01 to In Review",
    when: "Apr 16",
    avatar: "a-david",
    initials: "DK",
    colorKey: "a-david",
  },
  {
    who: "Marcus Thompson",
    what: "logged defect DEF-011 on WI-LM-LA-04",
    when: "Apr 15",
    avatar: "a-marcus",
    initials: "MT",
    colorKey: "a-marcus",
  },
];

/* ---------------- Page ---------------- */

export default function HomePage() {
  const { viewingAs } = useViewingAs();
  const { openDrawer } = useDrawer();

  return (
    <div className="overflow-auto p-[20px]">
      {/* 1. Re-proposal banner */}
      <div className="mb-[14px] flex items-center gap-[12px] rounded-card border border-amber-border bg-gradient-to-r from-amber-grad-1 to-amber-grad-2 px-[14px] py-[12px]">
        <div className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-card bg-yellow-dot text-white">
          <Icon name="sparkle" size={16} color="#ffffff" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-yellow-text">
            AI has proposed a roadmap change
          </div>
          <div className="mt-[2px] text-[12px] text-yellow-text-2">
            Phase 3 restructure triggered by Q-P3-001 answer · 13 work items
            affected · 1 in-flight build impacted · fired 08:14 today
          </div>
        </div>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-[6px] rounded-lg border border-transparent bg-transparent px-[11px] py-[5px] text-[12px] font-medium text-yellow-text-2 hover:bg-stripe"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => openDrawer("reproposal", {})}
          className="inline-flex cursor-pointer items-center gap-[6px] rounded-lg border border-yellow-dot bg-yellow-dot px-[11px] py-[5px] text-[12px] font-medium text-white hover:bg-yellow-dot-2 hover:border-yellow-dot-2"
        >
          Review diff
          <Icon name="arrowRight" size={12} color="#ffffff" />
        </button>
      </div>

      {/* 2. KPI grid */}
      <div className="mb-[14px] grid grid-cols-4 gap-[12px]">
        <KpiCard
          label="Open questions"
          value="4"
          delta={{ value: "+1", direction: "down" }}
          sub="2 client-owned · 1 blocks in-flight"
        />
        <KpiCard
          label="Blocked items"
          value="1"
          sub="WI-LM-LC-01 · blocked by Q-LM-LC-003"
        />
        <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
          <div className="mb-[6px] text-xs font-semibold uppercase tracking-[0.05em] text-muted">
            Roadmap progress
          </div>
          <div className="flex items-baseline gap-[6px] text-[22px] font-semibold tracking-[-0.02em] text-ink">
            38%
          </div>
          <div className="mt-[8px] h-[6px] overflow-hidden rounded-xs bg-stripe">
            <div
              className="h-full rounded-xs bg-indigo"
              style={{ width: "38%" }}
            />
          </div>
        </div>
        <KpiCard
          label="Requirements mapped"
          value={
            <>
              47
              <span className="text-[14px] text-muted-2"> /54</span>
            </>
          }
          sub="87% · 7 unmapped in P3"
        />
      </div>

      {/* 3. Current focus + Recommended focus */}
      <div className="mb-[14px] grid grid-cols-[2fr_1fr] gap-[12px]">
        <AiCard
          head={{ label: "Current focus", ts: DATA.currentFocusTs }}
          foot={
            <>
              <Icon name="sparkle" size={11} />
              <span>
                Synthesized from roadmap state, sprint burn, and 4 open questions
                · claude-haiku-4.5
              </span>
            </>
          }
        >
          <p className="m-0">
            Build is on track for{" "}
            <span className="font-semibold text-ink">Sprint 3</span> — 60% burned
            with 4 days left. The{" "}
            <TLink onClick={() => openDrawer("reproposal", {})}>
              CPQ re-proposal
            </TLink>{" "}
            is the most consequential open item; Sarah hasn&apos;t yet reviewed
            the diff. Priya can unblock{" "}
            <TLink
              onClick={() => openDrawer("workItem", { id: "WI-LM-LC-01" })}
            >
              WI-LM-LC-01
            </TLink>{" "}
            this week by answering{" "}
            <TLink
              onClick={() => openDrawer("question", { id: "Q-LM-LC-003" })}
            >
              Q-LM-LC-003
            </TLink>
            .
          </p>
        </AiCard>

        <div className="rounded-card border border-border bg-surface p-[14px_16px]">
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            <span>Recommended focus</span>
            <span className="ml-auto rounded-pill bg-red-bg px-[7px] py-[2px] text-[10.5px] font-medium normal-case tracking-normal text-red-text">
              top 4
            </span>
          </h3>
          <div className="flex flex-col gap-[10px]">
            {DATA.recommendedFocus.map((r) => (
              <button
                type="button"
                key={r.rank}
                onClick={() =>
                  r.qid.startsWith("Q-P3")
                    ? openDrawer("reproposal", {})
                    : openDrawer("question", { id: r.qid })
                }
                className="flex w-full cursor-pointer items-start gap-[10px] text-left"
              >
                <div
                  className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                    r.rank === 1
                      ? "bg-indigo text-white"
                      : "bg-indigo-bg-2 text-indigo"
                  }`}
                >
                  {r.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-[1.35] text-ink">
                    {r.text}
                  </div>
                  <div className="mt-[3px] text-[11px] text-muted">
                    {r.reason}
                  </div>
                </div>
                <Avatar person={r.owner} size="xs" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Role-adaptive widgets */}
      <RoleWidgets viewingAs={viewingAs} />

      {/* 5. Activity + Phase readiness */}
      <div className="mt-[14px] grid grid-cols-2 gap-[12px]">
        {/* Recent activity */}
        <div className="rounded-card border border-border bg-surface p-[14px_16px]">
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Recent activity · last 48h
          </h3>
          <div className="flex flex-col gap-[10px]">
            {ACTIVITY.map((r, i) => (
              <div key={i} className="flex items-start gap-[10px]">
                <Avatar
                  name={r.who}
                  initials={r.initials}
                  colorKey={r.colorKey}
                  size="xs"
                />
                <div className="text-[12px] leading-[1.5] text-ink-2">
                  <span className="font-semibold text-ink">{r.who}</span>{" "}
                  <span className="text-muted">{r.what}</span>
                  <span className="ml-[4px] text-[11px] text-muted-2">
                    · {r.when}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase readiness */}
        <Link
          href="/work/roadmap"
          className="block rounded-card border border-border bg-surface p-[14px_16px] no-underline"
        >
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            <span>Phase readiness</span>
            <span className="ml-auto rounded-pill bg-stripe px-[7px] py-[2px] text-[10.5px] font-medium normal-case tracking-normal text-ink-3">
              Open roadmap →
            </span>
          </h3>
          <div className="flex flex-col gap-[10px]">
            {DATA.phases.map((p) => (
              <div key={p.id} className="flex items-center gap-[12px]">
                <div className="grid h-[22px] w-[28px] place-items-center rounded-sm bg-stripe text-[10.5px] font-semibold text-ink-3">
                  {p.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[6px] text-[12.5px] font-medium text-ink">
                    <span>{p.name}</span>
                    {p.reprop && (
                      <Chip tone="amber">re-proposal pending</Chip>
                    )}
                  </div>
                  <div className="text-[11px] text-muted">
                    {p.descriptor} · {p.duration}
                  </div>
                </div>
                <Readiness score={p.readiness} />
              </div>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
