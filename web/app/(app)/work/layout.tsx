// Work tab layout — subnav (segmented pills) + nested route content.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/work.jsx
// (Work component, lines 4-27) + styles.css `.subnav` / `.subnav-item`.

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
  { id: "home", label: "Home", href: "/work/home" },
  { id: "admin", label: "Admin Tasks", href: "/work/admin" },
  { id: "roadmap", label: "Roadmap", href: "/work/roadmap" },
  { id: "items", label: "Work Items", href: "/work/items" },
  { id: "sprints", label: "Sprints", href: "/work/sprints" },
];

export default function WorkLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <>
      <nav
        className="mb-[14px] inline-flex w-fit gap-[2px] rounded-card border border-border bg-stripe p-[3px]"
        aria-label="Work sections"
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
