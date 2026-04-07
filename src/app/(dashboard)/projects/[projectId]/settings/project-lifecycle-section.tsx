"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { archiveProject, reactivateProject } from "@/actions/project-archive"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface ProjectLifecycleSectionProps {
  projectId: string
  projectStatus: string
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function ProjectLifecycleSection({
  projectId,
  projectStatus,
}: ProjectLifecycleSectionProps) {
  const router = useRouter()
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)

  const { execute: executeArchive, isPending: isArchiving } = useAction(
    archiveProject,
    {
      onSuccess: () => {
        toast.success("Project archived successfully")
        setShowArchiveDialog(false)
        router.push("/projects")
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to archive project")
        setShowArchiveDialog(false)
      },
    }
  )

  const { execute: executeReactivate, isPending: isReactivating } = useAction(
    reactivateProject,
    {
      onSuccess: () => {
        toast.success("Project reactivated successfully")
        setShowReactivateDialog(false)
        router.refresh()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to reactivate project")
        setShowReactivateDialog(false)
      },
    }
  )

  const isArchived = projectStatus === "ARCHIVED"

  return (
    <div>
      <h2 className="text-[18px] font-semibold text-foreground">
        Project Lifecycle
      </h2>
      <Separator className="mt-2 mb-4" />

      {isArchived ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Lock className="size-3" />
              Archived
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Reactivating will restore full access for all team members.
          </p>
          <Button
            onClick={() => setShowReactivateDialog(true)}
            disabled={isReactivating}
          >
            {isReactivating && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Reactivate Project
          </Button>

          {/* Reactivate confirmation dialog */}
          <AlertDialog
            open={showReactivateDialog}
            onOpenChange={setShowReactivateDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivate this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore full editing access for all team members.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => executeReactivate({ projectId })}
                  disabled={isReactivating}
                >
                  {isReactivating && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Reactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground">
            Archive this project to make it read-only. All data will be retained.
          </p>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isArchiving}
          >
            {isArchiving && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Archive Project
          </Button>

          {/* Archive confirmation dialog */}
          <AlertDialog
            open={showArchiveDialog}
            onOpenChange={setShowArchiveDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will make the project read-only. All data will be
                  retained. Team members will not be able to make changes until
                  reactivated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => executeArchive({ projectId })}
                  disabled={isArchiving}
                >
                  {isArchiving && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Archive Project
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
