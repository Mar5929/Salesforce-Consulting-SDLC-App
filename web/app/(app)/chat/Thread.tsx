"use client";

// Center column of the Chat tab — header, scrollable message list (user + AI
// bubbles, with optional inline "extracted records" cards), and the composer.
// Mirrors project/chat.jsx ChatThread, ChatMessage, ExtractedCard, and
// ChatComposer.

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { Avatar, Button, Chip, Icon } from "@/components/primitives";
import type { ChipTone } from "@/components/primitives";
import { DATA } from "@/lib/data";

import {
  KIND_DOT_COLOR,
  type ChatAiMessage,
  type ChatExtractedItem,
  type ChatMessage,
  type ChatSession,
  type ExtractedKind,
} from "./data";

interface ThreadProps {
  session: ChatSession;
  messages: ChatMessage[];
}

const KIND_META: Record<
  ExtractedKind,
  { chip: ChipTone; label: string; icon: "messageSquare" | "check" | "flag" | "file" | "warn" }
> = {
  question: { chip: "amber", label: "Question", icon: "messageSquare" },
  answer: { chip: "green", label: "Answer", icon: "check" },
  decision: { chip: "indigo", label: "Decision", icon: "flag" },
  requirement: { chip: "sky", label: "Requirement", icon: "file" },
  risk: { chip: "red", label: "Risk", icon: "warn" },
};

export function Thread({ session, messages }: ThreadProps) {
  const owner = DATA.team.find((t) => t.id === session.owner);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Snap to bottom whenever the active session changes — same behavior as
  // the prototype's `endRef.current?.scrollTo({top: 1e6})`.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e6 });
  }, [session.id]);

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-canvas">
      {/* Header */}
      <div className="shrink-0 flex items-start gap-[12px] px-[20px] py-[12px] border-b border-border bg-surface">
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-ink leading-[1.3] tracking-[-0.01em] truncate">
            {session.title}
          </div>
          <div className="mt-[3px] text-[11.5px] text-muted">
            Started by{" "}
            <b className="text-ink-2 font-semibold">{owner?.name}</b> ·{" "}
            {session.createdAt} · running memory on · scoped to Acme
            Manufacturing
          </div>
        </div>
        <div className="flex items-center gap-[6px] shrink-0">
          <span
            className={`inline-flex items-center gap-[5px] rounded-md border px-[8px] py-[4px] text-[11px] font-medium cursor-pointer ${
              session.visibility === "shared"
                ? "border-indigo-bg-2 bg-indigo-bg text-indigo-text"
                : "border-border bg-canvas text-ink-3"
            }`}
          >
            <Icon
              name={session.visibility === "shared" ? "users" : "shield"}
              size={11}
            />
            {session.visibility === "shared"
              ? "Shared with project"
              : "Private to you"}
            <Icon name="chevronDown" size={10} />
          </span>
          <Button size="sm" iconLeft={<Icon name="sparkle" size={11} />}>
            Ask across sessions
          </Button>
          <Button size="sm" variant="ghost" title="More">
            <Icon name="more" size={12} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-[20px] py-[18px]">
        <div className="flex flex-col gap-[18px] max-w-[820px] mx-auto">
          {messages.map((m, i) => (
            <Message key={i} m={m} />
          ))}
          <div className="mt-[6px] flex items-center justify-center gap-[6px] text-[10.5px] text-muted-2">
            <Icon name="refresh" size={11} color="#94A3B8" />
            <span>
              AI has the full conversation above in memory. Records extracted
              in this session flow to the project knowledge base whether the
              session is shared or private.
            </span>
          </div>
        </div>
      </div>

      {/* Composer */}
      <Composer />
    </div>
  );
}

// ---------- Message bubble ----------

function Message({ m }: { m: ChatMessage }) {
  if (m.role === "user") {
    const who = DATA.team.find((t) => t.id === m.who);
    return (
      <div className="flex items-start gap-[10px]">
        <Avatar person={m.who} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-[6px] mb-[4px]">
            <b className="text-[12px] font-semibold text-ink-2">{who?.name}</b>
            <span className="text-[10.5px] text-muted-2">{m.at}</span>
          </div>
          <div className="rounded-xl bg-indigo-bg border border-indigo-bg-2 text-ink leading-[1.5] px-[12px] py-[9px] text-[12.5px] whitespace-pre-wrap">
            {m.text}
          </div>
        </div>
      </div>
    );
  }

  return <AiMessage m={m} />;
}

