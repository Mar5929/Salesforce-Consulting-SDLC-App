import { notFound } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OrgConnectionCard } from "@/components/org/org-connection-card"
import { SyncHistoryTable } from "@/components/org/sync-history-table"
import { OrgConnectedToast } from "./connected-toast"

interface OrgSettingsPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function OrgSettingsPage({
  params,
  searchParams,
}: OrgSettingsPageProps) {
  const { projectId } = await params
  const { connected, error } = await searchParams

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      sfOrgInstanceUrl: true,
      sfOrgAccessToken: true,
      sfOrgLastSyncAt: true,
      sfOrgSyncIntervalHours: true,
    },
  })

  if (!project) {
    notFound()
  }

  const currentMember = await getCurrentMember(projectId)
  const canManage = ["SOLUTION_ARCHITECT", "PM"].includes(currentMember.role)

  const [componentCount, syncRuns, activeSyncRun] = await Promise.all([
    prisma.orgComponent.count({ where: { projectId } }),
    prisma.orgSyncRun.findMany({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.orgSyncRun.findFirst({
      where: { projectId, status: { in: ["PENDING", "RUNNING"] } },
    }),
  ])

  const isConnected = !!project.sfOrgInstanceUrl
  const needsReauth = isConnected && !project.sfOrgAccessToken

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Org Connection</h1>

      {/* Success toast for OAuth completion */}
      {connected === "true" && <OrgConnectedToast />}

      {/* OAuth failure alert */}
      {error === "oauth_failed" && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="size-4" />
          <AlertTitle>Authorization Failed</AlertTitle>
          <AlertDescription>
            Salesforce authorization failed. Verify your Connected App configuration and
            try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 max-w-[640px]">
        <OrgConnectionCard
          instanceUrl={project.sfOrgInstanceUrl}
          lastSyncedAt={project.sfOrgLastSyncAt}
          componentCount={componentCount}
          isConnected={isConnected}
          needsReauth={needsReauth}
          isSyncing={!!activeSyncRun}
          projectId={projectId}
          canManage={canManage}
        />
      </div>

      {/* Sync Schedule */}
      <div className="mt-8 max-w-[640px] space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Sync Schedule</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-secondary-foreground">Incremental sync</span>
            <span className="text-sm text-muted-foreground">
              Every {project.sfOrgSyncIntervalHours} hours
            </span>
          </div>
        </div>

        {/* Sync History */}
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Sync History</h2>
          <div className="mt-3">
            <SyncHistoryTable
              syncRuns={syncRuns.map((run) => ({
                id: run.id,
                syncType: run.syncType as "FULL" | "INCREMENTAL",
                status: run.status,
                componentCounts: run.componentCounts as {
                  added: number
                  modified: number
                  removed: number
                } | null,
                startedAt: run.startedAt,
                completedAt: run.completedAt,
                errorMessage: run.errorMessage,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
