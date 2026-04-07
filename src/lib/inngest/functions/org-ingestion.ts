/**
 * Org Ingestion Inngest Step Function (ORG-04)
 *
 * 4-phase brownfield ingestion pipeline:
 * 1. Parse — Query and group OrgComponent records by type
 * 2. Classify — AI domain grouping with batched calls (max 50 per batch)
 * 3. Synthesize+Articulate — AI business process mapping per domain
 * 4. Finalize — Update project metadata
 *
 * Threat mitigations:
 * - T-04-11: All AI outputs have isConfirmed=false (human review required)
 * - T-04-12: SA role verified in triggerIngestion server action
 * - T-04-13: Components batched (max 50 per AI call), token budgets on tasks
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import { executeTask } from "@/lib/agent-harness/engine"
import { orgClassifyTask } from "@/lib/agent-harness/tasks/org-classify"
import { orgSynthesizeTask } from "@/lib/agent-harness/tasks/org-synthesize"

/** Maximum components per AI classification call (T-04-13) */
const CLASSIFY_BATCH_SIZE = 50

interface ParsedComponent {
  id: string
  apiName: string
  label: string
}

interface ClassifyResult {
  name: string
  description: string
  componentApiNames: string[]
  confidence: number
}

interface SynthesizeResult {
  name: string
  description: string
  complexity: "LOW" | "MEDIUM" | "HIGH"
  components: Array<{ apiName: string; role: string; isRequired: boolean }>
  dependsOn: string[]
}

/**
 * Step 1 — Parse: Query all active OrgComponent records and group by type.
 * Exported for unit testing.
 */
export async function parseOrgComponents(
  projectId: string
): Promise<Record<string, ParsedComponent[]>> {
  const components = await prisma.orgComponent.findMany({
    where: { projectId, isActive: true },
    select: { id: true, apiName: true, label: true, componentType: true },
  })

  const grouped: Record<string, ParsedComponent[]> = {}
  for (const c of components) {
    const type = c.componentType
    if (!grouped[type]) grouped[type] = []
    grouped[type].push({
      id: c.id,
      apiName: c.apiName,
      label: c.label || c.apiName,
    })
  }

  return grouped
}

/**
 * Step 2 — Classify: Batch components and run AI classification.
 * Creates DomainGrouping records with isAiSuggested=true, isConfirmed=false.
 * Exported for unit testing.
 */
export async function classifyComponents(
  projectId: string,
  userId: string,
  groupedComponents: Record<string, ParsedComponent[]>
): Promise<Array<{ id: string; name: string; description: string }>> {
  // Flatten all components for batching
  const allComponents: Array<{
    id: string
    apiName: string
    label: string
    componentType: string
  }> = []
  for (const [type, items] of Object.entries(groupedComponents)) {
    for (const item of items) {
      allComponents.push({ ...item, componentType: type })
    }
  }

  // Batch into chunks of CLASSIFY_BATCH_SIZE
  const batches: typeof allComponents[] = []
  for (let i = 0; i < allComponents.length; i += CLASSIFY_BATCH_SIZE) {
    batches.push(allComponents.slice(i, i + CLASSIFY_BATCH_SIZE))
  }

  // Run classification on each batch
  const allGroupings: ClassifyResult[] = []
  for (const batch of batches) {
    const result = await executeTask(
      orgClassifyTask,
      {
        userMessage: `Classify these ${batch.length} Salesforce org components into domain groupings.`,
        metadata: { components: batch },
      },
      projectId,
      userId
    )

    try {
      const parsed = JSON.parse(result.output) as ClassifyResult[]
      allGroupings.push(...parsed)
    } catch {
      // If AI output is not valid JSON, skip this batch
      console.error("Failed to parse classify output:", result.output.slice(0, 200))
    }
  }

  // Build apiName -> id lookup
  const apiNameToId: Record<string, string> = {}
  for (const c of allComponents) {
    apiNameToId[c.apiName] = c.id
  }

  // Create DomainGrouping records
  const createdGroupings: Array<{ id: string; name: string; description: string }> = []
  for (const grouping of allGroupings) {
    const dg = await prisma.domainGrouping.create({
      data: {
        projectId,
        name: grouping.name,
        description: `${grouping.description} (confidence: ${grouping.confidence}%)`,
        isAiSuggested: true,
        isConfirmed: false,
      },
    })

    // Assign OrgComponents to this domain grouping
    const componentIds = grouping.componentApiNames
      .map((name) => apiNameToId[name])
      .filter(Boolean)

    if (componentIds.length > 0) {
      await prisma.orgComponent.updateMany({
        where: { id: { in: componentIds } },
        data: { domainGroupingId: dg.id },
      })
    }

    createdGroupings.push({
      id: dg.id,
      name: dg.name,
      description: dg.description || "",
    })
  }

  return createdGroupings
}

