// Chat-tab mock data — verbatim port of project/chat.jsx CHAT + THREADS objects.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/chat.jsx
//
// Kept colocated with the chat page since it is feature-private (sessions list,
// thread message bodies, extracted-record proposals). The shared mock entities
// (team, projects, etc.) still live in lib/data.ts.

export type ChatVisibility = "shared" | "private";
export type ChatState = "active" | "archived";

export interface ChatExtractedCounts {
  q: number;
  a: number;
  d: number;
  r: number;
}

export interface ChatSession {
  id: string;
  title: string;
  owner: string;
  updated: string;
  createdAt: string;
  visibility: ChatVisibility;
  state: ChatState;
  pinned?: boolean;
  preview: string;
  group: string;
  msgs: number;
  extracted: ChatExtractedCounts;
  heavyOp?: string;
  hasReview?: boolean;
}

export interface ChatContextRef {
  kind: ExtractedKind;
  id: string;
  label: string;
}

export type ExtractedKind =
  | "question"
  | "answer"
  | "decision"
  | "requirement"
  | "risk";

export interface ChatExtractedItem {
  kind: ExtractedKind;
  id: string;
  text: string;
  confidence: number;
  state?: string;
  linksTo?: string;
}

export interface ChatUserMessage {
  role: "user";
  who: string;
  at: string;
  text: string;
}

export interface ChatAiMessage {
  role: "ai";
  at: string;
  text: string;
  think?: string;
  clarify?: boolean;
  applied?: boolean;
  context?: ChatContextRef[];
  extracted?: ChatExtractedItem[];
  impact?: string[];
}

export type ChatMessage = ChatUserMessage | ChatAiMessage;

export const CHAT_SESSIONS: ChatSession[] = [
  {
    id: "s-001",
    title: "Round-robin OOO handling (answer logged)",
    owner: "sarah",
    updated: "2m",
    createdAt: "Today · 14:02",
    visibility: "shared",
    state: "active",
    pinned: true,
    preview:
      "David asked how round-robin behaves when a rep is OOO — I got the answer from Acme Sales Ops.",
    group: "Today",
    msgs: 14,
    extracted: { q: 1, a: 1, d: 0, r: 0 },
  },
  {
    id: "s-002",
    title: "Draft stories for Lead Scoring epic",
    owner: "priya",
    updated: "38m",
    createdAt: "Today · 13:18",
    visibility: "private",
    state: "active",
    preview:
      "Generate 8 user stories from the Apr 10 workshop + requirements in LM-LC.",
    group: "Today",
    msgs: 9,
    extracted: { q: 2, a: 0, d: 0, r: 8 },
    heavyOp: "Story generation",
  },
  {
    id: "s-003",
    title: "Apr 10 Acme Sales & IT transcript",
    owner: "priya",
    updated: "2h",
    createdAt: "Today · 11:40",
    visibility: "shared",
    state: "active",
    preview:
      "Processed 47-minute transcript. 11 applied auto, 6 awaiting review.",
    group: "Today",
    msgs: 6,
    extracted: { q: 4, a: 3, d: 2, r: 8 },
    heavyOp: "Transcript processing",
    hasReview: true,
  },
  {
    id: "s-004",
    title: "CPQ vs native — brief for Michael",
    owner: "sarah",
    updated: "1d",
    createdAt: "Yesterday · 16:50",
    visibility: "private",
    state: "active",
    preview: "Draft a one-pager for the firm admin on the P3 re-proposal.",
    group: "Yesterday",
    msgs: 22,
    extracted: { q: 0, a: 0, d: 1, r: 0 },
    heavyOp: "Briefing",
  },
  {
    id: "s-005",
    title: "Q-ENG-005 multi-currency follow-ups",
    owner: "sarah",
    updated: "1d",
    createdAt: "Yesterday · 10:14",
    visibility: "shared",
    state: "active",
    preview: "What questions should we ask Acme CFO before Thursday?",
    group: "Yesterday",
    msgs: 11,
    extracted: { q: 3, a: 0, d: 0, r: 0 },
  },
  {
    id: "s-006",
    title: "Renewals vs new business model",
    owner: "jamie",
    updated: "3d",
    createdAt: "Apr 14",
    visibility: "shared",
    state: "active",
    preview: "Client called — Jamie captured answer + follow-ups for OPP-MG.",
    group: "This week",
    msgs: 18,
    extracted: { q: 1, a: 1, d: 0, r: 2 },
  },
  {
    id: "s-007",
    title: "Migration scope — Priya notes",
    owner: "priya",
    updated: "5d",
    createdAt: "Apr 12",
    visibility: "private",
    state: "active",
    preview: "Client said 3 years but implied 5 for Accounts; clarifying.",
    group: "This week",
    msgs: 7,
    extracted: { q: 2, a: 0, d: 0, r: 0 },
  },
  {
    id: "s-a01",
    title: "Pre-kickoff stakeholder map",
    owner: "jamie",
    updated: "Mar 20",
    createdAt: "Mar 20",
    visibility: "shared",
    state: "archived",
    preview:
      "Jamie logged org chart and exec sponsors before Discovery kicked off.",
    group: "Archived · Mar",
    msgs: 24,
    extracted: { q: 0, a: 0, d: 0, r: 0 },
  },
  {
    id: "s-a02",
    title: "Initial client context — Sarah",
    owner: "sarah",
    updated: "Mar 18",
    createdAt: "Mar 18",
    visibility: "private",
    state: "archived",
    preview:
      "First-pass client context doc draft based on SOW and handoff call.",
    group: "Archived · Mar",
    msgs: 12,
    extracted: { q: 0, a: 0, d: 0, r: 0 },
  },
];

