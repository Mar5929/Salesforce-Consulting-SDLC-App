// Discovery tab — transcript review, AI intelligence, gap detection,
// follow-up recommendations, conflict callout.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/tabs.jsx
// `Discovery` component (lines 4-114).

"use client";

import {
  AiCard,
  Button,
  Card,
  Chip,
  Icon,
  KpiCard,
  type ChipTone,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer } from "@/lib/context";
import type { Confidence, TranscriptItemKind } from "@/lib/types";

const KIND_TONE: Partial<Record<TranscriptItemKind, ChipTone>> = {
  question: "amber",
  requirement: "sky",
  scope: "violet",
  decision: "indigo",
  risk: "red",
  annotation: "slate",
  action: "slate",
};

const CONF_LABEL: Record<Confidence, string> = {
  hi: "92%",
  md: "74%",
  lo: "58%",
};

const CONF_CLASS: Record<Confidence, string> = {
  hi: "bg-green-bg text-green-text",
  md: "bg-yellow-bg text-yellow-text-2",
  lo: "bg-red-bg text-red-text",
};

function ConfBadge({ conf }: { conf: Confidence }) {
  return (
    <span
      className={`inline-flex items-center gap-[4px] rounded-pill px-[6px] py-[1px] text-[10.5px] font-semibold ${CONF_CLASS[conf]}`}
    >
      {CONF_LABEL[conf]}
    </span>
  );
}

