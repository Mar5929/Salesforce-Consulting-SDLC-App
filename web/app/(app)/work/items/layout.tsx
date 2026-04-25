"use client";

// Work > Items shell — port of work.jsx WorkItems toolbar.
// Owns the lens switcher (Tree / Board / Timeline) + filter pills.
// Each lens has its own route under /work/items/{tree,board,timeline}.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button, Icon } from "@/components/primitives";

const LENSES = [
  { id: "tree", label: "Tree", href: "/work/items/tree" },
  { id: "board", label: "Board", href: "/work/items/board" },
  { id: "timeline", label: "Timeline", href: "/work/items/timeline" },
] as const;

const FILTERS = [
  { k: "Phase", v: "All" },
  { k: "Epic", v: "All" },
  { k: "Status", v: "All" },
  { k: "Sprint", v: "All" },
  { k: "Assignee", v: "Anyone" },
] as const;

export default function ItemsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <div className="mb-[12px] flex items-center gap-[8px] rounded-card border border-border bg-surface px-[8px] py-[6px]">
        <div className="inline-flex rounded-lg bg-stripe p-[2px]">
          {LENSES.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.id}
                href={l.href}
                className={`rounded-sm px-[10px] py-[4px] text-sm font-medium ${
                  active
                    ? "bg-surface text-ink shadow-segbtn"
                    : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.k}
            type="button"
            className="inline-flex cursor-pointer items-center gap-[5px] rounded-lg border border-border bg-surface px-[9px] py-[4px] text-sm text-ink-3 hover:border-border-hover"
          >
            <span className="text-muted-2">{f.k}</span>
            <span className="font-medium text-ink">{f.v}</span>
            <Icon name="chevronDown" size={11} />
          </button>
        ))}
        <div className="flex-1" />
        <Button iconLeft={<Icon name="plus" size={12} />}>New work item</Button>
      </div>
      {children}
    </>
  );
}
