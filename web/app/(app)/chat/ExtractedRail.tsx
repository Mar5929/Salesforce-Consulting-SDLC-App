"use client";

// Right column of the Chat tab — session summary, records-in-play list,
// unblocked items, and heavy-ops cost. Mirrors project/chat.jsx ChatRightRail.

import { Chip, StatusChip } from "@/components/primitives";

import { KIND_DOT_COLOR, type ChatSession, type ExtractedKind } from "./data";

interface ExtractedRailProps {
  session: ChatSession;
}

export function ExtractedRail({ session }: ExtractedRailProps) {
  const ex = session.extracted;
  const total = ex.q + ex.a + ex.d + ex.r;

  return (
    <aside className="w-[320px] shrink-0 border-l border-border bg-surface overflow-auto">
      {/* Session summary */}
      <Section title="Session summary">
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-baseline gap-[8px]">
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted font-semibold">
              Extracted this session
            </div>
            <div className="ml-auto text-[20px] font-semibold text-ink tracking-[-0.02em]">
              {total}
            </div>
          </div>
          <div className="flex h-[18px] rounded-sm overflow-hidden bg-stripe">
            {ex.q > 0 && (
              <Bar
                kind="question"
                count={ex.q}
                title={`${ex.q} questions`}
              />
            )}
            {ex.a > 0 && (
              <Bar kind="answer" count={ex.a} title={`${ex.a} answers`} />
            )}
            {ex.d > 0 && (
              <Bar
                kind="decision"
                count={ex.d}
                title={`${ex.d} decisions`}
              />
            )}
            {ex.r > 0 && (
              <Bar
                kind="requirement"
                count={ex.r}
                title={`${ex.r} requirements`}
              />
            )}
          </div>
          <div className="flex items-center flex-wrap gap-[10px] text-[11px] text-ink-3">
            <LegendItem kind="question" label="Q" count={ex.q} />
            <LegendItem kind="answer" label="A" count={ex.a} />
            <LegendItem kind="decision" label="D" count={ex.d} />
            <LegendItem kind="requirement" label="R" count={ex.r} />
          </div>
        </div>
      </Section>

      {/* Records in play */}
      <Section title="Records in play">
        <div className="flex flex-col gap-[8px]">
          <RecordRow
            kind="question"
            id="Q-LM-LA-001"
            text="Round-robin OOO handling"
            right={<StatusChip status="done" />}
          />
          <RecordRow
            kind="requirement"
            id="REQ-LM-LA-012"
            text="Custom Out_of_Office__c field on User"
            right={<Chip tone="amber">pending SA</Chip>}
          />
          <RecordRow
            kind="decision"
            id="D-LM-LA-002"
            text="No round-robin bounce-back"
            right={<Chip tone="green">applied</Chip>}
          />
          <RecordRow
            kind="question"
            id="Q-LM-LA-004"
            text="Outlook OOO sync — future"
            right={<Chip tone="slate">parked</Chip>}
          />
        </div>
      </Section>

      {/* Unblocked */}
      <Section title="Unblocked">
        <div className="flex items-center gap-[8px] rounded-md border border-border bg-canvas px-[10px] py-[8px]">
          <span className="font-mono text-[11px] text-indigo font-medium">
            WI-LM-LA-02
          </span>
          <span className="text-[12px] text-ink-2 truncate">
            Round-Robin Rules
          </span>
          <span className="ml-auto">
            <StatusChip status="sprint" />
          </span>
        </div>
      </Section>

      {/* Heavy ops cost */}
      <Section title="Heavy ops cost">
        <div className="flex flex-col gap-[6px]">
          <CostRow label="This session" value="$0.34" />
          <CostRow label="Project · Apr" value="$48.12" />
          <div className="text-[10.5px] text-muted leading-[1.5] mt-[4px]">
            Transcript processing and story generation run here. Firm admin
            sees totals in §22.
          </div>
        </div>
      </Section>
    </aside>
  );
}

// ---------- bits ----------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-[16px] py-[14px] border-b border-border last:border-b-0">
      <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted font-semibold mb-[10px]">
        {title}
      </div>
      {children}
    </div>
  );
}

function Bar({
  kind,
  count,
  title,
}: {
  kind: ExtractedKind;
  count: number;
  title: string;
}) {
  return (
    <div
      title={title}
      className="grid place-items-center text-[10px] font-semibold text-white"
      style={{ flex: count, background: KIND_DOT_COLOR[kind] }}
    >
      {count}
    </div>
  );
}

function LegendItem({
  kind,
  label,
  count,
}: {
  kind: ExtractedKind;
  label: string;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-[5px]">
      <i
        className="inline-block w-[6px] h-[6px] rounded-full"
        style={{ background: KIND_DOT_COLOR[kind] }}
      />
      {label} {count}
    </span>
  );
}

function RecordRow({
  kind,
  id,
  text,
  right,
}: {
  kind: ExtractedKind;
  id: string;
  text: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[8px] rounded-md border border-border bg-canvas px-[10px] py-[8px]">
      <div className="flex items-center gap-[5px] shrink-0">
        <i
          className="inline-block w-[6px] h-[6px] rounded-full"
          style={{ background: KIND_DOT_COLOR[kind] }}
        />
        <span className="font-mono text-[10.5px] text-ink-2 font-medium">
          {id}
        </span>
      </div>
      <span className="flex-1 min-w-0 text-[11.5px] text-ink-2 truncate">
        {text}
      </span>
      <span className="shrink-0">{right}</span>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11.5px]">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono text-[11px] text-ink font-medium">
        {value}
      </span>
    </div>
  );
}
