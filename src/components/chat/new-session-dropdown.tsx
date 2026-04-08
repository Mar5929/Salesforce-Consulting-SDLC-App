"use client"

import { useRouter } from "next/navigation"
import { Plus, BookOpen, LayoutDashboard, HelpCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createConversation } from "@/actions/conversations"

interface NewSessionDropdownProps {
  projectId: string
}

const SESSION_TYPES = [
  {
    type: "STORY_SESSION" as const,
    label: "Story Generation",
    description: "Generate stories from epic context",
    icon: BookOpen,
  },
  {
    type: "BRIEFING_SESSION" as const,
    label: "Briefing",
    description: "Generate a project briefing",
    icon: LayoutDashboard,
  },
  {
    type: "QUESTION_SESSION" as const,
    label: "Question Impact",
    description: "Assess question impact",
    icon: HelpCircle,
  },
  {
    type: "ENRICHMENT_SESSION" as const,
    label: "Story Enrichment",
    description: "Enrich a story with AI suggestions",
    icon: Sparkles,
  },
] as const

/**
 * "+ New" button with dropdown showing available session types.
 * For Briefing: creates immediately and navigates.
 * For others needing entity selection: navigates with search params.
 */
export function NewSessionDropdown({ projectId }: NewSessionDropdownProps) {
  const router = useRouter()

  async function handleSelect(sessionType: string) {
    if (sessionType === "BRIEFING_SESSION") {
      // Create briefing session immediately and navigate
      const result = await createConversation({
        projectId,
        conversationType: "BRIEFING_SESSION",
        title: "Project Briefing",
      })
      if (result?.data) {
        router.push(`/projects/${projectId}/chat/${result.data.id}`)
        router.refresh()
      }
    } else {
      // Navigate with search params for entity selection in the chat page
      router.push(
        `/projects/${projectId}/chat?newSession=${sessionType}`
      )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="default" size="sm" aria-label="Create new session" />}
      >
        <Plus className="mr-1 h-4 w-4" />
        New Session
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {SESSION_TYPES.map((session) => {
          const Icon = session.icon
          return (
            <DropdownMenuItem
              key={session.type}
              onClick={() => handleSelect(session.type)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-[14px]">{session.label}</span>
              </div>
              <span className="text-muted-foreground ml-6 text-[13px]">
                {session.description}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
