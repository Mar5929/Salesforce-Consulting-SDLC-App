import { notFound } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OrgConnectionCard } from "@/components/org/org-connection-card"
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
    },
  })

  if (!project) {
    notFound()
  }

  const currentMember = await getCurrentMember(projectId)
  const canManage = ["SOLUTION_ARCHITECT", "PM"].includes(currentMember.role)

  const componentCount = await prisma.orgComponent.count({
    where: { projectId },
  })

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
          isSyncing={false}
          projectId={projectId}
          canManage={canManage}
        />
      </div>

      {/* Placeholder sections for Plan 03 */}
      <div className="mt-8 max-w-[640px] space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Sync Schedule</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure automatic metadata sync intervals. Coming in a future update.
          </p>
        </div>

        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Sync History</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sync history will appear here after the first metadata sync completes.
          </p>
        </div>
      </div>
    </div>
  )
}