/**
 * Step 3 — Synthesize+Articulate: For each domain grouping, identify business processes.
 * Creates BusinessProcess and BusinessProcessComponent records.
 * Exported for unit testing.
 */
export async function synthesizeBusinessProcesses(
  projectId: string,
  userId: string,
  domainGroupings: Array<{ id: string; name: string; description: string }>
): Promise<void> {
  for (const dg of domainGroupings) {
    // Query components assigned to this domain grouping
    const components = await prisma.orgComponent.findMany({
      where: { domainGroupingId: dg.id },
      select: { id: true, apiName: true, label: true, componentType: true },
    })

    if (components.length === 0) continue

    const result = await executeTask(
      orgSynthesizeTask,
      {
        userMessage: `Identify the business processes supported by the "${dg.name}" domain grouping.`,
        metadata: {
          domainGrouping: {
            name: dg.name,
            description: dg.description,
            components: components.map((c) => ({
              apiName: c.apiName,
              label: c.label || c.apiName,
              componentType: c.componentType,
            })),
          },
        },
      },
      projectId,
      userId
    )

    let processes: SynthesizeResult[]
    try {
      processes = JSON.parse(result.output) as SynthesizeResult[]
    } catch {
      console.error("Failed to parse synthesize output:", result.output.slice(0, 200))
      continue
    }

    // Build apiName -> id lookup for this domain's components
    const apiNameToId: Record<string, string> = {}
    for (const c of components) {
      apiNameToId[c.apiName] = c.id
    }

    // Create BusinessProcess and BusinessProcessComponent records
    for (const proc of processes) {
      const bp = await prisma.businessProcess.create({
        data: {
          projectId,
          name: proc.name,
          description: proc.description,
          domainGroupingId: dg.id,
          complexity: proc.complexity,
          isAiSuggested: true,
          isConfirmed: false,
        },
      })

      // Create component join records
      for (const comp of proc.components) {
        const orgComponentId = apiNameToId[comp.apiName]
        if (!orgComponentId) continue

        await prisma.businessProcessComponent.create({
          data: {
            businessProcessId: bp.id,
            orgComponentId,
            role: comp.role,
            isRequired: comp.isRequired,
          },
        })
      }
    }
  }
}

/**
 * Inngest function: Org Ingestion Pipeline
 *
 * Triggered by ORG_INGESTION_REQUESTED event.
 * Per-project concurrency limit of 1 to prevent duplicate ingestion runs.
 */
export const orgIngestionFunction = inngest.createFunction(
  {
    id: "org-ingestion",
    retries: 2,
    concurrency: [
      {
        scope: "fn",
        key: "event.data.projectId",
        limit: 1,
      },
    ],
    triggers: [{ event: EVENTS.ORG_INGESTION_REQUESTED }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { projectId, userId } = event.data as {
      projectId: string
      userId: string
    }

    // Step 1 — Parse
    const groupedComponents = await step.run("parse-org-components", async () => {
      return parseOrgComponents(projectId)
    })

    // Check if we have any components to process
    const totalComponents = Object.values(groupedComponents as Record<string, unknown[]>).reduce(
      (sum, arr) => sum + arr.length,
      0
    )
    if (totalComponents === 0) {
      return { success: false, reason: "No active components found" }
    }

    // Step 2 — Classify
    const domainGroupings = await step.run("classify-components", async () => {
      return classifyComponents(projectId, userId, groupedComponents)
    })

    if (domainGroupings.length === 0) {
      return { success: false, reason: "Classification produced no domain groupings" }
    }

    // Step 3 — Synthesize+Articulate
    await step.run("synthesize-business-processes", async () => {
      return synthesizeBusinessProcesses(projectId, userId, domainGroupings)
    })

    // Step 4 — Finalize
    await step.run("finalize-ingestion", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { sfOrgLastSyncAt: new Date() },
      })
    })

    return {
      success: true,
      domainGroupings: domainGroupings.length,
      totalComponents,
    }
  }
)
