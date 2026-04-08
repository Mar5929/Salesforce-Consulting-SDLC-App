/**
 * Delete Tool Layer — All 10 mutable entities
 *
 * SECURITY: Every tool in this file has `needsApproval: true` (D-05 structural gate).
 * The AI SDK will NOT call execute() until the user explicitly clicks Confirm in the UI.
 * The execute handlers ALSO double-check role to prevent approval replay attacks (D-08, T-11-14).
 *
 * Scope isolation: scopedPrisma injects projectId into all where clauses so cross-project
 * deletion is structurally impossible (not just checked — impossible at query level).
 */

import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"
import { sanitizeToolInput } from "@/lib/agent-harness/sanitize"

/** Roles allowed to delete most entities */
const SA_PM = ["SOLUTION_ARCHITECT", "PM"] as const

export function deleteTools(projectId: string, _memberId: string, role: string) {
  const scoped = scopedPrisma(projectId)

  return {
    // -------------------------------------------------------------------------
    // delete_story
    // -------------------------------------------------------------------------
    delete_story: tool({
      description:
        "Delete a user story permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        storyId: z.string().describe("ID of the story to delete"),
        reason: z.string().describe("Why this story should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { storyId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete stories" }
          }
          const story = await scoped.story.findUnique({
            where: { id: storyId },
            select: { id: true, title: true, displayId: true },
          })
          if (!story) return { success: false, error: "Story not found" }
          await scoped.story.delete({ where: { id: storyId } })
          return { success: true, deleted: { id: storyId, displayId: story.displayId, title: story.title } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_epic
    // -------------------------------------------------------------------------
    delete_epic: tool({
      description:
        "Delete an epic permanently. WARNING: This will also delete all features and stories under this epic. Requires explicit user confirmation.",
      inputSchema: z.object({
        epicId: z.string().describe("ID of the epic to delete"),
        reason: z.string().describe("Why this epic should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { epicId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete epics" }
          }
          const epic = await scoped.epic.findUnique({
            where: { id: epicId },
            select: { id: true, name: true, prefix: true },
          })
          if (!epic) return { success: false, error: "Epic not found" }
          await scoped.epic.delete({ where: { id: epicId } })
          return { success: true, deleted: { id: epicId, name: epic.name, prefix: epic.prefix } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_feature
    // -------------------------------------------------------------------------
    delete_feature: tool({
      description:
        "Delete a feature permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        featureId: z.string().describe("ID of the feature to delete"),
        reason: z.string().describe("Why this feature should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { featureId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete features" }
          }
          const feature = await scoped.feature.findUnique({
            where: { id: featureId },
            select: { id: true, name: true, prefix: true },
          })
          if (!feature) return { success: false, error: "Feature not found" }
          await scoped.feature.delete({ where: { id: featureId } })
          return { success: true, deleted: { id: featureId, name: feature.name, prefix: feature.prefix } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_question
    // -------------------------------------------------------------------------
    delete_question: tool({
      description:
        "Delete a discovery question permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        questionId: z.string().describe("ID of the question to delete"),
        reason: z.string().describe("Why this question should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { questionId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete questions" }
          }
          const question = await scoped.question.findUnique({
            where: { id: questionId },
            select: { id: true, displayId: true, questionText: true },
          })
          if (!question) return { success: false, error: "Question not found" }
          await scoped.question.delete({ where: { id: questionId } })
          return { success: true, deleted: { id: questionId, displayId: question.displayId, title: question.questionText } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_decision
    // -------------------------------------------------------------------------
    delete_decision: tool({
      description:
        "Delete a project decision permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        decisionId: z.string().describe("ID of the decision to delete"),
        reason: z.string().describe("Why this decision should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { decisionId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete decisions" }
          }
          const decision = await scoped.decision.findUnique({
            where: { id: decisionId },
            select: { id: true, displayId: true, title: true },
          })
          if (!decision) return { success: false, error: "Decision not found" }
          await scoped.decision.delete({ where: { id: decisionId } })
          return { success: true, deleted: { id: decisionId, displayId: decision.displayId, title: decision.title } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_requirement
    // -------------------------------------------------------------------------
    delete_requirement: tool({
      description:
        "Delete a project requirement permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        requirementId: z.string().describe("ID of the requirement to delete"),
        reason: z.string().describe("Why this requirement should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { requirementId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete requirements" }
          }
          const requirement = await scoped.requirement.findUnique({
            where: { id: requirementId },
            select: { id: true, displayId: true, description: true },
          })
          if (!requirement) return { success: false, error: "Requirement not found" }
          await scoped.requirement.delete({ where: { id: requirementId } })
          return { success: true, deleted: { id: requirementId, displayId: requirement.displayId, title: requirement.description } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_risk
    // -------------------------------------------------------------------------
    delete_risk: tool({
      description:
        "Delete a project risk permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        riskId: z.string().describe("ID of the risk to delete"),
        reason: z.string().describe("Why this risk should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { riskId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete risks" }
          }
          const risk = await scoped.risk.findUnique({
            where: { id: riskId },
            select: { id: true, displayId: true, description: true },
          })
          if (!risk) return { success: false, error: "Risk not found" }
          await scoped.risk.delete({ where: { id: riskId } })
          return { success: true, deleted: { id: riskId, displayId: risk.displayId, title: risk.description } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_sprint
    // -------------------------------------------------------------------------
    delete_sprint: tool({
      description:
        "Delete a sprint permanently. PM-only action. Stories in this sprint will be unassigned, not deleted. Requires explicit user confirmation.",
      inputSchema: z.object({
        sprintId: z.string().describe("ID of the sprint to delete"),
        reason: z.string().describe("Why this sprint should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { sprintId, reason: _reason } = sanitizeToolInput(input)
        try {
          // Sprint deletion is PM-only (sprint ownership is PM-only per RESEARCH.md)
          if (role !== "PM") {
            return { success: false, error: "Only PMs can delete sprints" }
          }
          const sprint = await scoped.sprint.findUnique({
            where: { id: sprintId },
            select: { id: true, name: true },
          })
          if (!sprint) return { success: false, error: "Sprint not found" }
          await scoped.sprint.delete({ where: { id: sprintId } })
          return { success: true, deleted: { id: sprintId, name: sprint.name } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_defect
    // -------------------------------------------------------------------------
    delete_defect: tool({
      description:
        "Delete a defect record permanently. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        defectId: z.string().describe("ID of the defect to delete"),
        reason: z.string().describe("Why this defect should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { defectId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!SA_PM.includes(role as (typeof SA_PM)[number])) {
            return { success: false, error: "Insufficient permissions to delete defects" }
          }
          const defect = await scoped.defect.findUnique({
            where: { id: defectId },
            select: { id: true, displayId: true, title: true },
          })
          if (!defect) return { success: false, error: "Defect not found" }
          await scoped.defect.delete({ where: { id: defectId } })
          return { success: true, deleted: { id: defectId, displayId: defect.displayId, title: defect.title } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),

    // -------------------------------------------------------------------------
    // delete_test_case
    // -------------------------------------------------------------------------
    delete_test_case: tool({
      description:
        "Delete a test case permanently. Available to SA, PM, and QA roles. Requires explicit user confirmation. This action cannot be undone.",
      inputSchema: z.object({
        testCaseId: z.string().describe("ID of the test case to delete"),
        reason: z.string().describe("Why this test case should be deleted"),
      }),
      needsApproval: true,
      execute: async (input) => {
        const { testCaseId, reason: _reason } = sanitizeToolInput(input)
        try {
          if (!["SOLUTION_ARCHITECT", "PM", "QA"].includes(role)) {
            return { success: false, error: "Insufficient permissions to delete test cases" }
          }
          const testCase = await scoped.testCase.findUnique({
            where: { id: testCaseId },
            select: { id: true, title: true },
          })
          if (!testCase) return { success: false, error: "Test case not found" }
          await scoped.testCase.delete({ where: { id: testCaseId } })
          return { success: true, deleted: { id: testCaseId, title: testCase.title } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Delete failed" }
        }
      },
    }),
  }
}
