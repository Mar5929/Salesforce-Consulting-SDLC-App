"use client";

// Chat tab — three-column shell: SessionsRail (left), Thread (center),
// ExtractedRail (right). Mirrors project/chat.jsx Chat() root.
//
// Wave 2E owns this file. State is local-only — visual port, no real LLM.

import { useState } from "react";

import {
  CHAT_ACTIVE_ID,
  CHAT_SESSIONS,
  CHAT_THREADS,
  type ChatMessage,
  type ChatSession,
} from "./data";
import { ExtractedRail } from "./ExtractedRail";
import { SessionsRail, type SessionsTab } from "./SessionsRail";
import { Thread } from "./Thread";

const FALLBACK_MESSAGES: ChatMessage[] = CHAT_THREADS["s-001"] ?? [];

export default function ChatPage() {
  const [activeId, setActiveId] = useState<string>(CHAT_ACTIVE_ID);
  const [tab, setTab] = useState<SessionsTab>("mine");
  const [query, setQuery] = useState<string>("");

  const session: ChatSession =
    CHAT_SESSIONS.find((s) => s.id === activeId) ?? CHAT_SESSIONS[0];
  const thread = CHAT_THREADS[session.id] ?? FALLBACK_MESSAGES;

  return (
    <div
      className="flex h-full min-h-0 -m-[20px]"
      data-screen-label="Chat"
    >
      <SessionsRail
        sessions={CHAT_SESSIONS}
        activeId={activeId}
        onPick={setActiveId}
        query={query}
        onQueryChange={setQuery}
        tab={tab}
        onTabChange={setTab}
        onNew={() => setActiveId("new")}
      />
      <Thread session={session} messages={thread} />
      <ExtractedRail session={session} />
    </div>
  );
}
