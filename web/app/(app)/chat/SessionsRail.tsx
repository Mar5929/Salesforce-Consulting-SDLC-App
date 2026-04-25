"use client";

// Left column of the Chat tab — list of sessions grouped by recency, with
// a search box, filter tabs, and a "New chat session" CTA. Mirrors
// project/chat.jsx ChatSessions almost line-for-line, but using primitives +
// Tailwind tokens because the prototype's chat-* classes never made it into
// styles.css.

import type { ChangeEvent } from "react";

import { Avatar, Icon } from "@/components/primitives";
import { DATA } from "@/lib/data";

import {
  CHAT_GROUP_ORDER,
  type ChatSession,
  type ChatVisibility,
} from "./data";

export type SessionsTab = "mine" | "shared" | "private" | "archived";

interface SessionsRailProps {
  sessions: ChatSession[];
  activeId: string;
  onPick: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  tab: SessionsTab;
  onTabChange: (t: SessionsTab) => void;
  onNew: () => void;
}

interface TabSpec {
  id: SessionsTab;
  label: string;
  count: number;
}

function visBadge(v: ChatVisibility) {
  return v === "shared" ? (
    <span className="inline-flex items-center gap-[3px] text-indigo-text">
      <Icon name="users" size={10} /> Shared
    </span>
  ) : (
    <span className="inline-flex items-center gap-[3px] text-ink-3">
      <Icon name="shield" size={10} /> Private
    </span>
  );
}

