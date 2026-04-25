// Questions tab — toolbar with state filter, scope/owner/blocks dropdowns,
// table of questions. Click question → open question drawer.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/tabs.jsx
// `Questions` component (lines 116-169).

"use client";

import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  StatusChip,
  Table,
  TD,
  TH,
  TR,
  type ChipTone,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { useDrawer } from "@/lib/context";
import type { Question, QuestionState } from "@/lib/types";

type FilterValue = QuestionState | "all";

const FILTERS: { id: FilterValue; label: string }[] = [
  { id: "open", label: "Open · 4" },
  { id: "answered", label: "Answered · 2" },
  { id: "parked", label: "Parked · 1" },
  { id: "all", label: "All" },
];

function scopeTone(scope: string): ChipTone {
  if (scope.startsWith("Engagement")) return "violet";
  if (scope.startsWith("Phase")) return "indigo";
  if (scope.startsWith("Epic")) return "sky";
  return "teal";
}

function ownerCell(q: Question) {
  if (q.ownerType === "client") {
    return (
      <span className="inline-flex items-center gap-[4px]">
        <Avatar size="xs" />
        <span>{q.owner}</span>
      </span>
    );
  }
  return <span>{q.owner}</span>;
}

export default function QuestionsPage() {
  const { openDrawer } = useDrawer();
  const [filter, setFilter] = useState<FilterValue>("open");

  const list = DATA.questions.filter((q) =>
    filter === "all" ? true : q.state === filter,
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-[12px] flex items-center gap-[8px] rounded-card border border-border bg-surface px-[8px] py-[6px]">
        {/* Segmented state filter */}
        <div className="inline-flex rounded-lg bg-stripe p-[2px]">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`cursor-pointer rounded-sm px-[10px] py-[4px] text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface text-ink shadow-segbtn"
                    : "text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <FilterPill k="Scope" v="Any" />
        <FilterPill k="Owner" v="Anyone" />
        <FilterPill k="Blocks" v="Any" />

        <div className="flex-1" />

        <Button
          variant="primary"
          iconLeft={<Icon name="plus" size={12} color="#ffffff" />}
        >
          New question
        </Button>
      </div>

      {/* Table */}
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH style={{ width: 110 }}>ID</TH>
              <TH>Question</TH>
              <TH style={{ width: 140 }}>Scope</TH>
              <TH style={{ width: 150 }}>Owner</TH>
              <TH style={{ width: 100 }}>State</TH>
              <TH style={{ width: 90 }}>Asked</TH>
              <TH style={{ width: 90 }}>Blocks</TH>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <TR key={q.id} onClick={() => openDrawer("question", { id: q.id })}>
                <TD>
                  <Table.Mono>{q.id}</Table.Mono>
                </TD>
                <TD className="font-medium text-ink">{q.text}</TD>
                <TD>
                  <Chip tone={scopeTone(q.scope)}>{q.scope}</Chip>
                </TD>
                <TD>{ownerCell(q)}</TD>
                <TD>
                  <StatusChip status={q.state} />
                </TD>
                <TD className="font-mono text-sm text-muted">
                  {q.askedDate.slice(5)}
                </TD>
                <TD>
                  {q.blocks > 0 ? (
                    <span className="font-medium text-red-text">{q.blocks}</span>
                  ) : (
                    <span className="text-muted-2">—</span>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

function FilterPill({ k, v }: { k: string; v: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-[5px] rounded-lg border border-border bg-surface px-[9px] py-[4px] text-sm text-ink-3 hover:border-border-hover"
    >
      <span className="text-muted-2">{k}</span>
      <span className="font-medium text-ink">{v}</span>
      <Icon name="chevronDown" size={11} />
    </button>
  );
}
