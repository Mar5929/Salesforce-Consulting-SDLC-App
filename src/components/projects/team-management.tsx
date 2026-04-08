"use client"

import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
} from "@/actions/team"

const ROLE_LABELS: Record<string, string> = {
  SOLUTION_ARCHITECT: "Solution Architect",
  PM: "Project Manager",
  BA: "Business Analyst",
  DEVELOPER: "Developer",
  QA: "QA",
}

const PROJECT_ROLES = [
  { value: "SOLUTION_ARCHITECT", label: "Solution Architect" },
  { value: "PM", label: "Project Manager" },
  { value: "BA", label: "Business Analyst" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "QA", label: "QA" },
] as const

interface TeamMember {
  id: string
  displayName: string
  email: string
  role: string
  joinedAt: string
}

interface TeamManagementProps {
  projectId: string
  projectName: string
  members: TeamMember[]
  currentUserRole: string
}

export function TeamManagement({
  projectId,
  projectName,
  members,
  currentUserRole,
}: TeamManagementProps) {
  const router = useRouter()
  const canManage =
    currentUserRole === "PM" || currentUserRole === "SOLUTION_ARCHITECT"

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("DEVELOPER")

  // Remove confirmation dialog state
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null)

  const { execute: executeInvite, isExecuting: isInviting } = useAction(
    inviteTeamMember,
    {
      onSuccess: () => {
        toast.success("Team member invited successfully")
        setInviteEmail("")
        setInviteRole("DEVELOPER")
        router.refresh()
      },
      onError: (error) => {
        toast.error(
          error.error.serverError ?? "Failed to invite team member"
        )
      },
    }
  )

  const { execute: executeRemove, isExecuting: isRemoving } = useAction(
    removeTeamMember,
    {
      onSuccess: () => {
        toast.success("Team member removed")
        setRemoveMember(null)
        router.refresh()
      },
      onError: (error) => {
        toast.error(
          error.error.serverError ?? "Failed to remove team member"
        )
      },
    }
  )

  const { execute: executeRoleChange } = useAction(updateMemberRole, {
    onSuccess: () => {
      toast.success("Role updated")
      router.refresh()
    },
    onError: (error) => {
      toast.error(
        error.error.serverError ?? "Failed to update role"
      )
    },
  })

  function handleInvite() {
    if (!inviteEmail.trim()) return
    executeInvite({
      projectId,
      email: inviteEmail.trim(),
      role: inviteRole as "SOLUTION_ARCHITECT" | "DEVELOPER" | "PM" | "BA" | "QA",
    })
  }

  function handleRoleChange(memberId: string, newRole: string) {
    executeRoleChange({
      projectId,
      memberId,
      newRole: newRole as "SOLUTION_ARCHITECT" | "DEVELOPER" | "PM" | "BA" | "QA",
    })
  }

  function handleRemoveConfirm() {
    if (!removeMember) return
    executeRemove({
      projectId,
      memberId: removeMember.id,
    })
  }

  return (
    <div>
      {/* Members table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {canManage && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="text-[14px] text-foreground">
                {member.displayName || member.email || "Unknown Member"}
              </TableCell>
              <TableCell className="text-[14px] text-[#737373]">
                {member.email}
              </TableCell>
              <TableCell>
                {canManage ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => {
                      if (value) handleRoleChange(member.id, value)
                    }}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue>
                        {(value: string) => {
                          const match = PROJECT_ROLES.find((r) => r.value === value)
                          return match?.label ?? ROLE_LABELS[value] ?? value
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-[#737373]">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-[14px] text-[#737373]">
                {new Date(member.joinedAt).toLocaleDateString()}
              </TableCell>
              {canManage && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setRemoveMember(member)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Invite form -- only visible to PM and SA */}
      {canManage && (
        <div className="mt-6 flex items-center gap-2">
          <Input
            placeholder="team@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="max-w-[280px]"
          />
          <Select value={inviteRole} onValueChange={(value) => { if (value) setInviteRole(value) }}>
            <SelectTrigger className="w-[170px]">
              <SelectValue>
                {(value: string) => {
                  const match = PROJECT_ROLES.find((r) => r.value === value)
                  return match?.label ?? ROLE_LABELS[value] ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PROJECT_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Invite
          </Button>
        </div>
      )}

      {/* Remove Member confirmation dialog */}
      <Dialog
        open={removeMember !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveMember(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove {removeMember?.displayName || removeMember?.email} from{" "}
              {projectName}?
            </DialogTitle>
            <DialogDescription>
              They will lose access to all project data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveMember(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
            >
              {isRemoving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