export const CHAT_THREADS: Record<string, ChatMessage[]> = {
  "s-001": [
    {
      role: "user",
      who: "sarah",
      at: "14:02",
      text: "Just got off a call with Priya and the Acme Sales Ops lead. Logging the answer to Q-LM-LA-001 — round-robin OOO behavior.",
    },
    {
      role: "ai",
      at: "14:02",
      think: "Find Q-LM-LA-001",
      text: "Found it. **Q-LM-LA-001** — *What happens if a round-robin target is out of office?* Open since Apr 3, scoped to Feature · LM-LA, owned by you. Tell me the answer as the client phrased it and I'll log it.",
      context: [
        {
          kind: "question",
          id: "Q-LM-LA-001",
          label: "Round-robin OOO handling · open · blocks 0",
        },
      ],
    },
    {
      role: "user",
      who: "sarah",
      at: "14:03",
      text: 'Their words: "If a rep has OOO set in Outlook or an OOO flag we sync, skip to the next rep in the rotation. If everyone in the territory is OOO, escalate to the team lead. No bouncing back."',
    },
    {
      role: "ai",
      at: "14:03",
      text: "Logging. Before I save, one clarification — the Outlook OOO sync isn't a feature we have yet. Is that a new requirement, or does Acme expect to surface OOO from an existing field (User.IsActive, a custom `Out_of_Office__c`, something else)?",
      clarify: true,
    },
    {
      role: "user",
      who: "sarah",
      at: "14:05",
      text: "New requirement. They want a custom boolean + date range, synced from Outlook/Exchange later. For MVP we'll just let managers flip the flag manually.",
    },
    {
      role: "ai",
      at: "14:05",
      text: "Got it. Proposed changes — review before I commit to the project knowledge base:",
      extracted: [
        {
          kind: "answer",
          id: "Q-LM-LA-001",
          text: "Skip to next rep; if all OOO, escalate to team lead. OOO sourced from a new field.",
          confidence: 0.94,
        },
        {
          kind: "requirement",
          id: "REQ-LM-LA-012",
          text: "Custom boolean `Out_of_Office__c` with start/end dates on User; manager-editable in MVP.",
          confidence: 0.88,
          linksTo: "Epic · LM-LA",
        },
        {
          kind: "question",
          id: "Q-LM-LA-004 (new)",
          text: "Future: how should we sync OOO from Outlook/Exchange? (parked — post-MVP)",
          confidence: 0.91,
          state: "parked",
        },
        {
          kind: "decision",
          id: "D-LM-LA-002",
          text: "No round-robin bounce-back. OOO always skips forward.",
          confidence: 0.96,
        },
      ],
      impact: [
        "Unblocks WI-LM-LA-02 (Round-Robin Rules) — status flips Ready → Sprint Planned.",
        "Adds a new field to the LM-LA data model; Sarah, you may want to review before I touch the ERD.",
      ],
    },
    {
      role: "user",
      who: "sarah",
      at: "14:07",
      text: "Apply all four. Route the new field to me as an annotation before anything lands in the ERD.",
    },
    {
      role: "ai",
      at: "14:07",
      text: "Applied. Q-LM-LA-001 is now Answered. The new field is pending your review on the LM-LA Data Model page. I've pinged David on WI-LM-LA-02.",
      applied: true,
    },
  ],
};

export const CHAT_GROUP_ORDER = [
  "Today",
  "Yesterday",
  "This week",
  "Archived · Mar",
] as const;

export const CHAT_ACTIVE_ID = "s-001";

// Color tokens used by the kind-specific dots and bars in the right rail.
// Order maps directly to the Q/A/D/R counters.
export const KIND_DOT_COLOR: Record<ExtractedKind, string> = {
  question: "#F59E0B",
  answer: "#16A34A",
  decision: "#4F46E5",
  requirement: "#0EA5E9",
  risk: "#EF4444",
};
