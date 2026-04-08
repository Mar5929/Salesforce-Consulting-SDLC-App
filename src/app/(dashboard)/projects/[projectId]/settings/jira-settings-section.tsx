"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { JiraConfigForm } from "@/components/jira/jira-config-form"
import { deleteJiraConfig, retryFailedSyncs } from "@/actions/jira-sync"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface JiraConfigData {
  id: string
  projectId: string
  instanceUrl: string
  email: string
  jiraProjectKey: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface JiraSettingsSectionProps {
  projectId: string
  jiraConfig: JiraConfigData | null
  failedSyncCount: number
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function JiraSettingsSection({
  projectId,
  jiraConfig,
  failedSyncCount,
}: JiraSettingsSectionProps) {
  const router = useRouter()

  const { execute: executeRetry, isPending: isRetrying } = useAction(
    retryFailedSyncs,
    {
      onSuccess: ({ data }) => {
        toast.success(`Retrying ${data?.retriesInitiated ?? 0} failed sync(s)`)
        router.refresh()
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Failed to retry syncs"),
    }
  )

  const { execute: executeDisconnect } = useAction(deleteJiraConfig, {
    onSuccess: () => {
      toast.success("Jira configuration disconnected")
      router.refresh()
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Failed to disconnect Jira"),
  })

  function handleDisconnect() {
    executeDisconnect({ projectId })
  }

  return (
    <div>
      <h2 className="text-[18px] font-semibold text-foreground">
        Jira Integration
      </h2>
      <Separator className="mt-2 mb-4" />

      {jiraConfig ? (
        <div className="space-y-4">
          <JiraConfigForm
            projectId={projectId}
            existingConfig={jiraConfig}
            onDisconnect={handleDisconnect}
          />

          {failedSyncCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="flex-1 text-[13px] text-destructive">
                {failedSyncCount} sync(s) failed
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeRetry({ projectId })}
                disabled={isRetrying}
                className="text-destructive border-destructive/30"
              >
                {isRetrying && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Retry Failed Syncs
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-6 py-8 text-center">
          <h3 className="text-[14px] font-medium text-foreground">
            Jira sync not configured
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Optionally connect a client Jira instance to push stories and status
            updates.
          </p>
          <div className="mt-4">
            <JiraConfigForm projectId={projectId} />
          </div>
        </div>
      )}
    </div>
  )
}
