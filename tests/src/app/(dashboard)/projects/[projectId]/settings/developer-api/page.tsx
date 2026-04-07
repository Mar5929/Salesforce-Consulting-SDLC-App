import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { DeveloperApiClient } from "./developer-api-client"

interface DeveloperApiPageProps {
  params: Promise<{ projectId: string }>
}

export default async function DeveloperApiPage({
  params,
}: DeveloperApiPageProps) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  })

  if (!project) {
    notFound()
  }

  const currentMember = await getCurrentMember(projectId)
  const canManage = ["SOLUTION_ARCHITECT", "PM"].includes(currentMember.role)

  // Load existing API keys (prefix only, never full key)
  const apiKeys = await prisma.apiKey.findMany({
    where: { projectId, isActive: true },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      useCount: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const serializedKeys = apiKeys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    useCount: k.useCount,
  }))

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">
        Developer API
      </h1>

      <div className="mt-6 max-w-[720px]">
        <DeveloperApiClient
          projectId={projectId}
          initialKeys={serializedKeys}
          canManage={canManage}
        />
      </div>
    </div>
  )
}
