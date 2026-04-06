"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, MessageSquare, Settings, Users, CircleHelp, FileText, BookOpen, LayoutDashboard, Layers, Inbox, Timer, Cloud, Microscope, type LucideIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ProjectSwitcher } from "@/components/layout/project-switcher"
import { UserMenu } from "@/components/layout/user-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  roles?: string[]
  badge?: number
}

interface SidebarProps {
  currentMemberRole?: string
  activeProjectId?: string
  questionReviewCount?: number
}

function buildNavItems(activeProjectId?: string, questionReviewCount?: number): NavItem[] {
  return [
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/",
      roles: undefined, // all roles
    },
    {
      label: "Questions",
      icon: CircleHelp,
      href: activeProjectId
        ? `/projects/${activeProjectId}/questions`
        : "/questions",
      roles: undefined, // all roles
      badge: questionReviewCount,
    },
    {
      label: "Transcripts",
      icon: FileText,
      href: activeProjectId
        ? `/projects/${activeProjectId}/transcripts`
        : "/transcripts",
      roles: undefined, // all roles
    },
    {
      label: "Chat",
      icon: MessageSquare,
      href: activeProjectId
        ? `/projects/${activeProjectId}/chat`
        : "/chat",
      roles: undefined, // all roles
    },
    {
      label: "Knowledge",
      icon: BookOpen,
      href: activeProjectId
        ? `/projects/${activeProjectId}/knowledge`
        : "/knowledge",
      roles: undefined, // all roles
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: activeProjectId
        ? `/projects/${activeProjectId}/dashboard`
        : "/dashboard",
      roles: undefined, // all roles
    },
    {
      label: "Work",
      icon: Layers,
      href: activeProjectId
        ? `/projects/${activeProjectId}/work`
        : "/work",
      roles: undefined, // all roles
    },
    {
      label: "Backlog",
      icon: Inbox,
      href: activeProjectId
        ? `/projects/${activeProjectId}/backlog`
        : "/backlog",
      roles: undefined, // all roles
    },
    {
      label: "Sprints",
      icon: Timer,
      href: activeProjectId
        ? `/projects/${activeProjectId}/sprints`
        : "/sprints",
      roles: undefined, // all roles
    },
    {
      label: "Org",
      icon: Cloud,
      href: activeProjectId
        ? `/projects/${activeProjectId}/org`
        : "/org",
      roles: undefined, // all roles
    },
    {
      label: "Analysis",
      icon: Microscope,
      href: activeProjectId
        ? `/projects/${activeProjectId}/org/analysis`
        : "/org/analysis",
      roles: undefined, // all roles
    },
    {
      label: "Settings",
      icon: Settings,
      href: activeProjectId
        ? `/projects/${activeProjectId}/settings`
        : "/settings",
      roles: ["SOLUTION_ARCHITECT", "PM"],
    },
    {
      label: "Team",
      icon: Users,
      href: activeProjectId ? `/projects/${activeProjectId}/team` : "/team",
      roles: ["SOLUTION_ARCHITECT", "PM"],
    },
  ]
}

export function Sidebar({ currentMemberRole, activeProjectId, questionReviewCount }: SidebarProps) {
  const pathname = usePathname()

  const NAV_ITEMS = buildNavItems(activeProjectId, questionReviewCount)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (currentMemberRole && item.roles.includes(currentMemberRole))
  )

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/" || pathname === ""
    }
    return pathname.startsWith(href)
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
