// Settings tab layout — two-group side-rail subnav (Project / Firm).
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// (Settings component, lines 23-73 — left rail with grouped items).

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  slug: string;
  label: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Project",
    items: [
      { slug: "project", label: "Project info" },
      { slug: "team", label: "Team & access" },
      { slug: "salesforce", label: "Salesforce orgs" },
      { slug: "jira", label: "Jira sync" },
      { slug: "ai", label: "AI behavior" },
      { slug: "health", label: "Health thresholds" },
      { slug: "notifications", label: "Notifications" },
    ],
  },
  {
    group: "Firm",
    items: [
      { slug: "guardrails", label: "SF dev guardrails" },
      { slug: "branding", label: "Branding & templates" },
      { slug: "naming", label: "Naming conventions" },
      { slug: "security", label: "Security & data" },
      { slug: "billing", label: "Costs & licensing" },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="grid items-start gap-[18px] grid-cols-[200px_1fr]">
      <aside className="sticky top-0 rounded-card border border-border bg-surface p-[8px]">
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="mb-[6px]">
            <div className="px-[10px] pt-[8px] pb-[4px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
              {grp.group}
            </div>
            {grp.items.map((item) => {
              const href = `/settings/${item.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.slug}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-md px-[10px] py-[7px] text-[12.5px] border-l-[2px] ${
                    active
                      ? "border-indigo bg-indigo-bg font-semibold text-indigo-text-2"
                      : "border-transparent font-medium text-ink hover:bg-canvas"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mt-[4px] border-t border-dashed border-border px-[10px] py-[8px] text-[10.5px] leading-[1.5] text-muted">
          Firm settings are configured by the Firm Administrator (V1: Michael Rihm). Solution
          Architects on this project have view + edit access.
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}
