// ViewingAs — port of project/components.jsx ProjectHeader role switcher.
// Pill button + dropdown menu listing the 5 roles.

"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, Icon } from "@/components/primitives";
import { useViewingAs } from "@/lib/context";

interface RoleOption {
  id: string;
  label: string;
  sub: string;
}

const ROLES: RoleOption[] = [
  { id: "sarah", label: "Solution Architect", sub: "Sarah Chen" },
  { id: "jamie", label: "Project Manager", sub: "Jamie Rodriguez" },
  { id: "david", label: "Developer", sub: "David Kim" },
  { id: "priya", label: "Business Analyst", sub: "Priya Patel" },
  { id: "marcus", label: "QA Engineer", sub: "Marcus Thompson" },
];

function labelFor(id: string): string {
  return ROLES.find((r) => r.id === id)?.label ?? "Solution Architect";
}

export function ViewingAs() {
  const { viewingAs, setViewingAs } = useViewingAs();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", escHandler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-[6px] rounded-pill border border-border bg-stripe py-[3px] pl-[6px] pr-[10px] text-[11.5px] text-ink-3 hover:bg-border"
      >
        <Avatar person={viewingAs} size="xs" />
        <span className="text-muted-2">Viewing as</span>
        <span className="font-medium text-ink">{labelFor(viewingAs)}</span>
        <Icon name="chevronDown" size={12} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[34px] z-[60] min-w-[200px] rounded-card border border-border bg-surface p-[4px] shadow-menu"
        >
          {ROLES.map((r) => {
            const selected = viewingAs === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setViewingAs(r.id);
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-[8px] rounded-sm px-[10px] py-[6px] text-[12px] text-ink hover:bg-stripe"
              >
                <Avatar person={r.id} size="xs" />
                <div className="text-left">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[10.5px] text-muted-2">{r.sub}</div>
                </div>
                {selected && (
                  <span className="ml-auto">
                    <Icon name="check" size={12} color="var(--color-indigo)" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
