"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { initiateBriefingSession } from "@/actions/conversations"
import { toast } from "sonner"

interface GenerateBriefingButtonProps {
  projectId: string
}

export function GenerateBriefingButton({ projectId }: GenerateBriefingButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    try {
      const result = await initiateBriefingSession({ projectId })
      if (result?.data?.conversationId) {
        router.push(`/projects/${projectId}/chat/${result.data.conversationId}`)
      } else {
        toast.error("Failed to create briefing session")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create briefing session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-1.5"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      Generate Briefing
    </Button>
  )
}