function AiMessage({ m }: { m: ChatAiMessage }) {
  return (
    <div className="flex items-start gap-[10px]">
      <div className="w-[26px] h-[26px] shrink-0 rounded-full grid place-items-center bg-gradient-to-br from-violet-500 to-indigo">
        <Icon name="sparkle" size={13} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-[6px] mb-[4px]">
          <b className="text-[12px] font-semibold text-indigo">Rihm AI</b>
          <span className="text-[10.5px] text-muted-2">{m.at}</span>
          {m.think && (
            <span className="text-[10.5px] text-muted">• {m.think}</span>
          )}
          {m.clarify && (
            <span className="inline-flex items-center bg-amber-bg text-yellow-text-2 rounded-xs px-[6px] py-[1px] text-[9.5px] font-semibold">
              Asking before saving
            </span>
          )}
          {m.applied && (
            <span className="inline-flex items-center bg-green-bg text-green-text rounded-xs px-[6px] py-[1px] text-[9.5px] font-semibold">
              Applied to knowledge base
            </span>
          )}
        </div>

        {m.context && (
          <div className="mb-[8px] rounded-lg border border-violet-border bg-gradient-to-br from-violet-grad-start to-violet-grad-end px-[10px] py-[8px]">
            <div className="text-[10px] uppercase tracking-[0.06em] font-semibold text-violet-text-2 mb-[5px]">
              Pulled from this project
            </div>
            {m.context.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-[6px] py-[3px] text-[11.5px]"
              >
                <KindDot kind={c.kind} />
                <span className="font-mono text-[11px] text-indigo font-medium">
                  {c.id}
                </span>
                <span className="text-[11px] text-ink-3 truncate">
                  {c.label}
                </span>
                <span className="ml-auto">
                  <Icon name="link" size={10} color="#94A3B8" />
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-xl bg-surface border border-border text-ink leading-[1.55] px-[12px] py-[9px] text-[12.5px]"
          dangerouslySetInnerHTML={{
            __html: renderInline(m.text),
          }}
        />

        {m.extracted && (
          <ExtractedCard items={m.extracted} impact={m.impact} />
        )}
      </div>
    </div>
  );
}

// ---------- Inline markdown (verbatim from prototype) ----------
// Only **bold** and *italic*. Source HTML is from a hard-coded string we own —
// no user input is ever rendered here.

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, '<i style="color:#475569">$1</i>');
}

// ---------- Extracted card ----------

interface ExtractedCardProps {
  items: ChatExtractedItem[];
  impact?: string[];
}

function ExtractedCard({ items, impact }: ExtractedCardProps) {
  const counts = items.reduce<Partial<Record<ExtractedKind, number>>>(
    (acc, it) => {
      acc[it.kind] = (acc[it.kind] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="mt-[10px] rounded-xl border border-violet-border bg-surface overflow-hidden">
      {/* Head */}
      <div className="flex items-center gap-[8px] px-[12px] py-[9px] bg-gradient-to-br from-violet-grad-start to-violet-grad-end border-b border-violet-border">
        <Icon name="sparkle" size={12} color="#4F46E5" />
        <span className="text-[11.5px] font-semibold text-violet-text-2">
          Proposed changes to project knowledge
        </span>
        <span className="ml-auto flex items-center flex-wrap gap-[4px]">
          {Object.entries(counts).map(([k, n]) => {
            const meta = KIND_META[k as ExtractedKind];
            const label = meta.label.toLowerCase();
            return (
              <Chip key={k} tone={meta.chip} className="text-[10.5px]">
                {n} {label}
                {(n ?? 0) > 1 ? "s" : ""}
              </Chip>
            );
          })}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col">
        {items.map((it, i) => {
          const meta = KIND_META[it.kind];
          const conf = Math.round((it.confidence ?? 0) * 100);
          return (
            <div
              key={i}
              className="grid gap-[6px] px-[12px] py-[10px] border-t border-stripe first:border-t-0"
              style={{
                gridTemplateColumns: "1fr auto",
              }}
            >
              <div className="flex items-center flex-wrap gap-[6px]">
                <Chip tone={meta.chip}>{meta.label}</Chip>
                <span className="font-mono text-[11px] text-indigo font-medium">
                  {it.id}
                </span>
                {it.state && <Chip tone="slate">{it.state}</Chip>}
                {it.linksTo && (
                  <span className="text-[10.5px] text-muted">
                    → {it.linksTo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-[6px] justify-end">
                <ConfidenceBadge value={conf} />
                <span className="flex gap-[2px]">
                  <button
                    type="button"
                    title="Edit"
                    className="inline-grid place-items-center w-[22px] h-[22px] rounded-sm text-ink-3 hover:bg-stripe cursor-pointer"
                  >
                    <Icon name="edit" size={10} />
                  </button>
                  <button
                    type="button"
                    title="Discard"
                    className="inline-grid place-items-center w-[22px] h-[22px] rounded-sm text-ink-3 hover:bg-stripe cursor-pointer"
                  >
                    <Icon name="x" size={10} />
                  </button>
                </span>
              </div>
              <div className="col-span-2 text-[12px] text-ink-2 leading-[1.5]">
                {it.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact */}
      {impact && (
        <div className="px-[12px] py-[10px] bg-stripe border-t border-border">
          <div className="text-[10.5px] uppercase tracking-[0.06em] font-semibold text-muted mb-[5px]">
            Downstream impact
          </div>
          {impact.map((t, i) => (
            <div
              key={i}
              className="flex items-start gap-[6px] py-[2px] text-[11.5px] text-ink-2 leading-[1.5]"
            >
              <span className="mt-[5px] shrink-0">
                <Icon name="arrowRight" size={10} color="#94A3B8" />
              </span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Foot */}
      <div className="flex items-center gap-[6px] px-[12px] py-[9px] border-t border-border bg-canvas">
        <span className="text-[10.5px] text-muted">
          Auto-apply threshold ·{" "}
          <b className="text-ink-2 font-semibold">85%</b>
        </span>
        <div className="ml-auto flex gap-[6px]">
          <Button size="sm">Discard all</Button>
          <Button size="sm">Review individually</Button>
          <Button size="sm" variant="primary">
            Apply all
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Confidence badge ----------
// Mirrors .conf.hi/.md/.lo in styles.css (lines 826-834).

interface ConfidenceBadgeProps {
  value: number; // 0–100
}

function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const tone =
    value >= 85
      ? "bg-green-bg text-green-text"
      : value >= 65
        ? "bg-yellow-bg text-yellow-text-2"
        : "bg-red-bg text-red-text";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[34px] px-[6px] py-[1px] rounded-xs text-[10.5px] font-semibold ${tone}`}
    >
      {value}%
    </span>
  );
}

// ---------- Kind dot (used in AI context refs) ----------

function KindDot({ kind }: { kind: ExtractedKind }) {
  return (
    <span
      className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
      style={{ background: KIND_DOT_COLOR[kind] }}
    />
  );
}

// ---------- Composer ----------

function Composer() {
  const [value, setValue] = useState("");
  const [attach, setAttach] = useState<string[]>([]);

  const canSend = useMemo(() => value.trim().length > 0, [value]);

  return (
    <div className="shrink-0 border-t border-border bg-surface px-[20px] py-[12px]">
      <div className="max-w-[820px] mx-auto flex flex-col gap-[8px]">
        <div className="rounded-xl border border-border bg-canvas p-[10px] focus-within:border-indigo">
          <textarea
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setValue(e.target.value)
            }
            rows={2}
            placeholder="Ask, log a finding, or paste a transcript…  /commands · @mention questions, work items, people"
            className="w-full resize-none bg-transparent border-0 outline-none text-[12.5px] leading-[1.55] text-ink placeholder:text-muted-2"
          />

          {attach.length > 0 && (
            <div className="flex items-center flex-wrap gap-[5px] pt-[6px]">
              {attach.map((a, i) => (
                <Chip key={i} tone="slate">
                  {a}{" "}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setAttach(attach.filter((_, j) => j !== i))
                    }
                    className="cursor-pointer text-muted hover:text-ink-2"
                  >
                    ×
                  </span>
                </Chip>
              ))}
            </div>
          )}

          <div className="mt-[6px] flex items-center gap-[6px] flex-wrap">
            <div className="flex items-center gap-[4px] flex-wrap">
              <ToolButton
                title="Upload transcript"
                onClick={() =>
                  setAttach((a) => [...a, "Apr 17 call — transcript.txt"])
                }
                icon={<Icon name="upload" size={12} />}
              >
                Transcript
              </ToolButton>
              <ToolButton title="Attach @mention" icon={<Icon name="link" size={12} />}>
                Link a record
              </ToolButton>
              <ToolButton title="Run a heavy op" icon={<Icon name="zap" size={12} />}>
                Run…
              </ToolButton>
              <span className="mx-[4px] w-px h-[14px] bg-border" />
              <span className="text-[10.5px] text-muted">
                Running memory{" "}
                <b className="text-green-dot font-semibold">on</b>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-[8px]">
              <span className="text-[10.5px] text-muted">
                Claude Sonnet 4.5
              </span>
              <Button
                size="sm"
                variant="primary"
                disabled={!canSend}
                iconLeft={<Icon name="arrowRight" size={11} color="white" />}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-[6px] text-[10.5px] text-muted">
          <span>Try:</span>
          <SlashHint>/process-transcript</SlashHint>
          <SlashHint>/draft-stories &lt;epic&gt;</SlashHint>
          <SlashHint>/brief &lt;topic&gt;</SlashHint>
          <SlashHint>/ask-client &lt;question&gt;</SlashHint>
          <SlashHint>/find prior answer to…</SlashHint>
        </div>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}

function ToolButton({ title, icon, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center gap-[5px] rounded-sm px-[6px] py-[3px] text-[11px] text-ink-3 hover:bg-stripe cursor-pointer"
    >
      {icon}
      {children}
    </button>
  );
}

function SlashHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xs bg-stripe px-[6px] py-[1px] font-mono text-[10px] text-ink-2">
      {children}
    </span>
  );
}
