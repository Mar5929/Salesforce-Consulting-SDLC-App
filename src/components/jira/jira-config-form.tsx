"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { saveJiraConfig, toggleJiraSync } from "@/actions/jira-sync"

// ────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────

const jiraConfigCreateSchema = z.object({
  instanceUrl: z.string().url("Must be a valid URL"),
  email: z.string().email("Must be a valid email"),
  apiToken: z.string().min(1, "API token is required"),
  jiraProjectKey: z
    .string()
    .min(1, "Jira project key is required")
    .max(10, "Project key is too long"),
})

const jiraConfigUpdateSchema = z.object({
  instanceUrl: z.string().url("Must be a valid URL"),
  email: z.string().email("Must be a valid email"),
  apiToken: z.string().optional().default(""),
  jiraProjectKey: z
    .string()
    .min(1, "Jira project key is required")
    .max(10, "Project key is too long"),
})

type JiraConfigFormData = z.infer<typeof jiraConfigCreateSchema>

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

interface JiraConfigFormProps {
  projectId: string
  existingConfig?: JiraConfigData | null
  onDisconnect?: () => void
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function JiraConfigForm({
  projectId,
  existingConfig,
  onDisconnect,
}: JiraConfigFormProps) {
  const [enabled, setEnabled] = useState(existingConfig?.enabled ?? false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JiraConfigFormData>({
    resolver: zodResolver(existingConfig ? jiraConfigUpdateSchema : jiraConfigCreateSchema),
    defaultValues: {
      instanceUrl: existingConfig?.instanceUrl ?? "",
      email: existingConfig?.email ?? "",
      apiToken: "",
      jiraProjectKey: existingConfig?.jiraProjectKey ?? "",
    },
  })

  const { execute: executeSave, isPending: isSaving } = useAction(
    saveJiraConfig,
    {
      onSuccess: () => {
        toast.success("Jira configuration saved")
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Failed to save Jira configuration"),
    }
  )

  const { execute: executeToggle, isPending: isToggling } = useAction(
    toggleJiraSync,
    {
      onSuccess: () => {
        toast.success(enabled ? "Jira sync disabled" : "Jira sync enabled")
        setEnabled(!enabled)
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Failed to toggle Jira sync"),
    }
  )

  function onSubmit(data: JiraConfigFormData) {
    executeSave({
      projectId,
      ...data,
    })
  }

  function handleToggle() {
    if (!existingConfig) return
    executeToggle({ projectId, enabled: !enabled })
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable toggle (only shown when config exists) */}
      {existingConfig && (
        <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] px-4 py-3">
          <div>
            <p className="text-[14px] font-medium">Enable Jira Sync</p>
            <p className="text-[13px] text-muted-foreground">
              Push stories and status updates to Jira
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
      )}

      {/* Configuration form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instanceUrl">Jira Instance URL *</Label>
          <Input
            id="instanceUrl"
            placeholder="https://your-company.atlassian.net"
            {...register("instanceUrl")}
          />
          {errors.instanceUrl && (
            <p className="text-[13px] text-destructive">
              {errors.instanceUrl.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="your-email@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[13px] text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiToken">API Token *</Label>
          {/* T-05-20: Password input, masked. Never returned in plain text. */}
          <Input
            id="apiToken"
            type="password"
            placeholder={existingConfig ? "****" : "Enter API token"}
            {...register("apiToken")}
          />
          {errors.apiToken && (
            <p className="text-[13px] text-destructive">
              {errors.apiToken.message}
            </p>
          )}
          {existingConfig && (
            <p className="text-[12px] text-muted-foreground">
              Leave blank to keep existing token. Enter a new value to update.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="jiraProjectKey">Jira Project Key *</Label>
          <Input
            id="jiraProjectKey"
            placeholder="PROJ"
            {...register("jiraProjectKey")}
          />
          {errors.jiraProjectKey && (
            <p className="text-[13px] text-destructive">
              {errors.jiraProjectKey.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Configuration
          </Button>

          {existingConfig && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Jira?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the Jira configuration for this project.
                    Existing sync records will be retained but no new syncs will
                    occur.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-50 cursor-not-allowed"
                    onClick={() => onDisconnect?.()}
                    disabled
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  )
}
