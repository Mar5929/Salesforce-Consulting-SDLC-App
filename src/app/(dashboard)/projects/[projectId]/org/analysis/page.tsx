/**
 * Org Analysis Page
 *
 * Displays the brownfield ingestion pipeline status and tabbed review
 * interface for AI-suggested domain groupings and business processes.
 * Server component fetches data; client wrapper handles interactivity.
 */

import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalysisClient } from "./analysis-client"

interface AnalysisPageProps {
  params: Promise<{ projectId: string }>
}

export default async function OrgAnalysisPage({ params }: AnalysisPageProps) {
  const { projectId } = await params
  await getCurrentMember(projectId)

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">
        Org Analysis
      </h1>

      <Suspense fallback={<AnalysisSkeleton />}>
        <AnalysisData projectId={projectId} />
      </Suspense>
    </div>
  )
}

async function AnalysisData({ projectId }: { projectId: string }) {
  // Check org is connected and has synced components
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { sfOrgInstanceUrl: true },
  })

  const componentCount = await prisma.orgComponent.count({
    where: { projectId },
  })

  const isOrgConnected = !!project?.sfOrgInstanceUrl
  const hasSyncedComponents = componentCount > 0

  // Fetch domain groupings with components
  const domainGroupings = await prisma.domainGrouping.findMany({
    where: { projectId },
    include: {
      orgComponents: {
        select: { apiName: true, label: true },
        orderBy: { apiName: "asc" },
      },
    },
    orderBy: [{ isConfirmed: "asc" }, { name: "asc" }],
  })

  // Fetch business processes with component mappings
  const businessProcesses = await prisma.businessProcess.findMany({
    where: { projectId },
    include: {
      processComponents: {
        include: {
          orgComponent: {
            select: { apiName: true, label: true },
          },
        },
      },
    },
    orderBy: [{ isConfirmed: "asc" }, { name: "asc" }],
  })

  // Query the latest ingestion run for real pipeline status (BUG-021)
  const latestIngestionRun = await prisma.orgIngestionRun.findFirst({
    where: { projectId },
    orderBy: { startedAt: "desc" },
    select: { status: true, currentPhase: true },
  })

  const hasRun = domainGroupings.length > 0

  // Derive pipeline phase and status from the ingestion run record
  let pipelinePhase: 0 | 1 | 2 | 3 | 4
  let pipelineStatus: "idle" | "running" | "completed" | "failed"

  if (latestIngestionRun) {
    const phase = latestIngestionRun.currentPhase
    pipelinePhase = (phase >= 0 && phase <= 4 ? phase : 0) as 0 | 1 | 2 | 3 | 4

    switch (latestIngestionRun.status) {
      case "RUNNING":
        pipelineStatus = "running"
        break
      case "COMPLETED":
        pipelineStatus = "completed"
        break
      case "FAILED":
        pipelineStatus = "failed"
        break
      default:
        // PENDING — pipeline is about to start
        pipelineStatus = "running"
        break
    }
  } else if (hasRun) {
    // Legacy: domain groupings exist but no ingestion run record (pre-BUG-021 data)
    pipelinePhase = 4
    pipelineStatus = "completed"
  } else {
    pipelinePhase = 0
    pipelineStatus = "idle"
  }

  // Map data for client components
  const domainData = domainGroupings.map((dg) => ({
    id: dg.id,
    name: dg.name,
    description: dg.description,
    isConfirmed: dg.isConfirmed,
    components: dg.orgComponents.map((c) => ({
      apiName: c.apiName,
      label: c.label,
    })),
  }))

  const processData = businessProcesses.map((bp) => ({
    id: bp.id,
    name: bp.name,
    description: bp.description,
    complexity: bp.complexity,
    isConfirmed: bp.isConfirmed,
    components: bp.processComponents.map((pc) => ({
      apiName: pc.orgComponent.apiName,
      role: pc.role,
      isRequired: pc.isRequired,
    })),
  }))

  const dgConfirmed = domainGroupings.filter((d) => d.isConfirmed).length
  const bpConfirmed = businessProcesses.filter((b) => b.isConfirmed).length

  return (
    <AnalysisClient
      projectId={projectId}
      isOrgConnected={isOrgConnected}
      hasSyncedComponents={hasSyncedComponents}
      hasRun={hasRun}
      pipelinePhase={pipelinePhase as 0 | 1 | 2 | 3 | 4}
      pipelineStatus={pipelineStatus as "idle" | "running" | "completed" | "failed"}
      domainGroupings={domainData}
      businessProcesses={processData}
      dgTotal={domainGroupings.length}
      dgConfirmed={dgConfirmed}
      bpTotal={businessProcesses.length}
      bpConfirmed={bpConfirmed}
    />
  )
}

function AnalysisSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      {/* Pipeline stepper skeleton */}
      <div className="flex items-center justify-center gap-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-full" />
            {i < 4 && <Skeleton className="h-0.5 w-12" />}
          </div>
        ))}
      </div>
      {/* Review card skeletons */}
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
