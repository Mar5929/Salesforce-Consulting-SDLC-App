// Firm Admin tab layout — left side-rail with three groups (Firm / Policy / Operations).
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (FA_SECTIONS, lines 6-23). Pattern mirrors web/app/(app)/settings/layout.tsx.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useViewingAs } from "@/lib/context";

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
    group: "Firm",
    items: [
      { slug: "overview", label: "Overview" },
      { slug: "projects", label: "Projects" },
      { slug: "people", label: "People & seats" },
    ],
  },
  {
    group: "Policy",
    items: [
      { slug: "guardrails", label: "Guardrails" },
      { slug: "naming", label: "Naming registry" },
      { slug: "branding", label: "Branding & templates" },
      { slug: "security", label: "Security & data" },
    ],
  },
  {
    group: "Operations",
    items: [
      { slug: "billing", label: "Costs & licensing" },
      { slug: "integrations", label: "Integrations" },
      { slug: "audit", label: "Audit log" },
    ],
  },
];

export default function FirmAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { viewingAs } = useViewingAs();
  const canEdit = viewingAs === "michael";

  return (
    <div className="grid items-start gap-[18px] grid-cols-[220px_1fr]">
      <aside className="sticky top-0 rounded-card border border-border bg-surface p-[8px]">
        <div className="px-[10px] pt-[8px] pb-[6px]">
          <div className="text-[12.5px] font-semibold text-ink">Rihm Consulting</div>
          <div className="mt-[2px] text-[10.5px] text-muted">Firm registry · v2026.4</div>
        </div>
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="mb-[6px]">
            <div className="px-[10px] pt-[8px] pb-[4px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
              {grp.group}
            </div>
            {grp.items.map((item) => {
              const href = `/firm-admin/${item.slug}`;
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
          {canEdit
            ? "You are the Firm Administrator. Edits propagate to every project on next skill invocation."
            : "Firm Admin is read-only for your role. Only the Firm Administrator (V1: Michael Rihm) can edit."}
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}
