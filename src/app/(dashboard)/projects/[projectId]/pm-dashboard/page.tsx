/**
 * PM Dashboard Page
 *
 * Server component wrapper that passes projectId to the client dashboard.
 * Client component handles SWR polling for live data updates.
 *
 * Architecture: D-11, D-12, D-13, D-14
 * Threat mitigation: T-05-14 (PM/SA role verified in server action)
 */

import { notFound } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import { PmDashboardClient } from "./pm-dashboard-client"

interface PmDashboardPageProps {
  params: Promise<{ projectId: string }>
}

const ALLOWED_ROLES = ["PM", "SOLUTION_ARCHITECT"]

export default async function PmDashboardPage({
  params,
}: PmDashboardPageProps) {
  const { projectId } = await params

  const member = await getCurrentMember(projectId)
  if (!ALLOWED_ROLES.includes(member.role)) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">
        PM Dashboard
      </h1>
      <div className="mt-6">
        <PmDashboardClient projectId={projectId} />
      </div>
    </div>
  )
}
