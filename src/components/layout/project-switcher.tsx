"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectItem {
  id: string
  name: string
  clientName: string
}

export function ProjectSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Extract active projectId from URL
  const activeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null
  const activeProject = projects.find((p) => p.id === activeProjectId)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects")
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
        }
      } catch {
        // silently fail — user sees "No projects"
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Auto-navigate to sole project when no project is active
  useEffect(() => {
    if (projects.length === 1 && !activeProjectId) {
      router.replace(`/projects/${projects[0].id}`)
    }
  }, [projects, activeProjectId, router])

  function handleSelect(projectId: string) {
    startTransition(() => {
      router.push(`/projects/${projectId}`)
    })
  }

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  // Single project: static display, no dropdown needed
  if (projects.length === 1) {
    return (
      <div className="px-4 py-3">
        <div className="px-2 py-1.5">
          <div className="text-sm font-semibold truncate">{projects[0].name}</div>
          <div className="text-xs text-muted-foreground">{projects[0].clientName}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-accent/5 focus:outline-none">
          <span className="truncate">
            {activeProject?.name ?? "Select Project"}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-56">
          {projects.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No projects.{" "}
              <button
                onClick={() => router.push("/projects/new")}
                className="text-[#2563EB] hover:underline"
              >
                Create one
              </button>
            </div>
          ) : (
            projects.map((projectMember) => (
              <DropdownMenuItem
                key={projectMember.id}
                onSelect={() => handleSelect(projectMember.id)}
                className="flex flex-col items-start gap-0.5 px-2 py-1.5"
              >
                <span className="text-[14px] font-medium">
                  {projectMember.name}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {projectMember.clientName}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
