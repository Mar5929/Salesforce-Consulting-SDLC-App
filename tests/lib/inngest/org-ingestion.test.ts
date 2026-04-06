/**
 * Org Ingestion Pipeline Tests (ORG-04)
 *
 * Tests the 4-phase brownfield ingestion pipeline:
 * Parse > Classify > Synthesize+Articulate > Finalize
 *
 * Mocks the agent harness executeTask to return predictable
 * domain groupings and business processes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrisma } from "../../helpers/mock-prisma"

// Mock prisma
const mockPrisma = createMockPrisma()
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}))

// Mock executeTask from agent harness
const mockExecuteTask = vi.fn()
vi.mock("@/lib/agent-harness/engine", () => ({
  executeTask: mockExecuteTask,
}))

// Mock Inngest client
vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((_config: unknown, _trigger: unknown, handler: unknown) => handler),
    send: vi.fn(),
  },
}))

describe("Org Ingestion Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Parse Step", () => {
    it("should group components by type correctly", async () => {
      const components = [
        { id: "c1", apiName: "Account", label: "Account", componentType: "OBJECT", isActive: true },
        { id: "c2", apiName: "Contact", label: "Contact", componentType: "OBJECT", isActive: true },
        { id: "c3", apiName: "AccountTrigger", label: "AccountTrigger", componentType: "APEX_TRIGGER", isActive: true },
        { id: "c4", apiName: "CaseFlow", label: "Case Flow", componentType: "FLOW", isActive: true },
      ]

      mockPrisma.orgComponent.findMany.mockResolvedValue(components)

      const { parseOrgComponents } = await import(
        "@/lib/inngest/functions/org-ingestion"
      )

      const result = await parseOrgComponents("project-1")

      expect(result.OBJECT).toHaveLength(2)
      expect(result.APEX_TRIGGER).toHaveLength(1)
      expect(result.FLOW).toHaveLength(1)
      expect(result.OBJECT[0]).toEqual({ id: "c1", apiName: "Account", label: "Account" })
    })
  })

  describe("Classify Step", () => {
    it("should create DomainGrouping records with isAiSuggested=true", async () => {
      const classifyOutput = JSON.stringify([
        {
          name: "Sales Pipeline",
          description: "Core sales objects and automation",
          componentApiNames: ["Account", "Contact"],
          confidence: 92,
        },
      ])

      mockExecuteTask.mockResolvedValue({
        output: classifyOutput,
        toolResults: [],
        tokenUsage: { input: 1000, output: 500 },
        cost: 0.01,
        sessionLogId: "session-1",
        iterations: 1,
      })

      mockPrisma.domainGrouping.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "dg-1", ...data })
      )
      mockPrisma.orgComponent.updateMany.mockResolvedValue({ count: 2 })

      const { classifyComponents } = await import(
        "@/lib/inngest/functions/org-ingestion"
      )

      const components = [
        { id: "c1", apiName: "Account", label: "Account" },
        { id: "c2", apiName: "Contact", label: "Contact" },
      ]

      const result = await classifyComponents("project-1", "user-1", { OBJECT: components })

      expect(mockPrisma.domainGrouping.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: "project-1",
          name: "Sales Pipeline",
          isAiSuggested: true,
          isConfirmed: false,
        }),
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Sales Pipeline")
    })
  })

  describe("Synthesize+Articulate Step", () => {
    it("should create BusinessProcess and BusinessProcessComponent records", async () => {
      const synthesizeOutput = JSON.stringify([
        {
          name: "Lead to Opportunity",
          description: "Sales conversion process",
          complexity: "MEDIUM",
          components: [
            { apiName: "Account", role: "primary data store", isRequired: true },
            { apiName: "Contact", role: "associated contact", isRequired: false },
          ],
          dependsOn: [],
        },
      ])

      mockExecuteTask.mockResolvedValue({
        output: synthesizeOutput,
        toolResults: [],
        tokenUsage: { input: 800, output: 400 },
        cost: 0.008,
        sessionLogId: "session-2",
        iterations: 1,
      })

      const domainGrouping = {
        id: "dg-1",
        projectId: "project-1",
        name: "Sales Pipeline",
        description: "Sales domain",
      }

      const orgComponents = [
        { id: "c1", apiName: "Account", label: "Account", componentType: "OBJECT" },
        { id: "c2", apiName: "Contact", label: "Contact", componentType: "OBJECT" },
      ]

      mockPrisma.orgComponent.findMany.mockResolvedValue(orgComponents)
      mockPrisma.businessProcess.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "bp-1", ...data })
      )
      mockPrisma.businessProcessComponent.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "bpc-1", ...data })
      )

      const { synthesizeBusinessProcesses } = await import(
        "@/lib/inngest/functions/org-ingestion"
      )

      await synthesizeBusinessProcesses("project-1", "user-1", [domainGrouping])

      // Check BusinessProcess created with isAiSuggested=true, isConfirmed=false
      expect(mockPrisma.businessProcess.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: "project-1",
          name: "Lead to Opportunity",
          domainGroupingId: "dg-1",
          isAiSuggested: true,
          isConfirmed: false,
          complexity: "MEDIUM",
        }),
      })

      // Check BusinessProcessComponent join records created
      expect(mockPrisma.businessProcessComponent.create).toHaveBeenCalledTimes(2)
      expect(mockPrisma.businessProcessComponent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessProcessId: "bp-1",
          orgComponentId: "c1",
          role: "primary data store",
          isRequired: true,
        }),
      })
    })

    it("should mark all AI-created records with isConfirmed=false", async () => {
      const synthesizeOutput = JSON.stringify([
        {
          name: "Case Resolution",
          description: "Support case handling",
          complexity: "HIGH",
          components: [{ apiName: "Case", role: "primary object", isRequired: true }],
          dependsOn: [],
        },
      ])

      mockExecuteTask.mockResolvedValue({
        output: synthesizeOutput,
        toolResults: [],
        tokenUsage: { input: 500, output: 300 },
        cost: 0.005,
        sessionLogId: "session-3",
        iterations: 1,
      })

      const domainGrouping = {
        id: "dg-2",
        projectId: "project-1",
        name: "Service Cloud",
        description: "Support domain",
      }

      mockPrisma.orgComponent.findMany.mockResolvedValue([
        { id: "c3", apiName: "Case", label: "Case", componentType: "OBJECT" },
      ])
      mockPrisma.businessProcess.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "bp-2", ...data })
      )
      mockPrisma.businessProcessComponent.create.mockResolvedValue({ id: "bpc-2" })

      const { synthesizeBusinessProcesses } = await import(
        "@/lib/inngest/functions/org-ingestion"
      )

      await synthesizeBusinessProcesses("project-1", "user-1", [domainGrouping])

      // Verify isConfirmed=false on all created records
      const bpCreateCall = mockPrisma.businessProcess.create.mock.calls[0][0]
      expect(bpCreateCall.data.isConfirmed).toBe(false)
      expect(bpCreateCall.data.isAiSuggested).toBe(true)
    })
  })
})
