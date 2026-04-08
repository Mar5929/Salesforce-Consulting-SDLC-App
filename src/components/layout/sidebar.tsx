"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, MessageSquare, Settings, Users, CircleHelp, FileText, BookOpen, LayoutDashboard, Layers, Inbox, Timer, Map, Cloud, Microscope, FileOutput, Bug, BarChart3, type LucideIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ProjectSwitcher } from "@/components/layout/project-switcher"
import { UserMenu } from "@/components/layout/user-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  phase?: number
  roles?: string[]
  badge?: number
  disabled?: boolean
}

/** Update this constant as build phases are completed. */
const CURRENT_PHASE = 12

interface SidebarProps {
  currentMemberRole?: string
  activeProjectId?: string
  questionReviewCount?: number
  openDefectCount?: number
}

function buildNavItems(activeProjectId?: string, questionReviewCount?: number, openDefectCount?: number): NavItem[] {
  return [
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/",
      phase: 1,
      roles: undefined, // all roles
    },
    {
      label: "Questions",
      icon: CircleHelp,
      href: activeProjectId
        ? `/projects/${activeProjectId}/questions`
        : "#",
      phase: 2,
      disabled: !activeProjectId,
      badge: questionReviewCount,
    },
    {
      label: "Transcripts",
      icon: FileText,
      href: activeProjectId
        ? `/projects/${activeProjectId}/transcripts`
        : "#",
      phase: 2,
      disabled: !activeProjectId,
    },
    {
      label: "Chat",
      icon: MessageSquare,
      href: activeProjectId
        ? `/projects/${activeProjectId}/chat`
        : "#",
      phase: 2,
      disabled: !activeProjectId,
    },
    {
      label: "Knowledge",
      icon: BookOpen,
      href: activeProjectId
        ? `/projects/${activeProjectId}/knowledge`
        : "#",
      phase: 2,
      disabled: !activeProjectId,
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: activeProjectId
        ? `/projects/${activeProjectId}/dashboard`
        : "#",
      phase: 2,
      disabled: !activeProjectId,
    },
    {
      label: "Work",
      icon: Layers,
      href: activeProjectId
        ? `/projects/${activeProjectId}/work`
        : "#",
      phase: 3,
      disabled: !activeProjectId,
    },
    {
      label: "Backlog",
      icon: Inbox,
      href: activeProjectId
        ? `/projects/${activeProjectId}/backlog`
        : "#",
      phase: 3,
      disabled: !activeProjectId,
    },
    {
      label: "Sprints",
      icon: Timer,
      href: activeProjectId
        ? `/projects/${activeProjectId}/sprints`
        : "#",
      phase: 3,
      disabled: !activeProjectId,
      roles: ["PM", "SOLUTION_ARCHITECT"],
    },
    {
      label: "Roadmap",
      icon: Map,
      href: activeProjectId
        ? `/projects/${activeProjectId}/roadmap`
        : "#",
      phase: 12,
      disabled: !activeProjectId,
    },
    {
      label: "Org",
      icon: Cloud,
      href: activeProjectId
        ? `/projects/${activeProjectId}/org`
        : "#",
      phase: 4,
      disabled: !activeProjectId,
      roles: ["SOLUTION_ARCHITECT", "DEVELOPER"],
    },
    {
      label: "Analysis",
      icon: Microscope,
      href: activeProjectId
        ? `/projects/${activeProjectId}/org/analysis`
        : "#",
      phase: 4,
      disabled: !activeProjectId,
      roles: ["SOLUTION_ARCHITECT", "DEVELOPER"],
    },
    {
      label: "Documents",
      icon: FileOutput,
      href: activeProjectId
        ? `/projects/${activeProjectId}/documents`
        : "#",
      phase: 5,
      disabled: !activeProjectId,
      roles: ["PM", "SOLUTION_ARCHITECT"],
    },
    {
      label: "Defects",
      icon: Bug,
      href: activeProjectId
        ? `/projects/${activeProjectId}/defects`
        : "#",
      phase: 5,
      disabled: !activeProjectId,
      badge: openDefectCount,
    },
    {
      label: "PM Dashboard",
      icon: BarChart3,
      href: activeProjectId
        ? `/projects/${activeProjectId}/pm-dashboard`
        : "#",
      phase: 5,
      disabled: !activeProjectId,
      roles: ["PM", "SOLUTION_ARCHITECT"],
    },
    {
      label: "Settings",
      icon: Settings,
      href: activeProjectId
        ? `/projects/${activeProjectId}/settings`
        : "#",
      phase: 1,
      disabled: !activeProjectId,
      roles: ["SOLUTION_ARCHITECT", "PM"],
    },
    {
      label: "Team",
      icon: Users,
      href: activeProjectId
        ? `/projects/${activeProjectId}/settings/team`
        : "#",
      phase: 1,
      disabled: !activeProjectId,
      roles: ["SOLUTION_ARCHITECT", "PM"],
    },
  ]
}

function extractProjectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  if (!match || match[1] === "new") return undefined
  return match[1]
}

export function Sidebar({ currentMemberRole, activeProjectId: serverProjectId, questionReviewCount, openDefectCount }: SidebarProps) {
  const pathname = usePathname()

  // Prefer client-side pathname extraction over server prop, because
  // Next.js layouts don't re-render on client-side navigation
  const activeProjectId = extractProjectIdFromPath(pathname) ?? serverProjectId

  const NAV_ITEMS = buildNavItems(activeProjectId, questionReviewCount, openDefectCount)

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.phase || item.phase <= CURRENT_PHASE) &&
      (!item.roles || (currentMemberRole && item.roles.includes(currentMemberRole)))
  )

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/" || pathname === ""
    }
    // Ensure the match ends at a segment boundary to avoid false positives
    // e.g. /projects/abc/org should NOT activate when on /projects/abc/org/analysis
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#E5E5E5] bg-[#FAFAFA]"
      role="navigation"
    >
      {/* Project Switcher */}
      <ProjectSwitcher />

      <Separator />

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-[8px]">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            if (item.disabled) {
              return (
                <li key={item.label}>
                  <span
                    className="flex h-[36px] items-center gap-2 rounded-md pl-4 text-[13px] font-semibold text-muted-foreground/50 cursor-not-allowed"
                    title="Select a project first"
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </span>
                </li>
              )
            }
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-[36px] items-center gap-2 rounded-md pl-4 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-l-2 border-[#2563EB] text-[#2563EB]"
                      : "text-foreground hover:bg-[#F0F0F0]"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF7ED] px-1.5 text-[10px] font-medium text-[#EA580C] border border-[#FED7AA]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />

      {/* User Menu */}
      <UserMenu />
    </aside>
  )
}
