"use client";

// ReproposalDrawer — port of project/drawers.jsx ReproposalDrawer.
// Width md (900px). Header (amber sparkle), body (summary + before/after + diff + impact + apply mode), foot.

import { useState } from "react";
import { Drawer } from "@/components/primitives";
import { Avatar, Button, Chip, Icon, StatusChip } from "@/components/primitives";
import { DATA } from "@/lib/data";
import type { ReproposalChangeType } from "@/lib/types";

export interface ReproposalDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ApplyMode = "adopt" | "merge" | "selective";
type InflightDecision = "confirm" | "override" | "flag";

const CHANGE_TONE: Record<ReproposalChangeType, "red" | "green" | "indigo" | "amber"> = {
  removed: "red",
  added: "green",
  renamed: "indigo",
  reparented: "amber",
};

function SectionHeader({
  children,
  action,
  className = "",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[10px] mb-[10px] ${className}`}>
      <h2 className="m-0 text-md font-semibold text-ink-3 uppercase tracking-[0.04em]">
        {children}
      </h2>
      {action && <div className="ml-auto flex gap-[6px]">{action}</div>}
    </div>
  );
}

export function ReproposalDrawer({ open, onClose }: ReproposalDrawerProps) {
  const R = DATA.reproposal;
  const [mode, setMode] = useState<ApplyMode>("merge");
  const [selected, setSelected] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });
  const [inflight, setInflight] = useState<InflightDecision>("confirm");

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <Drawer open={open} onClose={onClose} width="md">
      {/* HEADER */}
      <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-border flex-shrink-0">
        <div className="w-[32px] h-[32px] rounded-lg bg-yellow-dot grid place-items-center flex-shrink-0">
          <Icon name="sparkle" size={16} color="#ffffff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14px] text-ink">
            AI Roadmap Re-proposal · P3 CPQ restructure
          </div>
          <div className="text-sm text-muted">
            Fired {R.firedAt} · {R.trigger} · claude-sonnet-4.5
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
          <Icon name="x" size={14} />
        </Button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-auto px-[18px] py-[16px]">
        <p className="m-0 mb-[14px] text-md leading-[1.55] text-ink">{R.summary}</p>

        {/* Before / After */}
        <SectionHeader>Phase 3 · before / after</SectionHeader>
        <div className="grid grid-cols-2 gap-[10px] mb-[16px] mt-[6px]">
          <div className="bg-red-soft-bg border border-red-soft-border rounded-lg px-[10px] py-[8px]">
            <div className="text-[10px] uppercase tracking-[0.06em] font-semibold mb-[5px] text-red-text">
              Current · v3
            </div>
            <div className="font-semibold text-md text-ink">Quoting</div>
            <div className="text-sm text-ink-3 mt-[4px] leading-[1.5]">
              <span className="font-mono text-[10.5px] text-red-text">Q-TG</span>{" "}
              Template-Gen Quoting <span className="text-red-text">· 4 items</span>
            </div>
          </div>
          <div className="bg-add-bg border border-add-border rounded-lg px-[10px] py-[8px]">
            <div className="text-[10px] uppercase tracking-[0.06em] font-semibold mb-[5px] text-green-text-3">
              Proposed · v4
            </div>
            <div className="font-semibold text-md text-ink">CPQ Implementation</div>
            <div className="text-sm text-ink-3 mt-[4px] leading-[1.5] flex flex-col gap-[2px]">
              <div>
                <span className="font-mono text-[10.5px] text-green-text-3">CPQ-IM</span>{" "}
                Product Catalog <span className="text-muted">· 5 items</span>
              </div>
              <div>
                <span className="font-mono text-[10.5px] text-green-text-3">CPQ-PR</span>{" "}
                Pricing Rules <span className="text-muted">· 4 items</span>
              </div>
              <div>
                <span className="font-mono text-[10.5px] text-green-text-3">CPQ-DC</span>{" "}
                Document Creation <span className="text-muted">· 3 items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Changes */}
        <SectionHeader
          action={
            <span className="text-muted text-sm font-normal normal-case tracking-normal">
              {selectedCount} of {R.changes.length} selected
            </span>
          }
        >
          Changes by type
        </SectionHeader>
        {R.changes.map((c, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-card mb-[10px] overflow-hidden"
          >
            <div className="px-[14px] py-[10px] border-b border-border bg-canvas flex items-center gap-[10px] font-semibold text-[12.5px]">
              {mode === "selective" && (
                <input
                  type="checkbox"
                  checked={!!selected[i]}
                  onChange={(e) => setSelected({ ...selected, [i]: e.target.checked })}
                />
              )}
              <Chip tone={CHANGE_TONE[c.type]}>{c.label}</Chip>
              <span className="font-medium">{c.title}</span>
            </div>
            <div className="px-[14px] py-[12px]">
              {c.detail && (
                <div className="text-[12.5px] text-ink-2 mb-[6px]">{c.detail}</div>
              )}
              <div className="mt-[8px] bg-canvas border-l-[3px] border-indigo px-[10px] py-[8px] rounded-[0_6px_6px_0] text-sm text-ink-3 italic leading-[1.5] flex items-start gap-[6px]">
                <span className="not-italic">
                  <Icon name="link" size={11} color="#475569" />
                </span>
                <span>
                  Evidence:{" "}
                  <span className="not-italic text-indigo font-medium">{c.evidence}</span>
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* In-flight impact */}
        <SectionHeader className="mt-[18px]">
          In-flight impact · requires your decision
        </SectionHeader>
        <div className="bg-amber-grad-1 border border-amber-border rounded-card px-[14px] py-[12px]">
          {R.impactInFlight.map((w) => (
            <div key={w.id}>
              <div className="flex items-center gap-[10px] mb-[8px]">
                <span className="font-mono text-[11px] font-semibold text-yellow-text">
                  {w.id}
                </span>
                <span className="font-medium text-md">{w.title}</span>
                <StatusChip status="progress" />
                <Avatar person={w.assignee} size="xs" />
                <span className="ml-auto text-sm font-semibold text-yellow-text">
                  {w.points} pts
                </span>
              </div>
              <div className="text-[12.5px] text-yellow-text mb-[10px] leading-[1.5]">
                <span className="font-semibold">AI recommendation:</span> {w.recommendation}
              </div>
              <div className="flex gap-[6px]">
                <Button
                  size="sm"
                  variant={inflight === "confirm" ? "primary" : "default"}
                  onClick={() => setInflight("confirm")}
                  iconLeft={
                    inflight === "confirm" ? (
                      <Icon name="check" size={11} color="#ffffff" />
                    ) : undefined
                  }
                >
                  Confirm (close & replace)
                </Button>
                <Button
                  size="sm"
                  variant={inflight === "override" ? "primary" : "default"}
                  onClick={() => setInflight("override")}
                  iconLeft={
                    inflight === "override" ? (
                      <Icon name="check" size={11} color="#ffffff" />
                    ) : undefined
                  }
                >
                  Override (keep in place)
                </Button>
                <Button
                  size="sm"
                  variant={inflight === "flag" ? "primary" : "default"}
                  onClick={() => setInflight("flag")}
                  iconLeft={
                    inflight === "flag" ? (
                      <Icon name="check" size={11} color="#ffffff" />
                    ) : undefined
                  }
                >
                  Flag for later
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Apply mode */}
        <SectionHeader className="mt-[18px]">Apply mode</SectionHeader>
        <div className="flex gap-[4px] bg-stripe border border-border rounded-card p-[3px]">
          {(
            [
              { id: "adopt", label: "Adopt wholesale", d: "Apply all changes as proposed" },
              { id: "merge", label: "Merge", d: "Keep manual edits, integrate new" },
              { id: "selective", label: "Selective apply", d: "Pick changes one by one" },
            ] as { id: ApplyMode; label: string; d: string }[]
          ).map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={`flex-1 px-[10px] py-[7px] text-[12px] rounded-md text-center cursor-pointer ${
                  active
                    ? "bg-surface text-ink shadow-card-hover font-semibold"
                    : "text-muted font-medium"
                }`}
              >
                <div>{t.label}</div>
                <div
                  className={`text-[10.5px] font-normal mt-[2px] ${
                    active ? "text-muted" : "text-muted-2"
                  }`}
                >
                  {t.d}
                </div>
              </button>
            );
          })}
        </div>

        {/* Evidence links */}
        <SectionHeader className="mt-[18px]">Evidence</SectionHeader>
        <div className="flex flex-col gap-[5px]">
          {R.evidenceLinks.map((e) => (
            <div
              key={`${e.type}-${e.id}`}
              className="flex items-center gap-[10px] px-[10px] py-[7px] bg-canvas rounded-lg text-[12px]"
            >
              <Icon name="link" size={12} color="#64748B" />
              <span className="text-muted">{e.type}</span>
              <span className="font-mono text-ink">{e.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex gap-[8px] items-center px-[16px] py-[10px] border-t border-border flex-shrink-0">
        <span className="text-sm text-muted">
          Approval writes a new version (v4). Prior versions remain viewable read-only.
        </span>
        <div className="flex-1" />
        <Button onClick={onClose}>Defer</Button>
        <Button variant="danger">Reject proposal</Button>
        <Button variant="primary">Approve · create v4</Button>
      </div>
    </Drawer>
  );
}

export default ReproposalDrawer;
