/**
 * Org Component Context Loader
 *
 * Loads org component context for story context packages.
 * When a storyId is provided, finds related OrgComponent records via
 * StoryComponent join, plus their parent objects and relationships.
 */
import { prisma } from "@/lib/db"

export interface OrgComponentContext {
  components: Array<{
    apiName: string
    label: string | null
    type: string
    domain: string | null
  }>
  relationships: Array<{
    source: string
    target: string
    type: string
  }>
}

/**
 * Load org component context for a project, optionally scoped to a story.
 *
 * @param projectId - Project to scope queries to (T-04-16)
 * @param storyId - If provided, load components related to this story
 */
export async function loadOrgComponentContext(
  projectId: string,
  storyId?: string
): Promise<OrgComponentContext> {
  if (!storyId) {
    return { components: [], relationships: [] }
  }

  // Find org components linked to this story via StoryComponent
  const storyComponents = await prisma.storyComponent.findMany({
    where: {
      storyId,
      projectId,
      orgComponentId: { not: null },
    },
    select: { orgComponentId: true },
  })

  const componentIds = storyComponents
    .map((sc) => sc.orgComponentId)
    .filter((id): id is string => id !== null)

  if (componentIds.length === 0) {
    return { components: [], relationships: [] }
  }

  // Load components with their parent objects
  const components = await prisma.orgComponent.findMany({
    where: {
      id: { in: componentIds },
      projectId,
    },
    select: {
      apiName: true,
      label: true,
      componentType: true,
      domainGroupingId: true,
      parentComponent: {
        select: { apiName: true, label: true, componentType: true },
      },
    },
  })

  // Load relationships between these components
  const relationships = await prisma.orgRelationship.findMany({
    where: {
      projectId,
      OR: [
        { sourceComponentId: { in: componentIds } },
        { targetComponentId: { in: componentIds } },
      ],
    },
    select: {
      sourceComponent: { select: { apiName: true } },
      targetComponent: { select: { apiName: true } },
      relationshipType: true,
    },
  })

  return {
    components: components.map((c) => ({
      apiName: c.apiName,
      label: c.label,
      type: c.componentType,
      domain: c.domainGroupingId,
    })),
    relationships: relationships.map((r) => ({
      source: r.sourceComponent.apiName,
      target: r.targetComponent.apiName,
      type: r.relationshipType,
    })),
  }
}
