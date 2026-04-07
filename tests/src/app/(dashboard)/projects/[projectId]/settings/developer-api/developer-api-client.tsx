"use client"

import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { formatDistanceToNow, format } from "date-fns"
import { Code, ChevronDown, ChevronRight, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ApiKeyCard } from "@/components/org/api-key-card"
import {
  generateApiKeyAction,
  revokeApiKeyAction,
} from "@/actions/api-keys"

interface ApiKeyData {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  useCount: number
}

interface DeveloperApiClientProps {
  projectId: string
  initialKeys: ApiKeyData[]
  canManage: boolean
}

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/context-package?storyId=X",
    description:
      "Assemble context package for a story. Returns story details, business processes, knowledge articles, decisions, and sprint conflicts.",
  },
  {
    method: "GET",
    path: "/api/v1/org/components?type=X&domain=Y",
    description:
      "Query org metadata components. Supports type and domain filtering with pagination.",
  },
  {
    method: "PATCH",
    path: "/api/v1/stories/:id/status",
    description:
      'Update story status. Body: { "status": "IN_PROGRESS" }. Validates status transitions.',
  },
  {
    method: "GET",
    path: "/api/v1/project/summary",
    description:
      "Get project summary with team, story, epic, question, and org component counts.",
  },
]

export function DeveloperApiClient({
  projectId,
  initialKeys,
  canManage,
}: DeveloperApiClientProps) {
  const [keys, setKeys] = useState<ApiKeyData[]>(initialKeys)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyData | null>(null)
  const [docsOpen, setDocsOpen] = useState(false)

  const { execute: generateKey, isPending: isGenerating } = useAction(
    generateApiKeyAction,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setNewRawKey(data.rawKey)
          setKeys((prev) => [
            {
              id: data.id,
              name: data.name,
              keyPrefix: data.rawKey.slice(0, 8),
              createdAt: new Date().toISOString(),
              lastUsedAt: null,
              useCount: 0,
            },
            ...prev,
          ])
          setKeyName("")
          setShowGenerateDialog(false)
          toast.success("API key generated")
        }
      },
      onError: ({ error }) => {
        toast.error(
          error.serverError ?? "Unable to generate API key. Please try again."
        )
      },
    }
  )

  const { execute: revokeKey, isPending: isRevoking } = useAction(
    revokeApiKeyAction,
    {
      onSuccess: () => {
        if (revokeTarget) {
          setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id))
          setRevokeTarget(null)
          toast.success("API key revoked")
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to revoke API key")
      },
    }
  )

  function handleGenerate() {
    if (!keyName.trim()) return
    generateKey({ projectId, name: keyName.trim() })
  }

  function handleRevoke() {
    if (!revokeTarget) return
    revokeKey({ apiKeyId: revokeTarget.id, projectId })
  }

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1`
      : "/api/v1"

  return (
    <div className="space-y-8">
      {/* New key display card */}
      {newRawKey && (
        <ApiKeyCard
          rawKey={newRawKey}
          onDismiss={() => setNewRawKey(null)}
        />
      )}

      {/* API Keys Section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-foreground">
            API Keys
          </h2>
          {canManage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowGenerateDialog(true)}
            >
              Generate API Key
            </Button>
          )}
        </div>

        {keys.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
            <KeyRound className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-foreground">No API keys</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Generate a project-scoped API key for Claude Code to access
              context packages, org metadata, and update story status via the
              REST API.
            </p>
            {canManage && (
              <Button
                variant="default"
                size="sm"
                className="mt-4"
                onClick={() => setShowGenerateDialog(true)}
              >
                Generate API Key
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {format(new Date(key.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {key.lastUsedAt
                        ? formatDistanceToNow(new Date(key.lastUsedAt), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(key)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* API Documentation Section */}
      <section>
        <h2 className="text-[18px] font-semibold text-foreground">
          API Documentation
        </h2>
        <div className="mt-3 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Base URL: </span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
              {baseUrl}
            </code>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Auth: </span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
              x-api-key
            </code>
            <span className="text-muted-foreground"> header</span>
          </div>
        </div>

        <div className="mt-4">
          <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80">
              {docsOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              Endpoints
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                {ENDPOINTS.map((ep) => (
                  <div
                    key={ep.path}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="size-4 text-muted-foreground" />
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-semibold">
                        {ep.method}
                      </span>
                      <code className="text-[13px]">{ep.path}</code>
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                      {ep.description}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {/* Generate API Key Dialog */}
      <Dialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a project-scoped API key for Claude Code integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="key-name">Key Name</Label>
            <Input
              id="key-name"
              placeholder="e.g., claude-code-dev"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!keyName.trim() || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Revoke API Key{" "}
              {revokeTarget
                ? `...${revokeTarget.keyPrefix.slice(-4)}`
                : ""}
              ?
            </DialogTitle>
            <DialogDescription>
              Any Claude Code sessions using this key will immediately lose
              API access. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
            >
              Keep Key
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? "Revoking..." : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