export default function DiscoveryPage() {
  const { openDrawer } = useDrawer();
  const T = DATA.transcriptReview;

  const reviewItems = T.items.filter((i) => i.action === "review");
  const appliedItems = T.items.filter((i) => i.action === "applied");

  return (
    <>
      {/* KPIs */}
      <div className="mb-[14px] grid grid-cols-4 gap-[12px]">
        <KpiCard label="Open questions" value="4" sub="2 client-owned" />
        <KpiCard label="Requirements captured" value="54" sub="+6 this week" />
        <KpiCard label="Transcripts processed" value="12" sub="Last: 2 min ago" />
        <KpiCard
          label="Pending review"
          value={<span className="text-yellow-dot-2">6</span>}
          sub="from Apr 10 session"
        />
      </div>

      {/* Two columns: 2fr + 1fr */}
      <div className="grid grid-cols-[2fr_1fr] gap-[12px]">
        {/* Main: Transcript review */}
        <div>
          <div className="mb-[10px] flex items-center gap-[10px]">
            <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Transcript processing · review
            </h2>
            <div className="ml-auto flex gap-[6px]">
              <Button iconLeft={<Icon name="upload" size={12} />}>
                Upload transcript
              </Button>
              <Button
                variant="primary"
                iconLeft={<Icon name="plus" size={12} color="#ffffff" />}
              >
                Start chat session
              </Button>
            </div>
          </div>

          <Card className="mb-[14px]">
            {/* Header: meeting info */}
            <div className="mb-[10px] flex items-center gap-[10px]">
              <div className="grid h-[36px] w-[36px] place-items-center rounded-card bg-indigo-bg">
                <Icon name="file" size={16} color="#4F46E5" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ink">
                  {T.meeting}
                </div>
                <div className="text-sm text-muted">
                  {T.date} · {T.duration} · {T.attendees.join(", ")}
                </div>
              </div>
              <Chip tone="green">processed {T.processed}</Chip>
            </div>

            {/* Summary strip */}
            <div className="mb-[12px] flex items-center gap-[10px] rounded-lg bg-canvas px-[10px] py-[8px] text-[12px]">
              <span>
                <b className="text-green-dot">{T.applied}</b> applied auto
              </span>
              <span className="text-border-hover">·</span>
              <span>
                <b className="text-yellow-dot-2">{T.review}</b> awaiting review
              </span>
              <span className="ml-auto text-muted-2">
                High conf ≥ 0.85 → auto-apply · below → review
              </span>
            </div>

            {/* Needs review */}
            <div className="mb-[8px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Needs review · {T.review} items
            </div>
            <div className="flex flex-col gap-[6px]">
              {reviewItems.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] gap-[12px] rounded-lg border border-border bg-surface px-[12px] py-[10px]"
                >
                  <div>
                    <div className="text-[12.5px] leading-[1.4] text-ink">
                      <Chip tone={KIND_TONE[it.kind] ?? "slate"}>{it.kind}</Chip>{" "}
                      {it.text}
                    </div>
                    <div className="mt-[3px] flex items-center gap-[8px] text-[11px] text-muted">
                      <ConfBadge conf={it.conf} />
                      <span>→ {it.applyTo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[4px]">
                    <Button size="sm" iconLeft={<Icon name="edit" size={11} />}>
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button size="sm" variant="danger">
                      Discard
                    </Button>
                    <Button size="sm" variant="primary">
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-applied */}
            <div className="mb-[8px] mt-[14px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Auto-applied · {T.applied - 11} more
            </div>
            <div className="flex flex-col gap-[4px]">
              {appliedItems.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center gap-[10px] rounded-lg bg-add-bg px-[10px] py-[7px] text-[12px]"
                >
                  <Icon name="check" size={12} color="#16A34A" />
                  <Chip tone={KIND_TONE[it.kind] ?? "slate"}>{it.kind}</Chip>
                  <span className="flex-1 text-ink-2">{it.text}</span>
                  <ConfBadge conf={it.conf} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar: AI intelligence */}
        <div className="flex flex-col gap-[12px]">
          <AiCard head={{ label: "AI INTELLIGENCE" }}>
            CPQ scope emerging from Apr 10 workshop. 2 requirements contradict
            prior v3 roadmap on quoting. Re-proposal fired — review in Work tab.
          </AiCard>

          <Card>
            <h3 className="m-0 mb-[10px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Gap detection per epic
            </h3>
            <div className="flex flex-col gap-[6px] text-[12px]">
              <div className="flex items-center gap-[8px]">
                <Chip tone="red">high gap</Chip>
                <span className="flex-1">R-CU Custom Analytics</span>
                <span className="text-sm text-muted">2Q</span>
              </div>
              <div className="flex items-center gap-[8px]">
                <Chip tone="amber">medium</Chip>
                <span className="flex-1">OPP-MG Opportunity</span>
                <span className="text-sm text-muted">1Q</span>
              </div>
              <div className="flex items-center gap-[8px]">
                <Chip tone="amber">medium</Chip>
                <span className="flex-1">LM-LC Lead Capture</span>
                <span className="text-sm text-muted">1Q</span>
              </div>
              <div className="flex items-center gap-[8px]">
                <Chip tone="green">ready</Chip>
                <span className="flex-1">LM-LA Lead Assignment</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="m-0 mb-[10px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Follow-up recommendations
            </h3>
            <div className="flex flex-col gap-[8px] text-[12px]">
              {DATA.recommendedFocus.slice(1, 4).map((r) => (
                <div
                  key={r.rank}
                  className="cursor-pointer"
                  onClick={() => openDrawer("question", { id: r.qid })}
                >
                  <div className="font-medium text-ink">{r.text}</div>
                  <div className="mt-[2px] text-sm text-muted">{r.reason}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="m-0 mb-[10px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Conflict detection
            </h3>
            <div className="rounded-card border border-amber-border bg-amber-bg px-[12px] py-[10px]">
              <div className="mb-[4px] flex items-center gap-[7px] text-[12px] font-semibold text-yellow-text">
                <Icon name="warn" size={13} color="#78350F" /> Quote engine
                contradiction
              </div>
              <div className="text-[12px] leading-[1.5] text-yellow-text-2">
                WI-QT-TG-02 references &quot;native template engine&quot; but
                Q-P3-001 (answered Apr 16) specifies CPQ.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
