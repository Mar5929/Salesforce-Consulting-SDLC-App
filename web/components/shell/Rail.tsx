// Rail — port of project/components.jsx Rail.
// 240px wide dark sidebar with brand block, workspace nav, and user footer.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Avatar, Icon } from "@/components/primitives";
import type { IconName } from "@/components/primitives";

interface RailNavItem {
  id: string;
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  /** Path segment(s) that trigger active state. Defaults to pathname starting with `href`. */
  matchPrefix?: string;
}

const NAV_ITEMS: RailNavItem[] = [
  // The "Acme Manufacturing" item represents the active project workspace.
  // Anything routed under (app)/ except notifications / my-work / firm-admin
  // counts as "in the project" and lights this row up.
  {
    id: "project",
    href: "/home",
    label: "Acme Manufacturing",
    icon: "folder",
    matchPrefix: "__project",
  },
  { id: "my-work", href: "/my-work", label: "My Work", icon: "home" },
  {
    id: "notifications",
    href: "/notifications",
    label: "Notifications",
    icon: "bell",
    badge: 7,
  },
  {
    id: "my-reviews",
    href: "/my-reviews",
    label: "My Reviews",
    icon: "check",
    badge: 3,
  },
  { id: "firm-admin", href: "/firm-admin", label: "Firm Admin", icon: "shield" },
];

const PROJECT_PREFIXES = [
  "/home",
  "/discovery",
  "/questions",
  "/work",
  "/knowledge",
  "/org",
  "/chat",
  "/documents",
  "/dashboards",
  "/settings",
];

function isItemActive(item: RailNavItem, pathname: string): boolean {
  if (item.matchPrefix === "__project") {
    return PROJECT_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface RailProps {
  onTweaks?: () => void;
}

export function Rail({ onTweaks }: RailProps) {
  const pathname = usePathname() ?? "";
  return (
    <aside className="flex h-full flex-col bg-rail text-rail-text border-r border-rail-border">
      {/* Brand */}
      <div className="flex items-center gap-[10px] px-[16px] py-[14px] border-b border-rail-border">
        <div
          className="grid h-[26px] w-[26px] place-items-center rounded-[7px] text-white font-bold text-[13px]"
          style={{
            background:
              "linear-gradient(135deg, var(--color-logo-grad-start), var(--color-logo-grad-end))",
          }}
        >
          R
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-rail-text-active">
            Rihm
          </div>
          <div className="text-[10.5px] text-rail-muted">Delivery Workspace</div>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-[10px] pt-[12px] pb-[6px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-rail-muted">
        <span>Workspace</span>
        <button
          type="button"
          aria-label="Add workspace"
          className="cursor-pointer text-[14px] leading-none text-rail-muted-2 hover:text-rail-text-active"
        >
          +
        </button>
      </div>

      {/* Nav */}
      <nav className="py-[4px]">
        {NAV_ITEMS.map((item) => (
          <RailItem
            key={item.id}
            item={item}
            active={isItemActive(item, pathname)}
          />
        ))}
      </nav>

      {/* User block */}
      <div className="mt-auto flex items-center gap-[10px] border-t border-rail-border px-[12px] py-[10px]">
        <Avatar person="sarah" size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-rail-text-active">Sarah Chen</div>
          <div className="text-[10.5px] text-rail-muted">Solution Architect</div>
        </div>
        <button
          type="button"
          aria-label="Tweaks"
          title="Tweaks"
          onClick={onTweaks}
          className="grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-lg text-rail-muted hover:bg-rail-active hover:text-rail-text-active"
        >
          <Icon name="tune" />
        </button>
      </div>
    </aside>
  );
}

interface RailItemProps {
  item: RailNavItem;
  active: boolean;
}

function RailItem({ item, active }: RailItemProps) {
  const base =
    "mx-[6px] my-[1px] flex items-center gap-[8px] rounded-lg border px-[12px] py-[7px] text-[12.5px] cursor-pointer";
  const inactive =
    "border-transparent text-rail-text hover:bg-rail-active hover:text-rail-text-active";
  const activeCls =
    "bg-rail-active text-rail-text-active border-rail-active-border";
  const badgeBase =
    "ml-auto rounded-pill px-[6px] py-[1px] text-[10.5px]";
  const badgeCls = active
    ? "bg-rail-active-border text-rail-text"
    : "bg-rail-active text-rail-muted";

  const content: ReactNode = (
    <>
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {item.badge !== undefined && (
        <span className={`${badgeBase} ${badgeCls}`}>{item.badge}</span>
      )}
    </>
  );

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${active ? activeCls : inactive}`}
    >
      {content}
    </Link>
  );
}
