// ProjectHeader — port of project/components.jsx ProjectHeader.
// Title + meta row, lifecycle strip, horizontal tabs.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Chip, Health } from "@/components/primitives";
import { DATA } from "@/lib/data";

import { LifecycleStages } from "./LifecycleStages";
import { ViewingAs } from "./ViewingAs";

interface TabRoute {
  id: string;
  href: string;
}

// Map tab ids → their canonical route. Tabs that have a sub-page redirect
// land on the redirect target's prefix so active state still matches.
const TAB_ROUTES: Record<string, string> = {
  home: "/home",
  discovery: "/discovery",
  questions: "/questions",
  work: "/work",
  knowledge: "/knowledge",
  org: "/org",
  chat: "/chat",
  documents: "/documents",
  dashboards: "/dashboards",
  settings: "/settings",
};

function tabRoutes(): TabRoute[] {
  return DATA.tabs.map((t) => ({ id: t.id, href: TAB_ROUTES[t.id] ?? `/${t.id}` }));
}

function isTabActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProjectHeader() {
  const pathname = usePathname() ?? "/";
  const routes = tabRoutes();

  return (
    <div className="shrink-0 border-b border-border bg-surface px-[20px] pt-[14px]">
      {/* Title row */}
      <div className="mb-[12px] flex items-center gap-[14px]">
        <div>
          <div className="text-[18px] font-semibold tracking-[-0.015em] text-ink">
            Acme Manufacturing
          </div>
          <div className="ml-[2px] text-[12.5px] text-muted">
            Sales Cloud · Greenfield · started Mar 18, 2026
          </div>
        </div>
        <div className="ml-auto flex items-center gap-[8px]">
          <Chip tone="outline">v3 roadmap</Chip>
          <Health tone="yellow">Yellow · timeline at risk</Health>
          <ViewingAs />
        </div>
      </div>

      {/* Lifecycle strip */}
      <LifecycleStages />

      {/* Horizontal tabs */}
      <div className="-mx-[20px] flex border-b border-border px-[20px]">
        {DATA.tabs.map((t) => {
          const route = routes.find((r) => r.id === t.id);
          if (!route) return null;
          const active = isTabActive(route.href, pathname);
          return (
            <Link
              key={t.id}
              href={route.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-[1px] flex cursor-pointer items-center gap-[6px] border-b-2 px-[14px] pb-[11px] pt-[9px] text-[12.5px] font-medium ${
                active
                  ? "border-indigo text-indigo"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`rounded-pill px-[6px] py-0 text-[10.5px] ${
                    active
                      ? "bg-indigo-bg text-indigo"
                      : "bg-stripe text-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
