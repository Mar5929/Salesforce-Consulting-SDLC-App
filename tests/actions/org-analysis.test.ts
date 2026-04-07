/**
 * Org Analysis Action Tests (ORG-04)
 *
 * Tests server actions for triggering ingestion and reviewing
 * AI-generated domain groupings and business processes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrisma } from "../helpers/mock-prisma"

// Set up mocks before imports
const mockPrisma = createMockPrisma()

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user-1" }),
}))

// Mock Inngest client
const mockInngestSend = vi.fn().mockResolvedValue({ ids: ["mock-event-id"] })
vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: mockInngestSend },
}))

describe("Org Analysis Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("triggerIngestion", () => {
    it("should send ORG_INGESTION_REQUESTED event when valid", async () => {
      // SA role member
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "SOLUTION_ARCHITECT",
      })
      // Org connected
      mockPrisma.project.findUnique.mockResolvedValue({
        sfOrgInstanceUrl: "https://test.salesforce.com",
      })
      // Components exist
      mockPrisma.orgComponent.count.mockResolvedValue(50)

      const { triggerIngestion } = await import("@/actions/org-analysis")
      const result = await triggerIngestion({ projectId: "project-1" })

      expect(mockInngestSend).toHaveBeenCalledWith({
        name: "org/ingestion-requested",
        data: {
          projectId: "project-1",
          userId: "user-1",
        },
      })
      expect(result?.data?.success).toBe(true)
    })

    it("should reject non-SA users", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue(null)

      const { triggerIngestion } = await import("@/actions/org-analysis")
      const result = await triggerIngestion({ projectId: "project-1" })

      expect(result?.serverError).toContain("Solution Architects")
      expect(mockInngestSend).not.toHaveBeenCalled()
    })
  })

  describe("confirmDomainGrouping", () => {
    it("should set isConfirmed=true", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "PM",
      })
      mockPrisma.domainGrouping.update.mockResolvedValue({
        id: "dg-1",
        isConfirmed: true,
      })

      const { confirmDomainGrouping } = await import("@/actions/org-analysis")
      const result = await confirmDomainGrouping({
        domainGroupingId: "dg-1",
        projectId: "project-1",
      })

      expect(mockPrisma.domainGrouping.update).toHaveBeenCalledWith({
        where: { id: "dg-1" },
        data: { isConfirmed: true },
      })
      expect(result?.data?.success).toBe(true)
    })
  })

  describe("rejectDomainGrouping", () => {
    it("should delete the domain grouping and unassign components", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "SOLUTION_ARCHITECT",
      })
      mockPrisma.orgComponent.updateMany.mockResolvedValue({ count: 3 })
      mockPrisma.domainGrouping.delete.mockResolvedValue({ id: "dg-1" })

      const { rejectDomainGrouping } = await import("@/actions/org-analysis")
      const result = await rejectDomainGrouping({
        domainGroupingId: "dg-1",
        projectId: "project-1",
      })

      // Should unassign components first
      expect(mockPrisma.orgComponent.updateMany).toHaveBeenCalledWith({
        where: { domainGroupingId: "dg-1" },
        data: { domainGroupingId: null },
      })

      // Then delete the grouping
      expect(mockPrisma.domainGrouping.delete).toHaveBeenCalledWith({
        where: { id: "dg-1" },
      })
      expect(result?.data?.success).toBe(true)
    })
  })

  describe("editDomainGrouping", () => {
    it("should update name/description and set isConfirmed=true", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "PM",
      })
      mockPrisma.domainGrouping.update.mockResolvedValue({
        id: "dg-1",
        name: "Updated Name",
        isConfirmed: true,
      })

      const { editDomainGrouping } = await import("@/actions/org-analysis")
      const result = await editDomainGrouping({
        domainGroupingId: "dg-1",
        projectId: "project-1",
        name: "Updated Name",
        description: "Updated description",
      })

      expect(mockPrisma.domainGrouping.update).toHaveBeenCalledWith({
        where: { id: "dg-1" },
        data: {
          name: "Updated Name",
          description: "Updated description",
          isConfirmed: true,
        },
      })
      expect(result?.data?.success).toBe(true)
    })
  })

  describe("confirmBusinessProcess", () => {
    it("should set isConfirmed=true on the business process", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "SOLUTION_ARCHITECT",
      })
      mockPrisma.businessProcess.update.mockResolvedValue({
        id: "bp-1",
        isConfirmed: true,
      })

      const { confirmBusinessProcess } = await import("@/actions/org-analysis")
      const result = await confirmBusinessProcess({
        businessProcessId: "bp-1",
        projectId: "project-1",
      })

      expect(mockPrisma.businessProcess.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: { isConfirmed: true },
      })
      expect(result?.data?.success).toBe(true)
    })
  })

  describe("rejectBusinessProcess", () => {
    it("should delete the business process", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "PM",
      })
      mockPrisma.businessProcess.delete.mockResolvedValue({ id: "bp-1" })

      const { rejectBusinessProcess } = await import("@/actions/org-analysis")
      const result = await rejectBusinessProcess({
        businessProcessId: "bp-1",
        projectId: "project-1",
      })

      expect(mockPrisma.businessProcess.delete).toHaveBeenCalledWith({
        where: { id: "bp-1" },
      })
      expect(result?.data?.success).toBe(true)
    })
  })

  describe("bulkConfirmHighConfidence", () => {
    it("should confirm all unconfirmed domain groupings", async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: "member-1",
        role: "SOLUTION_ARCHITECT",
      })
      mockPrisma.domainGrouping.updateMany.mockResolvedValue({ count: 5 })

      const { bulkConfirmHighConfidence } = await import("@/actions/org-analysis")
      const result = await bulkConfirmHighConfidence({
        projectId: "project-1",
        type: "domain",
      })

      expect(mockPrisma.domainGrouping.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: "project-1",
          isConfirmed: false,
        },
        data: { isConfirmed: true },
      })
      expect(result?.data?.confirmed).toBe(5)
    })
  })
})