export function SessionsRail({
  sessions,
  activeId,
  onPick,
  query,
  onQueryChange,
  tab,
  onTabChange,
  onNew,
}: SessionsRailProps) {
  const filtered = sessions.filter((s) => {
    if (tab === "shared" && s.visibility !== "shared") return false;
    if (tab === "private" && s.visibility !== "private") return false;
    if (tab === "archived" && s.state !== "archived") return false;
    if (tab !== "archived" && s.state === "archived") return false;
    if (tab === "mine" && s.owner !== "sarah") return false;
    if (!query) return true;
    return (s.title + " " + s.preview)
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const groups: Record<string, ChatSession[]> = {};
  filtered.forEach((s) => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  const tabSpecs: TabSpec[] = [
    {
      id: "mine",
      label: "Mine",
      count: sessions.filter(
        (s) => s.owner === "sarah" && s.state !== "archived",
      ).length,
    },
    {
      id: "shared",
      label: "Shared",
      count: sessions.filter(
        (s) => s.visibility === "shared" && s.state !== "archived",
      ).length,
    },
    {
      id: "private",
      label: "Private",
      count: sessions.filter(
        (s) => s.visibility === "private" && s.state !== "archived",
      ).length,
    },
    {
      id: "archived",
      label: "Archived",
      count: sessions.filter((s) => s.state === "archived").length,
    },
  ];

  return (
    <aside className="flex flex-col w-[300px] shrink-0 bg-surface border-r border-border overflow-hidden">
      {/* Head */}
      <div className="p-[12px] flex flex-col gap-[10px] border-b border-border">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center justify-center gap-[6px] w-full bg-indigo border border-indigo text-white font-medium rounded-lg text-[12.5px] px-[10px] py-[7px] hover:bg-indigo-2 hover:border-indigo-2 cursor-pointer transition-colors"
        >
          <Icon name="plus" size={12} color="white" /> New chat session
        </button>
        <div className="flex items-center gap-[6px] bg-canvas border border-border rounded-md px-[8px] py-[5px]">
          <Icon name="search" size={13} color="#94A3B8" />
          <input
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(e.target.value)
            }
            placeholder="Search this project's sessions…"
            className="flex-1 min-w-0 bg-transparent outline-none border-0 text-[12px] text-ink placeholder:text-muted-2"
          />
          {query && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-xs bg-stripe border border-border text-[10px] text-ink-3 font-mono">
              ↵
            </span>
          )}
        </div>
        <div className="flex gap-[2px]">
          {tabSpecs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`flex-1 inline-flex items-center justify-center gap-[5px] rounded-md text-[11px] font-medium px-[8px] py-[5px] transition-colors cursor-pointer ${
                tab === t.id
                  ? "bg-indigo-bg text-indigo-text"
                  : "text-ink-3 hover:bg-stripe"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex items-center justify-center min-w-[16px] h-[14px] px-[4px] rounded-xs text-[9.5px] font-semibold ${
                  tab === t.id
                    ? "bg-surface text-indigo-text"
                    : "bg-stripe text-muted"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body (list) */}
      <div className="flex-1 overflow-auto p-[8px] flex flex-col gap-[12px]">
        {query && (
          <div className="rounded-md border border-violet-border bg-gradient-to-br from-violet-grad-start to-violet-grad-end px-[10px] py-[8px] flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px] text-[11px] font-semibold text-violet-text-2">
              <Icon name="sparkle" size={12} color="#4F46E5" />
              <span>Cross-session recall</span>
            </div>
            <div className="text-[11px] leading-[1.5] text-ink-3">
              Press{" "}
              <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-[4px] rounded-xs bg-surface border border-border text-[10px] text-ink-3 font-mono">
                ↵
              </span>{" "}
              to ask the AI to search across all sessions — including archived
              ones you authored — for &ldquo;<b>{query}</b>&rdquo;.
            </div>
          </div>
        )}

        {CHAT_GROUP_ORDER.filter((g) => groups[g]).map((g) => (
          <div key={g} className="flex flex-col gap-[2px]">
            <div className="px-[6px] py-[4px] text-[10.5px] uppercase tracking-[0.06em] font-semibold text-muted">
              {g}
            </div>
            {groups[g].map((s) => {
              const isActive = activeId === s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => onPick(s.id)}
                  className={`text-left flex items-start gap-[8px] rounded-md p-[8px] cursor-pointer transition-colors ${
                    isActive
                      ? "bg-indigo-bg border border-indigo-bg-2"
                      : "border border-transparent hover:bg-stripe"
                  }`}
                >
                  <div className="flex flex-col items-center gap-[3px] pt-[2px]">
                    <Avatar person={s.owner} size="xs" />
                    {s.pinned && (
                      <span
                        title="Pinned"
                        className="text-[10px] text-yellow-dot-2"
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <div className="flex items-start gap-[6px]">
                      <div className="text-[12px] font-medium text-ink leading-[1.35] truncate flex-1">
                        {s.title}
                      </div>
                      {s.heavyOp && (
                        <span className="shrink-0 inline-flex items-center bg-violet-bg text-violet-text rounded-xs px-[5px] py-[1px] text-[9.5px] font-medium">
                          {s.heavyOp}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-3 leading-[1.4] line-clamp-2">
                      {s.preview}
                    </div>
                    <div className="flex items-center flex-wrap gap-[5px] text-[10.5px] text-muted">
                      {visBadge(s.visibility)}
                      <span>·</span>
                      <span>{s.msgs} msgs</span>
                      <span>·</span>
                      <span>{s.updated}</span>
                      {s.hasReview && (
                        <span className="ml-[2px] inline-flex items-center bg-amber-bg text-yellow-text-2 rounded-xs px-[5px] py-[1px] text-[9.5px] font-medium">
                          Needs review
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {tab === "archived" && (
          <div className="mt-[6px] flex items-start gap-[6px] rounded-md bg-stripe px-[10px] py-[8px] text-[10.5px] text-ink-3 leading-[1.5]">
            <span className="mt-[1px] shrink-0">
              <Icon name="shield" size={11} color="#64748B" />
            </span>
            <span>
              After archive, only the firm administrator retains read access to
              raw transcripts. Extracted records stay in the knowledge base.
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

// Re-export DATA so callers don't need a second import to look up the owner —
// keeps the SessionsRail self-contained in usage.
export { DATA as SESSIONS_DATA };
