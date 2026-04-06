/**
 * Tests for Context Assembly (Layer 3)
 *
 * Tests context loaders that fetch project-scoped data and shape it
 * for AI consumption within token budgets.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockScopedPrisma, type MockPrismaClient } from "../../helpers/mock-prisma"

// Mock project-scope and db modules before imports
vi.mock("@/lib/project-scope", () => ({
  scopedPrisma: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    questionBlocksStory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    questionBlocksEpic: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    questionBlocksFeature: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

import { scopedPrisma } from "@/lib/project-scope"
import { prisma } from "@/lib/db"
import { getProjectSummary } from "@/lib/agent-harness/context/project-summary"
import { getOpenQuestions, getQuestionContext } from "@/lib/agent-harness/context/questions"
import { getRecentDecisions } from "@/lib/agent-harness/context/decisions"
import {
  getArticleSummaries,
  getRelevantArticles,
} from "@/lib/agent-harness/context/article-summaries"
import { getBlockingRelationships } from "@/lib/agent-harness/context/blocking-relationships"
import { getEpicsAndFeatures } from "@/lib/agent-harness/context/epics-features"
import { assembleContext, type ContextLoader } from "@/lib/agent-harness/context/index"

const PROJECT_ID = "test-project-id"

describe("Context Assembly (Layer 3)", () => {
  let mockScoped: MockPrismaClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockScoped = createMockScopedPrisma(PROJECT_ID)
    vi.mocked(scopedPrisma).mockReturnValue(mockScoped as unknown as ReturnType<typeof scopedPrisma>)
  })

  describe("getProjectSummary", () => {
    it("returns structured project summary with team count and dates", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: PROJECT_ID,
        name: "Acme CRM Migration",
        clientName: "Acme Corp",
        engagementType: "GREENFIELD",
        currentPhase: "DISCOVERY",
        startDate: new Date("2026-01-15"),
        targetEndDate: new Date("2026-06-30"),
        _count: { members: 5 },
      } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

      const result = await getProjectSummary(PROJECT_ID)

      expect(result).toContain("Acme CRM Migration")
      expect(result).toContain("Acme Corp")
      expect(result).toContain("GREENFIELD")
      expect(result).toContain("DISCOVERY")
      expect(result).toContain("5")
      expect(result).toContain("2026-01-15")
    })

    it("handles missing project gracefully", async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const result = await getProjectSummary(PROJECT_ID)

      expect(result).toContain("not found")
    })
  })

  describe("getOpenQuestions", () => {
    it("returns questions filtered by non-REVIEWED status with truncation", async () => {
      const longText = "A".repeat(300)
      mockScoped.question.findMany.mockResolvedValue([
        {
          id: "q1",
          displayId: "Q-001",
          questionText: longText,
          status: "OPEN",
          scope: "PROJECT",
          answerText: null,
          category: null,
        },
        {
          id: "q2",
          displayId: "Q-002",
          questionText: "Short question?",
          status: "ANSWERED",
          scope: "EPIC",
          answerText: "Yes",
          category: "TECHNICAL",
        },
      ])

      const result = await getOpenQuestions(PROJECT_ID)

      expect(result).toHaveLength(2)
      expect(result[0].displayId).toBe("Q-001")
      // Question text should be truncated to ~200 chars
      expect(result[0].questionText.length).toBeLessThanOrEqual(210)
      expect(result[1].displayId).toBe("Q-002")
      expect(result[1].answerText).toBe("Yes")
    })

    it("respects limit parameter", async () => {
      mockScoped.question.findMany.mockResolvedValue([])

      await getOpenQuestions(PROJECT_ID, 5)

      expect(mockScoped.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })
  })

  describe("getQuestionContext", () => {
    it("returns single question with linked entities", async () => {
      mockScoped.question.findUnique.mockResolvedValue({
        id: "q1",
        displayId: "Q-001",
        questionText: "How does the approval process work?",
        status: "OPEN",
        scope: "EPIC",
        answerText: null,
        impactAssessment: null,
        scopeEpic: { id: "e1", name: "Sales Pipeline", prefix: "SP" },
        scopeFeature: null,
        questionBlocksStories: [{ story: { id: "s1", displayId: "S-001", title: "Create approval flow" } }],
        questionBlocksEpics: [],
        questionBlocksFeatures: [],
        decisionQuestions: [{ decision: { id: "d1", displayId: "D-001", title: "Use standard approvals" } }],
      })

      const result = await getQuestionContext(PROJECT_ID, "q1")

      expect(result).not.toBeNull()
      expect(result!.displayId).toBe("Q-001")
      expect(result!.blockedEntities).toHaveLength(1)
      expect(result!.relatedDecisions).toHaveLength(1)
    })
  })

  describe("getRecentDecisions", () => {
    it("returns decisions ordered by recency with truncated rationale", async () => {
      const longRationale = "R".repeat(500)
      mockScoped.decision.findMany.mockResolvedValue([
        {
          id: "d1",
          displayId: "D-001",
          title: "Use Lightning Web Components",
          rationale: longRationale,
          decisionDate: new Date("2026-03-01"),
        },
      ])

      const result = await getRecentDecisions(PROJECT_ID)

      expect(result).toHaveLength(1)
      expect(result[0].displayId).toBe("D-001")
      expect(result[0].title).toBe("Use Lightning Web Components")
      // Rationale should be truncated
      expect(result[0].rationale.length).toBeLessThanOrEqual(310)
    })

    it("respects limit parameter", async () => {
      mockScoped.decision.findMany.mockResolvedValue([])

      await getRecentDecisions(PROJECT_ID, 5)

      expect(mockScoped.decision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })
  })

  describe("getArticleSummaries (two-pass retrieval - pass 1)", () => {
    it("returns article titles and summary excerpts for non-stale articles", async () => {
      mockScoped.knowledgeArticle.findMany.mockResolvedValue([
        {
          id: "a1",
          title: "Salesforce Data Migration Best Practices",
          summary: "Comprehensive guide to data migration including...",
          articleType: "PROCESS_DOCUMENTATION",
          confidence: "HIGH",
          isStale: false,
        },
        {
          id: "a2",
          title: "Approval Process Architecture",
          summary: "Detailed architecture for multi-level approval...",
          articleType: "TECHNICAL_REFERENCE",
          confidence: "MEDIUM",
          isStale: false,
        },
      ])

      const result = await getArticleSummaries(PROJECT_ID)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("a1")
      expect(result[0].title).toBe("Salesforce Data Migration Best Practices")
      expect(result[0].summary).toBeDefined()
    })
  })

  describe("getRelevantArticles (two-pass retrieval - pass 2)", () => {
    it("returns full content for specified article IDs", async () => {
      const fullContent = "Full article content with detailed instructions..."
      mockScoped.knowledgeArticle.findMany.mockResolvedValue([
        {
          id: "a1",
          title: "Salesforce Data Migration Best Practices",
          content: fullContent,
          summary: "Migration guide",
          articleType: "PROCESS_DOCUMENTATION",
          confidence: "HIGH",
        },
      ])

      const result = await getRelevantArticles(PROJECT_ID, ["a1"])

      expect(result).toHaveLength(1)
      expect(result[0].content).toBe(fullContent)
    })

    it("returns empty array when no IDs provided", async () => {
      const result = await getRelevantArticles(PROJECT_ID, [])
      expect(result).toEqual([])
    })
  })

  describe("getBlockingRelationships", () => {
    it("returns questions blocking stories, epics, and features", async () => {
      vi.mocked(prisma.questionBlocksStory.findMany).mockResolvedValue([
        {
          id: "qbs1",
          questionId: "q1",
          storyId: "s1",
          question: { id: "q1", displayId: "Q-001", questionText: "How does approval work?", status: "OPEN" },
          story: { id: "s1", displayId: "S-001", title: "Create approval flow" },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.questionBlocksStory.findMany>>)

      vi.mocked(prisma.questionBlocksEpic.findMany).mockResolvedValue([
        {
          id: "qbe1",
          questionId: "q2",
          epicId: "e1",
          question: { id: "q2", displayId: "Q-002", questionText: "What is the data model?", status: "OPEN" },
          epic: { id: "e1", name: "Data Migration", prefix: "DM" },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.questionBlocksEpic.findMany>>)

      vi.mocked(prisma.questionBlocksFeature.findMany).mockResolvedValue([])

      const result = await getBlockingRelationships(PROJECT_ID)

      expect(result).toHaveLength(2)
      expect(result[0].questionDisplayId).toBe("Q-001")
      expect(result[0].blockedEntityType).toBe("Story")
      expect(result[0].blockedEntityDisplayId).toBe("S-001")
      expect(result[1].blockedEntityType).toBe("Epic")
    })
  })

  describe("getEpicsAndFeatures", () => {
    it("returns epics and features with displayId, title, and type", async () => {
      mockScoped.epic.findMany.mockResolvedValue([
        { id: "e1", prefix: "SP", name: "Sales Pipeline" },
        { id: "e2", prefix: "DM", name: "Data Migration" },
      ])
      mockScoped.feature.findMany.mockResolvedValue([
        { id: "f1", prefix: "SP-01", name: "Lead Management" },
      ])

      const result = await getEpicsAndFeatures(PROJECT_ID)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: "e1", displayId: "SP", title: "Sales Pipeline", type: "Epic" })
      expect(result[2]).toEqual({ id: "f1", displayId: "SP-01", title: "Lead Management", type: "Feature" })
    })
  })

  describe("assembleContext", () => {
    it("combines multiple loaders within token budget", async () => {
      const loader1: ContextLoader = {
        name: "summary",
        load: async () => "Project: Test Project\nClient: Test Client",
      }
      const loader2: ContextLoader = {
        name: "questions",
        load: async () => "Q-001: What is the data model?\nQ-002: How does auth work?",
      }

      const result = await assembleContext([loader1, loader2], PROJECT_ID, 10000)

      expect(result).toContain("Project: Test Project")
      expect(result).toContain("Q-001")
    })

    it("truncates output when exceeding token budget", async () => {
      const largeContent = "X".repeat(10000) // ~2500 tokens
      const loader: ContextLoader = {
        name: "large",
        load: async () => largeContent,
      }

      const result = await assembleContext([loader], PROJECT_ID, 500)

      // With budget of 500 tokens (~2000 chars), result should be truncated
      expect(result.length).toBeLessThan(largeContent.length)
    })

    it("runs loaders in parallel", async () => {
      let order: string[] = []
      const loader1: ContextLoader = {
        name: "first",
        load: async () => {
          order.push("first-start")
          await new Promise((r) => setTimeout(r, 10))
          order.push("first-end")
          return "first"
        },
      }
      const loader2: ContextLoader = {
        name: "second",
        load: async () => {
          order.push("second-start")
          await new Promise((r) => setTimeout(r, 10))
          order.push("second-end")
          return "second"
        },
      }

      await assembleContext([loader1, loader2], PROJECT_ID, 10000)

      // Both should start before either ends (parallel execution)
      expect(order.indexOf("first-start")).toBeLessThan(order.indexOf("first-end"))
      expect(order.indexOf("second-start")).toBeLessThan(order.indexOf("second-end"))
    })
  })
})
