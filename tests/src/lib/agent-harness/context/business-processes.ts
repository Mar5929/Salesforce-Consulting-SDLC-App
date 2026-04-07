/**
 * Business Process Context Loader
 *
 * Loads business process context for story context packages.
 * When componentIds are provided, finds BusinessProcess records that
 * include those components via BusinessProcessComponent join.
 */
import { prisma } from "@/lib/db"

export interface BusinessProcessContext {
  processes: Array<{
    name: string
    description: string | null
    complexity: string | null
    components: Array<{
      apiName: string
      role: string
    }>
  }>
}

/**
 * Load business process context for a project, optionally scoped to specific components.
 *
 * @param projectId - Project to scope queries to (T-04-16)
 * @param componentIds - If provided, load processes that include these org components
 */
export async function loadBusinessProcessContext(
  projectId: string,
  componentIds?: string[]
): Promise<BusinessProcessContext> {
  if (!componentIds || componentIds.length === 0) {
    return { processes: [] }
  }

  // Find business processes that include the given components
  const processComponents = await prisma.businessProcessComponent.findMany({
    where: {
      orgComponentId: { in: componentIds },
      businessProcess: { projectId },
    },
    select: { businessProcessId: true },
  })

  const processIds = [...new Set(processComponents.map((pc) => pc.businessProcessId))]

  if (processIds.length === 0) {
    return { processes: [] }
  }

  // Load processes with their components
  const processes = await prisma.businessProcess.findMany({
    where: {
      id: { in: processIds },
      projectId,
    },
    include: {
      processComponents: {
        include: {
          orgComponent: {
            select: { apiName: true },
          },
        },
      },
    },
  })

  return {
    processes: processes.map((p) => ({
      name: p.name,
      description: p.description,
      complexity: p.complexity,
      components: p.processComponents.map((pc) => ({
        apiName: pc.orgComponent.apiName,
        role: pc.role,
      })),
    })),
  }
}
