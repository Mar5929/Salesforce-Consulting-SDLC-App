"use client";

// ReadinessDrawer — port of project/drawers.jsx ReadinessDrawer.
// Width sm (640px). Score breakdown with bars per dimension.

import { Drawer } from "@/components/primitives";
import { Button, Chip, Icon } from "@/components/primitives";

export interface ReadinessDrawerProps {
  open: boolean;
  onClose: () => void;
  score: number;
  subject?: string;
}

interface Dimension {
  label: string;
  score: number;
  detail: string;
}

function scoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 45) return "amber";
  return "red";
}

function fillColor(tone: "green" | "amber" | "red"): string {
  if (tone === "green") return "bg-green-dot";
  if (tone === "amber") return "bg-yellow-dot";
  return "bg-red-dot";
}

function buildDimensions(score: number): Dimension[] {
  // Split a single composite into representative sub-signals so the breakdown
  // gives users a sense of where the score is coming from. Numbers are
  // illustrative — the prototype shows similar splits per phase.
  const open = Math.max(20, Math.min(100, score - 10));
  const gaps = Math.max(15, Math.min(100, score - 5));
  const ai = Math.max(25, Math.min(100, score + 5));
  return [
    {
      label: "Discovery question coverage",
      score: open,
      detail: "2 open questions blocking work items.",
    },
    {
      label: "Work item field completeness",
      score: gaps,
      detail: "4 work items are missing acceptance criteria, points, or tests.",
    },
    {
      label: "AI flag resolution",
      score: ai,
      detail: "2 contradictions raised by the assistant remain unresolved.",
    },
  ];
}

export function ReadinessDrawer({
  open,
  onClose,
  score,
  subject,
}: ReadinessDrawerProps) {
  const overall = scoreTone(score);
  const dims = buildDimensions(score);
  const subjectLabel = subject ?? "P3 · Quoting";

  return (
    <Drawer open={open} onClose={onClose} width="sm">
      {/* HEADER */}
      <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted uppercase tracking-[0.05em] font-semibold">
            Readiness breakdown
          </div>
          <div className="text-[15px] font-semibold mt-[3px] flex items-center gap-[8px]">
            <span>{subjectLabel}</span>
            <Chip tone={overall === "green" ? "green" : overall === "amber" ? "amber" : "red"}>
              {score}%
            </Chip>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
          <Icon name="x" size={14} />
        </Button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-auto px-[18px] py-[16px]">
        <p className="text-md text-muted mt-0 leading-[1.5]">
          Composite of three signals. Click any item to jump to its source.
        </p>

        <div className="flex flex-col gap-[10px] mt-[10px] mb-[18px]">
          {dims.map((d) => {
            const tone = scoreTone(d.score);
            return (
              <div
                key={d.label}
                className="bg-surface border border-border rounded-card px-[12px] py-[10px]"
              >
                <div className="flex items-center gap-[10px] mb-[6px]">
                  <span className="text-md font-medium text-ink flex-1">{d.label}</span>
                  <span className="text-sm text-ink-3 font-mono tabular-nums">
                    {d.score}%
                  </span>
                </div>
                <div className="h-[6px] bg-stripe rounded-[3px] overflow-hidden">
                  <div
                    className={`h-full rounded-[3px] ${fillColor(tone)}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <div className="text-[11.5px] text-muted mt-[6px]">{d.detail}</div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-[10px] mb-[10px]">
          <h2 className="m-0 text-md font-semibold text-ink-3 uppercase tracking-[0.04em]">
            Open discovery questions · 2
          </h2>
        </div>
        <div className="flex flex-col gap-[6px] mb-[16px]">
          <div className="bg-surface border border-border rounded-card px-[14px] py-[12px]">
            <div className="flex items-center gap-[8px] mb-[6px]">
              <span className="font-mono text-[11px] text-ink-3 font-medium">Q-P3-001</span>
              <Chip tone="green">answered · triggered reprop</Chip>
            </div>
            <div className="text-md text-ink leading-[1.45] font-medium">
              Native Opportunity Products or Salesforce CPQ?
            </div>
          </div>
          <div className="bg-surface border border-border rounded-card px-[14px] py-[12px]">
            <div className="flex items-center gap-[8px] mb-[6px]">
              <span className="font-mono text-[11px] text-ink-3 font-medium">Q-ENG-005</span>
              <Chip tone="amber">open</Chip>
              <span className="text-sm text-muted ml-auto">blocks 5 items</span>
            </div>
            <div className="text-md text-ink leading-[1.45] font-medium">
              Does Acme need multi-currency? US and Canada ops are separate entities.
            </div>
            <Button size="sm" variant="primary" className="mt-[8px]">
              Answer
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-[10px] mb-[10px]">
          <h2 className="m-0 text-md font-semibold text-ink-3 uppercase tracking-[0.04em]">
            Work item field gaps · 4
          </h2>
        </div>
        <div className="flex flex-col gap-[5px] mb-[16px]">
          {[
            { id: "WI-QT-TG-01", t: "Quote numbering scheme", miss: ["acceptance criteria", "story points"] },
            { id: "WI-QT-TG-02", t: "Build quote PDF template", miss: ["test cases"] },
            { id: "WI-QT-TG-03", t: "Email quote to customer", miss: ["acceptance criteria", "impacted components"] },
            { id: "WI-QT-TG-04", t: "Quote approval workflow", miss: ["persona"] },
          ].map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-[10px] px-[10px] py-[8px] bg-canvas rounded-lg text-[12px]"
            >
              <span className="font-mono text-sm text-ink-3 w-[100px]">{w.id}</span>
              <span className="flex-1">{w.t}</span>
              <span className="text-sm text-muted">missing: {w.miss.join(", ")}</span>
              <Button size="sm">Open</Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-[10px] mb-[10px]">
          <h2 className="m-0 text-md font-semibold text-ink-3 uppercase tracking-[0.04em]">
            AI flags · 2
          </h2>
        </div>
        <div className="flex flex-col gap-[6px]">
          <div className="px-[12px] py-[10px] bg-amber-bg border border-amber-border rounded-lg text-[12.5px]">
            <div className="font-semibold text-yellow-text mb-[4px]">
              Contradiction · quote template engine
            </div>
            <div className="text-yellow-text-2 leading-[1.5]">
              Acceptance on WI-QT-TG-02 references &ldquo;native template engine&rdquo; but new
              direction (Q-P3-001) specifies CPQ. Resolve as part of re-proposal.
            </div>
          </div>
          <div className="px-[12px] py-[10px] bg-amber-bg border border-amber-border rounded-lg text-[12.5px]">
            <div className="font-semibold text-yellow-text mb-[4px]">
              Conflict · component ownership
            </div>
            <div className="text-yellow-text-2 leading-[1.5]">
              Two epics (Q-TG and OPP-MG) both declare Modify on Opportunity standard fields.
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex gap-[6px] items-center px-[16px] py-[10px] border-t border-border flex-shrink-0">
        <div className="flex-1" />
        <Button onClick={onClose}>Close</Button>
      </div>
    </Drawer>
  );
}

export default ReadinessDrawer;
