"use client"

import { Search } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface ConversationFiltersProps {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * Tab bar (All / Stories / Briefings / Transcripts / Questions)
 * plus inline search input for filtering conversations.
 */
export function ConversationFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: ConversationFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search conversations..."
          className="h-8 pl-8 text-[13px]"
          aria-label="Search conversations"
        />
      </div>
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(String(value))}>
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="all" className="text-[13px]">
            All
          </TabsTrigger>
          <TabsTrigger value="stories" className="text-[13px]">
            Stories
          </TabsTrigger>
          <TabsTrigger value="briefings" className="text-[13px]">
            Briefings
          </TabsTrigger>
          <TabsTrigger value="transcripts" className="text-[13px]">
            Transcripts
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-[13px]">
            Questions
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
