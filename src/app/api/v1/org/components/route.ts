/**
 * GET /api/v1/org/components
 *
 * Query org metadata components with optional type and domain filtering.
 * Returns paginated results.
 *
 * Query params:
 * - type: ComponentType filter (e.g., OBJECT, APEX_CLASS)
 * - domain: domainGroupingId filter
 * - page: page number (default: 1)
 * - pageSize: results per page (default: 50, max: 100)
 *
 * Rate limit: 60 requests per minute.
 * Auth: API key via x-api-key header (T-04-14).
 * Scope: All queries scoped to API key's project (T-04-16).
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withApiAuth } from "@/app/api/v1/_lib/api-handler"

export async function GET(request: Request) {
  return withApiAuth(
    request,
    async (projectId) => {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get("type")
      const domain = searchParams.get("domain")
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10))
      )

      // Build filter conditions
      const where: Record<string, unknown> = { projectId }
      if (type) {
        where.componentType = type
      }
      if (domain) {
        where.domainGroupingId = domain
      }

      // Query with pagination
      const [data, total] = await Promise.all([
        prisma.orgComponent.findMany({
          where,
          select: {
            id: true,
            apiName: true,
            label: true,
            componentType: true,
            domainGroupingId: true,
            componentStatus: true,
            isActive: true,
            parentComponent: {
              select: { apiName: true, componentType: true },
            },
          },
          orderBy: { apiName: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.orgComponent.count({ where }),
      ])

      return NextResponse.json({
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      })
    },
    60 // Rate limit: 60 per minute
  )
}
