/**
 * Org Overview Page
 *
 * Displays the org component inventory with type filtering and pagination,
 * plus recent sync history. Server component with client-side table interactions.
 */

import { Suspense } from "react"
import { Cloud } from "lucide-react"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { ComponentTable, ComponentTableSkeleton } from "@/components/org/component-table"
import { SyncHistoryTable } from "@/components/org/sync-history-table"

interface OrgOverviewPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{
    componentType?: string
    page?: string
  }>
}

const PAGE_SIZE = 25

export default async function OrgOverviewPage({
  params,
  searchParams,
}: OrgOverviewPageProps) {
  const { projectId } = await params
  const { componentType, page } = await searchParams

  await getCurrentMember(projectId)

  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1)
  const typeFilter = componentType && componentType !== "ALL" ? componentType : null

  // Build where clause
  const where = {
    projectId,
    ...(typeFilter ? { componentType: typeFilter as never } : {}),
  }

  // Fetch components with pagination
  const [components, totalCount] = await Promise.all([
    prisma.orgComponent.findMany({
      where,
      select: {
        id: true,
        apiName: true,
        label: true,
        componentType: true,
        isActive: true,
        lastSyncedAt: true,
        domainGroupingId: true,
      },
      orderBy: [{ componentType: "asc" }, { apiName: "asc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.orgComponent.count({ where }),
  ])

  // Fetch recent sync runs
  const syncRuns = await prisma.orgSyncRun.findMany({
    where: { projectId },
    orderBy: { startedAt: "desc" },
    take: 5,
  })

  const hasComponents = totalCount > 0

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Org Overview</h1>

      {/* Empty state */}
      {!hasComponents && syncRuns.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
          <Cloud className="size-12 text-muted-foreground" />
          <div>
            <h3 className="text-[18px] font-semibold">No metadata synced</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Connect a Salesforce org and run a sync to populate the component
              inventory. The first sync pulls all supported metadata types.
            </p>
          </div>
        </div>
      )}

      {/* Component table */}
      {(hasComponents || typeFilter) && (
        <div className="mt-6">
          <Suspense fallback={<ComponentTableSkeleton />}>
            <ComponentTable
              components={components.map((c) => ({
                ...c,
                componentType: c.componentType as string,
              }))}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              currentType={typeFilter}
            />
          </Suspense>
        </div>
      )}

      {/* Sync History */}
      <div className="mt-8">
        <h2 className="text-[18px] font-semibold text-foreground">Sync History</h2>
        <div className="mt-4">
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
  )
}
