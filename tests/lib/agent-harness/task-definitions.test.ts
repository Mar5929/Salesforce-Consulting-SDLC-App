/**
 * Smoke Tests for Task Definitions (Layer 1)
 *
 * Verifies wiring, not AI behavior:
 * - Each task conforms to TaskDefinition interface
 * - Correct taskType, executionMode, ambiguityMode, maxIterations, maxRetries
 * - contextLoader is callable with mocked Prisma
 * - Tools match expected names
 * - transcriptProcessingTask.contextLoader calls getEpicsAndFeatures (TRNS-04)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockScopedPrisma } from "../../helpers/mock-prisma"

// Mock dependencies
vi.mock("@/lib/project-scope", () => ({
  scopedPrisma: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findUnique: vi.fn().mockResolvedValue({
        name: "Test Project",
        clientName: "Test Client",
        engagementType: "GREENFIELD",
        currentPhase: "DISCOVERY",
        startDate: new Date("2026-01-01"),
        targetEndDate: new Date("2026-06-30"),
        status: "ACTIVE",
        _count: { members: 3 },
      }),
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
import {
  transcriptProcessingTask,
  questionAnsweringTask,
  dashboardSynthesisTask,
} from "@/lib/agent-harness/tasks"
import type { TaskDefinition } from "@/lib/agent-harness/types"

const PROJECT_ID = "test-project-id"

function assertTaskDefinition(task: TaskDefinition): void {
  expect(task.taskType).toBeTruthy()
  expect(task.executionMode).toBeTruthy()
  expect(task.ambiguityMode).toBeTruthy()
  expect(task.systemPromptTemplate).toBeTruthy()
  expect(task.contextLoader).toBeTypeOf("function")
  expect(Array.isArray(task.tools)).toBe(true)
}

describe("Task Definitions (Layer 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockScoped = createMockScopedPrisma(PROJECT_ID)
    vi.mocked(scopedPrisma).mockReturnValue(mockScoped as unknown as ReturnType<typeof scopedPrisma>)
  })

  describe("transcriptProcessingTask", () => {
    it("conforms to TaskDefinition interface", () => {
      assertTaskDefinition(transcriptProcessingTask)
    })

    it("has correct configuration", () => {
      expect(transcriptProcessingTask.taskType).toBe("TRANSCRIPT_PROCESSING")
      expect(transcriptProcessingTask.executionMode).toBe("AGENT_LOOP")
      expect(transcriptProcessingTask.ambiguityMode).toBe("TASK_SESSION")
      expect(transcriptProcessingTask.maxIterations).toBe(10)
      expect(transcriptProcessingTask.maxRetries).toBe(3)
    })

    it("has correct tools", () => {
      const toolNames = transcriptProcessingTask.tools.map((t) => t.name)
      expect(toolNames).toContain("create_question")
      expect(toolNames).toContain("create_decision")
      expect(toolNames).toContain("create_requirement")
      expect(toolNames).toContain("create_risk")
      expect(toolNames).toHaveLength(4)
    })

    it("contextLoader is callable and returns ProjectContext", async () => {
      const input = { userMessage: "Process this transcript" }
      const result = await transcriptProcessingTask.contextLoader(input, PROJECT_ID)

      expect(result).toBeDefined()
      expect(result.projectSummary).toBeDefined()
      expect(result.questions).toBeDefined()
      expect(result.decisions).toBeDefined()
    })

    it("contextLoader calls getEpicsAndFeatures for TRNS-04 scope coverage", async () => {
      const mockScoped = createMockScopedPrisma(PROJECT_ID)
      vi.mocked(scopedPrisma).mockReturnValue(mockScoped as unknown as ReturnType<typeof scopedPrisma>)

      // Set up epics and features data
      mockScoped.epic.findMany.mockResolvedValue([
        { id: "e1", prefix: "SP", name: "Sales Pipeline" },
      ])
      mockScoped.feature.findMany.mockResolvedValue([
        { id: "f1", prefix: "SP-01", name: "Lead Management" },
      ])

      const input = { userMessage: "Process transcript" }
      const result = await transcriptProcessingTask.contextLoader(input, PROJECT_ID)

      // Verify epics/features were loaded (via scopedPrisma calls)
      expect(mockScoped.epic.findMany).toHaveBeenCalled()
      expect(mockScoped.feature.findMany).toHaveBeenCalled()

      // Verify the raw context includes epic/feature info for scope assignment
      expect(result.rawContext).toContain("Available Epics and Features")
      expect(result.rawContext).toContain("Sales Pipeline")
      expect(result.rawContext).toContain("Lead Management")
    })

    it("outputValidator validates non-empty output", () => {
      const validator = transcriptProcessingTask.outputValidator!
      expect(validator("Some output")).toEqual({ valid: true, errors: [] })
      expect(validator("").valid).toBe(false)
    })
  })

  describe("questionAnsweringTask", () => {
    it("conforms to TaskDefinition interface", () => {
      assertTaskDefinition(questionAnsweringTask)
    })

    it("has correct configuration", () => {
      expect(questionAnsweringTask.taskType).toBe("QUESTION_ANSWERING")
      expect(questionAnsweringTask.executionMode).toBe("SINGLE_TURN")
      expect(questionAnsweringTask.ambiguityMode).toBe("TASK_SESSION")
      expect(questionAnsweringTask.maxIterations).toBe(1)
    })

    it("has correct tools", () => {
      const toolNames = questionAnsweringTask.tools.map((t) => t.name)
      expect(toolNames).toContain("flag_conflict")
      expect(toolNames).toContain("update_question_status")
      expect(toolNames).toHaveLength(2)
    })

    it("contextLoader is callable and returns ProjectContext", async () => {
      const input = { userMessage: "Answer this question", entityId: "q1" }
      const result = await questionAnsweringTask.contextLoader(input, PROJECT_ID)

      expect(result).toBeDefined()
      expect(result.projectSummary).toBeDefined()
    })

    it("outputValidator checks for answer and impact sections", () => {
      const validator = questionAnsweringTask.outputValidator!
      expect(
        validator("### Answer\nHere is the answer\n### Impact Assessment\nMinor impact")
      ).toEqual({ valid: true, errors: [] })

      expect(validator("Just some text without structure").valid).toBe(false)
    })
  })

  describe("dashboardSynthesisTask", () => {
    it("conforms to TaskDefinition interface", () => {
      assertTaskDefinition(dashboardSynthesisTask)
    })

    it("has correct configuration", () => {
      expect(dashboardSynthesisTask.taskType).toBe("DASHBOARD_SYNTHESIS")
      expect(dashboardSynthesisTask.executionMode).toBe("SINGLE_TURN")
      expect(dashboardSynthesisTask.ambiguityMode).toBe("BACKGROUND")
      expect(dashboardSynthesisTask.maxIterations).toBe(1)
    })

    it("has no tools (pure text generation)", () => {
      expect(dashboardSynthesisTask.tools).toHaveLength(0)
    })

    it("contextLoader is callable and returns ProjectContext", async () => {
      const input = { userMessage: "Synthesize dashboard" }
      const result = await dashboardSynthesisTask.contextLoader(input, PROJECT_ID)

      expect(result).toBeDefined()
      expect(result.projectSummary).toBeDefined()
      expect(result.questions).toBeDefined()
      expect(result.rawContext).toBeDefined()
    })

    it("outputValidator checks for currentFocus and recommendedFocus", () => {
      const validator = dashboardSynthesisTask.outputValidator!
      expect(
        validator('{"currentFocus": "Focus on...", "recommendedFocus": "Next..."}')
      ).toEqual({ valid: true, errors: [] })

      expect(validator("No structured output").valid).toBe(false)
    })
  })
})
