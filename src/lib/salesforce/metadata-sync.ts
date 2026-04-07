/**
 * Metadata Sync Module
 *
 * Fetches Salesforce metadata via jsforce and upserts normalized
 * OrgComponent/OrgRelationship records. Supports full and incremental
 * sync modes.
 *
 * Threat mitigations:
 * - T-04-09: Concurrency limit enforced at Inngest level (1 per project)
 * - T-04-10: Sequential type processing; Inngest step retries handle 429/503
 */

import type jsforce from "jsforce"
import { prisma } from "@/lib/db"
import { getSalesforceConnection } from "@/lib/salesforce/client"
import {
  SUPPORTED_METADATA_TYPES,
  type MetadataTypeConfig,
} from "@/lib/salesforce/types"
import type { ComponentType, OrgRelationshipType } from "@/generated/prisma"

/** Map Salesforce metadata type string to our ComponentType enum */
const SF_TYPE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  CustomObject: "OBJECT",
  ApexClass: "APEX_CLASS",
  ApexTrigger: "APEX_TRIGGER",
  LightningComponentBundle: "LWC",
  Flow: "FLOW",
  PermissionSet: "PERMISSION_SET",
  Profile: "PROFILE",
  CustomLabel: "OTHER",
  CustomSetting: "OTHER",
  CustomMetadata: "CUSTOM_METADATA_TYPE",
}

/** Map jsforce field types to relationship types */
function getRelationshipType(
  fieldType: string
): OrgRelationshipType | null {
  if (fieldType === "reference") return "LOOKUP"
  if (fieldType === "masterdetail") return "MASTER_DETAIL"
  return null
}

/**
 * Fetch metadata list for a given type and upsert OrgComponent records.
 *
 * @param conn - Authenticated jsforce Connection
 * @param projectId - Project ID
 * @param typeConfig - Metadata type configuration
 * @param sinceDate - Optional date filter for incremental sync (5-minute buffer applied)
 * @returns Counts of added and modified components
 */
