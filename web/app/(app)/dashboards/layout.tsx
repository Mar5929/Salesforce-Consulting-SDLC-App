// Dashboards tab layout — segmented subnav (PM / Sprint / Roadmap / QA / Usage / Health).
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/dashboards.jsx
// (left "dashboard picker" sidebar). We flatten that picker into a horizontal subnav
// matching styles.css `.subnav` / `.subnav-item` so it stays consistent with the
// Work tab subnav (Wave 2B) and our Next.js routing model.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface SubnavItem {
  id: string;
  label: string;
  href: string;
}

const ITEMS: SubnavItem[] = [
  { id: "pm", label: "PM Overview", href: "/dashboards/pm" },
  { id: "sprint", label: "Sprint", href: "/dashboards/sprint" },
  { id: "roadmap", label: "Roadmap", href: "/dashboards/roadmap" },
  { id: "qa", label: "QA", href: "/dashboards/qa" },
  { id: "usage", label: "Usage & Costs", href: "/dashboards/usage" },
  { id: "health", label: "Health score", href: "/dashboards/health" },
];

export default function DashboardsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <>
      <nav
        className="mb-[14px] inline-flex w-fit gap-[2px] rounded-card border border-border bg-stripe p-[3px]"
        aria-label="Dashboard sections"
      >
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`rounded-md px-[11px] py-[5px] text-[12px] font-medium ${
                active
                  ? "bg-surface text-ink shadow-segbtn"
                  : "text-muted hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}
