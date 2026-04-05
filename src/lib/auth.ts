import { auth } from "@clerk/nextjs/server"
import { prisma } from "./db"

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function getCurrentMember(projectId: string) {
  const userId = await requireAuth()
  const member = await prisma.projectMember.findUnique({
    where: { projectId_clerkUserId: { projectId, clerkUserId: userId } },
  })
  if (!member) throw new Error("Not a member of this project")
  return member
}

export async function requireRole(
  projectId: string,
  allowedRoles: string[]
) {
  const member = await getCurrentMember(projectId)
  if (!allowedRoles.includes(member.role)) {
    throw new Error("Insufficient permissions")
  }
  return member
}