export async function syncMetadataType(
  conn: jsforce.Connection,
  projectId: string,
  typeConfig: MetadataTypeConfig,
  sinceDate?: Date
): Promise<{ added: number; modified: number }> {
  let added = 0
  let modified = 0

  const componentType =
    SF_TYPE_TO_COMPONENT_TYPE[typeConfig.type] ?? "OTHER"

  // Fetch metadata list from Salesforce
  const rawResult = await conn.metadata.list([{ type: typeConfig.type }])

  // metadata.list returns a single object or array
  const items = Array.isArray(rawResult) ? rawResult : rawResult ? [rawResult] : []

  // Apply incremental date filter with 5-minute buffer
  const filteredItems = sinceDate
    ? items.filter((item) => {
        const bufferedDate = new Date(
          sinceDate.getTime() - 5 * 60 * 1000
        )
        const itemDate = new Date(item.lastModifiedDate)
        return itemDate > bufferedDate
      })
    : items

  for (const item of filteredItems) {
    const existing = await prisma.orgComponent.upsert({
      where: {
        projectId_apiName_componentType: {
          projectId,
          apiName: item.fullName,
          componentType,
        },
      },
      create: {
        projectId,
        apiName: item.fullName,
        label: item.fullName,
        componentType,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        label: item.fullName,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    })

    // Distinguish create vs update by comparing createdAt and updatedAt timestamps.
    // On a fresh create, both timestamps are set to now() and will be equal.
    // On an update, updatedAt is refreshed but createdAt remains the original value.
    if (existing.createdAt.getTime() === existing.updatedAt.getTime()) {
      added++
    } else {
      modified++
    }

    // If describeFields is true (CustomObject), fetch field descriptions
    if (typeConfig.describeFields) {
      await describeAndUpsertFields(conn, projectId, item.fullName, existing.id)
    }
  }

  return { added, modified }
}

/**
 * Describe an SObject's fields and upsert them as child OrgComponent FIELD records.
 * Creates OrgRelationship records for lookup/masterDetail fields.
 */
async function describeAndUpsertFields(
  conn: jsforce.Connection,
  projectId: string,
  objectApiName: string,
  parentComponentId: string
): Promise<void> {
  const describeResult = await conn.sobject(objectApiName).describe()

  for (const field of describeResult.fields) {
    const fieldApiName = `${objectApiName}.${field.name}`

    const fieldComponent = await prisma.orgComponent.upsert({
      where: {
        projectId_apiName_componentType: {
          projectId,
          apiName: fieldApiName,
          componentType: "FIELD",
        },
      },
      create: {
        projectId,
        apiName: fieldApiName,
        label: field.label,
        componentType: "FIELD",
        parentComponentId,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        label: field.label,
        parentComponentId,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    })

    // Create relationship for lookup/masterDetail fields
    const relType = getRelationshipType(field.type)
    if (
      relType &&
      field.referenceTo &&
      Array.isArray(field.referenceTo) &&
      field.referenceTo.length > 0
    ) {
      for (const refTo of field.referenceTo) {
        // Find the target object's OrgComponent
        const targetComponent = await prisma.orgComponent.findFirst({
          where: {
            projectId,
            apiName: refTo as string,
            componentType: "OBJECT",
          },
        })

        if (targetComponent) {
          await prisma.orgRelationship.upsert({
            where: {
              sourceComponentId_targetComponentId_relationshipType: {
                sourceComponentId: fieldComponent.id,
                targetComponentId: targetComponent.id,
                relationshipType: relType,
              },
            },
            create: {
              projectId,
              sourceComponentId: fieldComponent.id,
              targetComponentId: targetComponent.id,
              relationshipType: relType,
            },
            update: {
              relationshipType: relType,
            },
          })
        }
      }
    }
  }
}

/**
 * Orchestrate metadata sync for all supported types.
 *
 * @param projectId - Project to sync
 * @param syncType - "FULL" processes all types, "INCREMENTAL" filters by lastModifiedDate
 * @returns Aggregate counts
 */
export async function syncMetadata(
  projectId: string,
  syncType: "FULL" | "INCREMENTAL"
): Promise<{
  added: number
  modified: number
  removed: number
  byType: Record<string, number>
}> {
  // Fetch project for sfOrgLastSyncAt
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { sfOrgLastSyncAt: true },
  })

  // Create sync run record
  const syncRun = await prisma.orgSyncRun.create({
    data: {
      projectId,
      syncType,
      status: "RUNNING",
    },
  })

  let totalAdded = 0
  let totalModified = 0
  let totalRemoved = 0
  const byType: Record<string, number> = {}

  try {
    const conn = await getSalesforceConnection(projectId)

    const sinceDate =
      syncType === "INCREMENTAL" && project.sfOrgLastSyncAt
        ? project.sfOrgLastSyncAt
        : undefined

    // Process each metadata type sequentially
    for (const typeConfig of SUPPORTED_METADATA_TYPES) {
      const counts = await syncMetadataType(
        conn,
        projectId,
        typeConfig,
        sinceDate
      )
      totalAdded += counts.added
      totalModified += counts.modified
      byType[typeConfig.type] = counts.added + counts.modified
    }

    // For FULL sync: mark unseen components as inactive (soft delete)
    if (syncType === "FULL") {
      const removeResult = await prisma.orgComponent.updateMany({
        where: {
          projectId,
          isActive: true,
          lastSyncedAt: {
            lt: syncRun.startedAt,
          },
        },
        data: { isActive: false },
      })
      totalRemoved = removeResult.count
    }

    // Update project last sync timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { sfOrgLastSyncAt: new Date() },
    })

    // Mark sync run as completed
    const componentCounts = {
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
      byType,
    }

    await prisma.orgSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "COMPLETED",
        componentCounts,
        completedAt: new Date(),
      },
    })

    return componentCounts
  } catch (error) {
    // Mark sync run as failed
    await prisma.orgSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    })

    throw error
  }
}
