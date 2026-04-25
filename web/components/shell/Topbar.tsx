// Topbar — port of project/components.jsx Topbar.
// 44px sticky bar with breadcrumb, mock search, and right-side icons.

"use client";

import { usePathname } from "next/navigation";

import { Icon } from "@/components/primitives";
import { DATA } from "@/lib/data";

function currentTabLabel(pathname: string): string {
  // pathname like "/work/home" → first segment "work"
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return "Home";
  const first = segs[0];
  const tab = DATA.tabs.find((t) => t.id === first);
  return tab?.label ?? "Home";
}

export function Topbar() {
  const pathname = usePathname() ?? "/";
  const isFirmAdmin = pathname === "/firm-admin" || pathname.startsWith("/firm-admin/");
  const tabLabel = currentTabLabel(pathname);
  const crumbScope = isFirmAdmin ? "Rihm Consulting" : "Acme Manufacturing";
  const crumbLeaf = isFirmAdmin ? "Firm Admin" : tabLabel;

  return (
    <div className="flex h-topbar shrink-0 items-center gap-[14px] border-b border-border bg-surface px-[16px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-[7px] text-[12.5px] text-ink-3">
        <span>{crumbScope}</span>
        <span className="text-border-hover">/</span>
        <span className="font-medium text-ink">{crumbLeaf}</span>
      </div>

      {/* Mock search */}
      <div className="mx-auto flex max-w-[420px] flex-1 items-center gap-[8px] rounded-lg border border-border bg-stripe px-[10px] py-[5px] text-[12px] text-muted">
        <Icon name="search" />
        <span className="truncate">Search questions, work items, decisions, components…</span>
        <span className="ml-auto rounded-xs border border-border bg-surface px-[5px] py-[1px] font-mono text-[10px] text-muted-2">
          /
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          aria-label="Help"
          title="Help"
          className="grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-lg text-muted hover:bg-stripe hover:text-ink"
        >
          <Icon name="messageSquare" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-lg text-muted hover:bg-stripe hover:text-ink"
        >
          <Icon name="bell" />
          <span
            className="absolute right-[6px] top-[5px] h-[6px] w-[6px] rounded-full bg-red-dot"
            style={{ border: "1.5px solid #ffffff" }}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
