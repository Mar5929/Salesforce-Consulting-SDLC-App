"use client"

/**
 * Work Breadcrumb Navigation (D-01)
 *
 * Reusable breadcrumb for work hierarchy drill-down.
 * Segments: Work > Epic > Feature > Story
 */

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment } from "react"

interface BreadcrumbSegment {
  label: string
  href: string
}

export function WorkBreadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {segments.map((seg, i) => (
        <Fragment key={seg.href}>
          {i > 0 && <ChevronRight className="h-4 w-4" />}
          {i === segments.length - 1 ? (
            <span className="font-medium text-foreground">{seg.label}</span>
          ) : (
            <Link
              href={seg.href}
              className="hover:text-foreground transition-colors"
            >
              {seg.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
