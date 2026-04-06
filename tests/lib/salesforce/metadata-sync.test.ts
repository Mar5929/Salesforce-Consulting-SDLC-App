/**
 * Metadata Sync Module Tests
 *
 * Tests the core metadata sync logic: fetching Salesforce metadata,
 * upserting OrgComponent records, handling incremental vs full sync,
 * field description for CustomObject, and relationship creation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockConnection } from "../../fixtures/salesforce-mocks"

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    orgSyncRun: {
      create: vi.fn().mockResolvedValue({
        id: "sync-run-1",
        startedAt: new Date("2024-01-01T00:00:00Z"),
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    orgComponent: {
      upsert: vi.fn().mockResolvedValue({ id: "comp-1" }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn().mockResolvedValue({ id: "parent-comp-1" }),
    },
    orgRelationship: {
      upsert: vi.fn().mockResolvedValue({ id: "rel-1" }),
    },
    project: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "project-1",
        sfOrgLastSyncAt: new Date("2024-01-01T00:00:00Z"),
      }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Mock getSalesforceConnection
vi.mock("@/lib/salesforce/client", () => ({
  getSalesforceConnection: vi.fn(),
}))

import { syncMetadataType, syncMetadata } from "@/lib/salesforce/metadata-sync"
import { prisma } from "@/lib/db"
import { getSalesforceConnection } from "@/lib/salesforce/client"

describe("syncMetadataType", () => {
  let mockConn: ReturnType<typeof createMockConnection>

  beforeEach(() => {
    vi.clearAllMocks()
    mockConn = createMockConnection()
  })

  it("creates correct OrgComponent records for OBJECT type", async () => {
    mockConn.metadata.list.mockResolvedValue([
      {
        fullName: "Account",
        type: "CustomObject",
        lastModifiedDate: "2024-06-01T00:00:00.000Z",
      },
      {
        fullName: "Contact",
        type: "CustomObject",
        lastModifiedDate: "2024-06-02T00:00:00.000Z",
      },
    ])

    const result = await syncMetadataType(
      mockConn as never,
      "project-1",
      { type: "CustomObject", describeFields: false },
      undefined
    )

    expect(mockConn.metadata.list).toHaveBeenCalledWith([
      { type: "CustomObject" },
    ])
    expect(prisma.orgComponent.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.orgComponent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId_apiName_componentType: {
            projectId: "project-1",
            apiName: "Account",
            componentType: "OBJECT",
          },
        },
        create: expect.objectContaining({
          projectId: "project-1",
          apiName: "Account",
          componentType: "OBJECT",
          isActive: true,
        }),
        update: expect.objectContaining({
          isActive: true,
        }),
      })
    )
    expect(result.added + result.modified).toBe(2)
  })

  it("creates FIELD child components when describeFields=true", async () => {
    mockConn.metadata.list.mockResolvedValue([
      {
        fullName: "Account",
        type: "CustomObject",
        lastModifiedDate: "2024-06-01T00:00:00.000Z",
      },
    ])

    // Mock sobject describe for field fetching
    mockConn.sobject.mockReturnValue({
      describe: vi.fn().mockResolvedValue({
        name: "Account",
        label: "Account",
        fields: [
          { name: "Name", type: "string", label: "Account Name", referenceTo: [] },
          {
            name: "ParentId",
            type: "reference",
            label: "Parent Account",
            referenceTo: ["Account"],
            relationshipName: "Parent",
          },
        ],
      }),
    })

    // Return the parent component on findFirst
    vi.mocked(prisma.orgComponent.findFirst).mockResolvedValue({
      id: "parent-comp-1",
    } as never)

    const result = await syncMetadataType(
      mockConn as never,
      "project-1",
      { type: "CustomObject", describeFields: true },
      undefined
    )

    // Object + 2 fields = 3 upserts
    expect(prisma.orgComponent.upsert).toHaveBeenCalledTimes(3)

    // Verify field component was created
    expect(prisma.orgComponent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId_apiName_componentType: {
            projectId: "project-1",
            apiName: "Account.Name",
            componentType: "FIELD",
          },
        },
        create: expect.objectContaining({
          componentType: "FIELD",
          label: "Account Name",
        }),
      })
    )

    // Verify lookup relationship was created for ParentId
    expect(prisma.orgRelationship.upsert).toHaveBeenCalled()
  })

  it("applies 5-minute buffer to sinceDate for incremental sync", async () => {
    const sinceDate = new Date("2024-06-01T12:00:00.000Z")
    const expectedBuffered = new Date(
      sinceDate.getTime() - 5 * 60 * 1000
    )

    mockConn.metadata.list.mockResolvedValue([
      {
        fullName: "Account",
        type: "CustomObject",
        lastModifiedDate: "2024-06-01T12:05:00.000Z", // After buffer
      },
      {
        fullName: "Contact",
        type: "CustomObject",
        lastModifiedDate: "2024-06-01T11:50:00.000Z", // Before buffer - should be filtered
      },
    ])

    await syncMetadataType(
      mockConn as never,
      "project-1",
      { type: "CustomObject", describeFields: false },
      sinceDate
    )

    // Only Account should be processed (Contact is before the buffered date)
    expect(prisma.orgComponent.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.orgComponent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId_apiName_componentType: {
            projectId: "project-1",
            apiName: "Account",
            componentType: "OBJECT",
          },
        },
      })
    )
  })
})

describe("syncMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockConn = createMockConnection()
    mockConn.metadata.list.mockResolvedValue([])
    vi.mocked(getSalesforceConnection).mockResolvedValue(mockConn as never)
  })

  it("marks unseen components as isActive=false during full sync", async () => {
    vi.mocked(prisma.project.findUniqueOrThrow).mockResolvedValue({
      id: "project-1",
      sfOrgLastSyncAt: null,
    } as never)

    const result = await syncMetadata("project-1", "FULL")

    // Should mark old components as inactive
    expect(prisma.orgComponent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: "project-1",
          isActive: true,
        }),
        data: { isActive: false },
      })
    )

    // OrgSyncRun should be created and completed
    expect(prisma.orgSyncRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "project-1",
          syncType: "FULL",
          status: "RUNNING",
        }),
      })
    )

    expect(prisma.orgSyncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
        }),
      })
    )

    expect(result).toHaveProperty("added")
    expect(result).toHaveProperty("modified")
    expect(result).toHaveProperty("removed")
  })

  it("uses sinceDate for incremental sync", async () => {
    const lastSync = new Date("2024-06-01T00:00:00Z")
    vi.mocked(prisma.project.findUniqueOrThrow).mockResolvedValue({
      id: "project-1",
      sfOrgLastSyncAt: lastSync,
    } as never)

    await syncMetadata("project-1", "INCREMENTAL")

    // Should NOT mark components as inactive for incremental sync
    expect(prisma.orgComponent.updateMany).not.toHaveBeenCalled()

    // Should have created and completed sync run
    expect(prisma.orgSyncRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          syncType: "INCREMENTAL",
          status: "RUNNING",
        }),
      })
    )
  })

  it("marks sync run as FAILED on error", async () => {
    vi.mocked(getSalesforceConnection).mockRejectedValue(
      new Error("Connection failed")
    )

    await expect(syncMetadata("project-1", "FULL")).rejects.toThrow(
      "Connection failed"
    )

    expect(prisma.orgSyncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: expect.stringContaining("Connection failed"),
        }),
      })
    )
  })
})
