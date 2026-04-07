"use client"

/**
 * Cmd+K Command Palette (D-21, D-22)
 *
 * Unified search across all entity types with three-layer search (filtered, full-text, semantic).
 * Results grouped by entity type with type-specific icons and badges.
 * Quick actions for creating questions, processing transcripts, and starting chats.
 * Recent items stored in localStorage for fast access.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  CircleHelp,
  BookOpen,
  CheckCircle,
  ClipboardList,
  AlertTriangle,
  Plus,
  FileText,
  MessageSquare,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { search } from "@/actions/search"
import type { GroupedSearchResults, SearchResult } from "@/lib/search/global-search"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  projectId: string
}

interface RecentItem {
  id: string
  displayId: string
  title: string
  entityType: string
  href: string
  timestamp: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300
const MAX_RECENT = 5
const RECENT_STORAGE_KEY = "sf-search-recent"

const ENTITY_ICONS: Record<string, typeof CircleHelp> = {
  question: CircleHelp,
  article: BookOpen,
  decision: CheckCircle,
  requirement: ClipboardList,
  risk: AlertTriangle,
}

const ENTITY_LABELS: Record<string, string> = {
  question: "Questions",
  article: "Knowledge Articles",
  decision: "Decisions",
  requirement: "Requirements",
  risk: "Risks",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecentItems(projectId: string): RecentItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(`${RECENT_STORAGE_KEY}-${projectId}`)
    if (!stored) return []
    return JSON.parse(stored) as RecentItem[]
  } catch {
    return []
  }
}

function addRecentItem(projectId: string, item: RecentItem) {
  if (typeof window === "undefined") return
  try {
    const items = getRecentItems(projectId).filter((i) => i.id !== item.id)
    items.unshift({ ...item, timestamp: Date.now() })
    localStorage.setItem(
      `${RECENT_STORAGE_KEY}-${projectId}`,
      JSON.stringify(items.slice(0, MAX_RECENT))
    )
  } catch {
    // localStorage not available
  }
}

function getEntityHref(projectId: string, entityType: string, id: string): string {
  switch (entityType) {
    case "question":
      return `/projects/${projectId}/questions/${id}`
    case "article":
      return `/projects/${projectId}/knowledge/${id}`
    case "decision":
      return `/projects/${projectId}/decisions/${id}`
    case "requirement":
      return `/projects/${projectId}/requirements/${id}`
    case "risk":
      return `/projects/${projectId}/risks/${id}`
    default:
      return `/projects/${projectId}`
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({ projectId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GroupedSearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Load recent items when opening
  useEffect(() => {
    if (open) {
      setRecentItems(getRecentItems(projectId))
      setQuery("")
      setResults(null)
      // Focus input after dialog renders
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, projectId])

  // Debounced search (T-02-27: 300ms debounce)
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!value.trim()) {
        setResults(null)
        setLoading(false)
        return
      }

      setLoading(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await search({ projectId, query: value })
          if (result?.data) {
            setResults(result.data)
          }
        } catch (error) {
          console.error("[command-palette] Search error:", error)
        } finally {
          setLoading(false)
        }
      }, DEBOUNCE_MS)
    },
    [projectId]
  )

  // Navigate to result
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const href = getEntityHref(projectId, result.entityType, result.id)

      addRecentItem(projectId, {
        id: result.id,
        displayId: result.displayId,
        title: result.title,
        entityType: result.entityType,
        href,
        timestamp: Date.now(),
      })

      setOpen(false)
      router.push(href)
    },
    [projectId, router]
  )

  // Navigate to recent item
  const handleRecentSelect = useCallback(
    (item: RecentItem) => {
      setOpen(false)
      router.push(item.href)
    },
    [router]
  )

  // Quick actions
  const handleQuickAction = useCallback(
    (path: string) => {
      setOpen(false)
      router.push(`/projects/${projectId}${path}`)
    },
    [projectId, router]
  )

  // Determine what to render
  const hasQuery = query.trim().length > 0
  const hasResults = results && results.totalCount > 0
  const resultGroups = results
    ? ([
        ["question", results.questions],
        ["article", results.articles],
        ["decision", results.decisions],
        ["requirement", results.requirements],
        ["risk", results.risks],
      ] as [string, SearchResult[]][]).filter(([, items]) => items.length > 0)
    : []

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        ref={inputRef}
        placeholder="Search everything..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        icon={<Search className="size-4" />}
      />

      <CommandList>
        {/* Loading state */}
        {loading && hasQuery && (
          <div className="py-4 text-center text-[13px] text-[#A3A3A3]">
            Searching...
          </div>
        )}

        {/* No results */}
        {!loading && hasQuery && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Search results grouped by entity type */}
        {!loading &&
          resultGroups.map(([type, items]) => {
            const Icon = ENTITY_ICONS[type] ?? CircleHelp
            return (
              <CommandGroup key={type} heading={ENTITY_LABELS[type] ?? type}>
                {items.map((item) => (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                    <Icon className="size-4 shrink-0 text-[#737373]" />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.title}</span>
                      {item.status && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {item.status}
                        </Badge>
                      )}
                      {item.isStale && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-red-200 bg-red-50 text-[10px] text-red-600"
                        >
                          Stale
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-[#A3A3A3]">
                      {item.displayId}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}

        {/* Recent items (when no query) */}
        {!hasQuery && recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => {
              const Icon = ENTITY_ICONS[item.entityType] ?? CircleHelp
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleRecentSelect(item)}
                >
                  <Icon className="size-4 shrink-0 text-[#737373]" />
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-[#A3A3A3]">
                    {item.displayId}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleQuickAction("/questions?create=true")}>
            <Plus className="size-4 text-[#737373]" />
            <span>Create Question</span>
          </CommandItem>
          <CommandItem onSelect={() => handleQuickAction("/transcripts")}>
            <FileText className="size-4 text-[#737373]" />
            <span>Process Transcript</span>
          </CommandItem>
          <CommandItem onSelect={() => handleQuickAction("/chat")}>
            <MessageSquare className="size-4 text-[#737373]" />
            <span>New Chat</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
