"use client"

import { useState, useTransition } from "react"
import { Cloud } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { disconnectOrg, requestSync } from "@/actions/org-connection"

interface OrgConnectionCardProps {
  instanceUrl: string | null
  lastSyncedAt: Date | null
  componentCount: number
  isConnected: boolean
  needsReauth: boolean
  isSyncing: boolean
  projectId: string
  canManage: boolean
}

type ConnectionStatus = "connected" | "disconnected" | "needs-reauth" | "syncing"

function getStatus(props: OrgConnectionCardProps): ConnectionStatus {
  if (props.isSyncing) return "syncing"
  if (props.needsReauth) return "needs-reauth"
  if (props.isConnected) return "connected"
  return "disconnected"
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; borderColor: string; badgeClasses: string; dotClasses?: string }
> = {
  connected: {
    label: "Connected",
    borderColor: "border-l-[#22C55E]",
    badgeClasses: "bg-[#22C55E] text-white",
    dotClasses: "bg-white",
  },
  disconnected: {
    label: "Disconnected",
    borderColor: "border-l-muted",
    badgeClasses: "border border-border text-muted-foreground bg-transparent",
  },
  "needs-reauth": {
    label: "Needs Reauthorization",
    borderColor: "border-l-[#F59E0B]",
    badgeClasses: "bg-[#F59E0B] text-white",
  },
  syncing: {
    label: "Syncing",
    borderColor: "border-l-primary",
    badgeClasses: "border border-border text-primary bg-transparent",
    dotClasses: "bg-primary animate-pulse",
  },
}

export function OrgConnectionCard(props: OrgConnectionCardProps) {
  const {
    instanceUrl,
    lastSyncedAt,
    componentCount,
    isConnected,
    projectId,
    canManage,
  } = props

  const status = getStatus(props)
  const config = STATUS_CONFIG[status]
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectOrg({ projectId })
      if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.success("Salesforce org disconnected")
        setDisconnectOpen(false)
      }
    })
  }

  function handleSync() {
    startTransition(async () => {
      const result = await requestSync({ projectId, syncType: "FULL" })
      if (result?.serverError) {
        toast.error(result.serverError)
      } else {
        toast.success("Metadata sync requested")
      }
    })
  }

  // Empty state when not connected
  if (!isConnected && status === "disconnected") {
    return (
      <Card className={`border-l-[3px] ${config.borderColor} p-6`}>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <Cloud className="size-12 text-muted-foreground" />
          <div>
            <h3 className="text-[18px] font-semibold">No Salesforce org connected</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Connect a Salesforce org to sync metadata, analyze existing customizations,
              and enable context-aware development with Claude Code.
            </p>
          </div>
          {canManage && (
            <Button render={<a href={`/api/auth/salesforce/authorize?projectId=${projectId}`} />}>
              Connect Salesforce Org
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-l-[3px] ${config.borderColor} p-6`}>
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-2">
          <Cloud className="size-5 text-muted-foreground" />
          <CardTitle className="text-[18px] font-semibold">Salesforce Org</CardTitle>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badgeClasses}`}
        >
          {config.dotClasses && (
            <span className={`inline-block size-1.5 rounded-full ${config.dotClasses}`} />
          )}
          {config.label}
        </span>
      </CardHeader>

      <CardContent className="mt-4 space-y-4 p-0">
        {instanceUrl && (
          <p className="text-sm text-secondary-foreground">
            Instance: {instanceUrl.replace(/^https?:\/\//, "")}
          </p>
        )}

        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          {lastSyncedAt && (
            <span>Last synced: {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}</span>
          )}
          {lastSyncedAt && componentCount > 0 && <span>|</span>}
          {componentCount > 0 && (
            <span>Components: {componentCount.toLocaleString()}</span>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-2 pt-2">
            {status === "needs-reauth" ? (
              <Button render={<a href={`/api/auth/salesforce/authorize?projectId=${projectId}`} />}>
                Reconnect
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={isPending || status === "syncing"}
                >
                  Sync Metadata
                </Button>

                <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
                  <DialogTrigger
                    render={
                      <Button variant="ghost" className="text-muted-foreground hover:text-destructive" />
                    }
                  >
                    Disconnect
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disconnect Salesforce Org?</DialogTitle>
                      <DialogDescription>
                        Synced metadata and org analysis results will be preserved, but
                        future syncs will stop. You can reconnect at any time.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Keep Connected
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnect}
                        disabled={isPending}
                      >
                        Disconnect Org
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
