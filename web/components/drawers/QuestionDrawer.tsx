"use client";

// QuestionDrawer — port of project/drawers.jsx QuestionDrawer.
// Width sm (640px). Header + body (description list, answer/parked, blocks) + foot.

import { Drawer } from "@/components/primitives";
import { Avatar, Button, Chip, Icon, StatusChip } from "@/components/primitives";
import { DATA } from "@/lib/data";

export interface QuestionDrawerProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] mb-[10px] mt-[16px]">
      <h2 className="m-0 text-md font-semibold text-ink-3 uppercase tracking-[0.04em]">
        {children}
      </h2>
    </div>
  );
}

export function QuestionDrawer({ open, onClose, id }: QuestionDrawerProps) {
  const q = DATA.questions.find((x) => x.id === id);

  if (!q) {
    return (
      <Drawer open={open} onClose={onClose} width="sm">
        <header className="flex items-center justify-between px-[18px] py-[14px] border-b border-border">
          <h2 className="text-md font-semibold">Question not found</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
            <Icon name="x" size={14} />
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-[18px] text-sm text-muted">
          No question with id <span className="font-mono">{id}</span>.
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} width="sm">
      {/* HEADER */}
      <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[11px] text-ink-3 font-medium">{q.id}</span>
            <StatusChip status={q.state} />
            <span className="text-sm text-muted">· {q.scope}</span>
          </div>
          <div className="font-semibold text-[14px] mt-[4px] leading-[1.4] text-ink">
            {q.text}
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
          <Icon name="x" size={14} />
        </Button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-auto px-[18px] py-[16px]">
        <dl className="grid grid-cols-[130px_1fr] gap-y-[6px] gap-x-[14px] text-[12.5px]">
          <dt className="text-muted font-medium">Scope</dt>
          <dd className="m-0 text-ink">{q.scope}</dd>
          <dt className="text-muted font-medium">Owner</dt>
          <dd className="m-0 text-ink inline-flex items-center gap-[6px]">
            {q.ownerType === "client" ? (
              <>
                <Avatar size="xs" />
                {q.owner} <Chip tone="slate">client</Chip>
              </>
            ) : (
              q.owner
            )}
          </dd>
          <dt className="text-muted font-medium">Asked by</dt>
          <dd className="m-0 text-ink">{q.askedBy}</dd>
          <dt className="text-muted font-medium">Asked</dt>
          <dd className="m-0 text-ink font-mono text-sm">{q.askedDate}</dd>
          {q.answeredDate && (
            <>
              <dt className="text-muted font-medium">Answered</dt>
              <dd className="m-0 text-ink font-mono text-sm">{q.answeredDate}</dd>
            </>
          )}
          {q.blocks > 0 && (
            <>
              <dt className="text-muted font-medium">Blocks</dt>
              <dd className="m-0 text-red-text font-medium">
                {q.blocks} work {q.blocks === 1 ? "item" : "items"}
              </dd>
            </>
          )}
        </dl>

        {q.answer && (
          <>
            <SectionHeader>Answer</SectionHeader>
            <div className="text-md leading-[1.5] text-ink-2 bg-add-bg border-l-[3px] border-green-dot rounded-[6px] px-[10px] py-[8px]">
              {q.answer}
            </div>
            {q.triggered && (
              <div className="mt-[10px] px-[12px] py-[10px] bg-amber-grad-1 border border-amber-border rounded-lg text-[12.5px] text-yellow-text-2 flex items-center gap-[6px]">
                <Icon name="sparkle" size={12} color="#D97706" />
                <span>
                  <b>Impact:</b> {q.triggered}
                </span>
              </div>
            )}
          </>
        )}

        {q.parkedReason && (
          <>
            <SectionHeader>Parked</SectionHeader>
            <div className="text-md text-muted italic px-[12px] py-[10px] bg-canvas rounded-lg">
              {q.parkedReason}
            </div>
          </>
        )}

        {q.state === "open" && (
          <>
            <SectionHeader>Answer this question</SectionHeader>
            <textarea
              placeholder="Type answer here…"
              className="w-full min-h-[80px] p-[10px] border border-border rounded-lg font-sans text-md outline-none focus:border-indigo"
            />
            <div className="flex gap-[6px] mt-[8px]">
              <Button>Park</Button>
              <Button>Re-scope</Button>
              <div className="flex-1" />
              <Button variant="primary">Submit answer</Button>
            </div>
          </>
        )}

        {q.blocksList && q.blocksList.length > 0 && (
          <>
            <SectionHeader>Blocks</SectionHeader>
            <div className="flex flex-col gap-[5px]">
              {q.blocksList.map((wid) => {
                const wi = DATA.workItems.find((w) => w.id === wid);
                return (
                  <div
                    key={wid}
                    className="flex items-center gap-[10px] px-[10px] py-[7px] bg-canvas rounded-lg"
                  >
                    <span className="font-mono text-sm text-ink-3">{wid}</span>
                    <span className="flex-1 text-[12.5px]">{wi?.title ?? "—"}</span>
                    {wi && <StatusChip status={wi.status} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

export default QuestionDrawer;
