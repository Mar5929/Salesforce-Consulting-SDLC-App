/**
 * Sprint Intelligence Inngest Function
 *
 * Triggered by SPRINT_STORIES_CHANGED event when stories are assigned
 * or removed from a sprint. Performs two-phase analysis:
 *
 * Phase 1 (deterministic): Detect component-level overlaps between stories
 * Phase 2 (AI-powered): Analyze overlap significance and suggest dependency ordering
 *
 * Results are cached in Sprint.cachedAnalysis as JSON.
 * Sends NOTIFICATION_SEND event when conflicts are detected.
 *
 * Per D-15: Background intelligence function
 * Per D-17: Advisory only, not blocking gates
 * Per D-19: Triggered by sprint/stories-changed event
 * Per T-03-16: maxTokens 1500 cap on AI response
 */

import { inngest } from "../client"
import { EVENTS } from "../events"
import { prisma } from "@/lib/db"
import Anthropic from "@anthropic-ai/sdk"

interface SprintStoryData {
  id: string
  displayId: string
  title: string
  storyComponents: Array<{ componentName: string; impactType: string }>
}

interface OverlapEntry {
  componentName: string
  stories: Array<{ displayId: string; title: string; impactType: string }>
}

interface AnalysisResult {
  conflicts: Array<Record<string, unknown>>
  dependencies: Array<Record<string, unknown>>
}

export const sprintIntelligence = inngest.createFunction(
  {
    id: "sprint-intelligence",
    retries: 2,
    triggers: [{ event: EVENTS.SPRINT_STORIES_CHANGED }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { sprintId, projectId } = event.data as {
      sprintId: string
      projectId: string
    }

    // Step 1: Load sprint stories with components
    const sprintData: SprintStoryData[] = await step.run("load-sprint-data", async () => {
      const stories = await prisma.story.findMany({
        where: { sprintId, projectId },
        select: {
          id: true,
          displayId: true,
          title: true,
          storyComponents: {
            select: { componentName: true, impactType: true },
          },
        },
      })
      return stories
    })

    // Step 2: Find component overlaps (deterministic, no AI)
    const overlaps: OverlapEntry[] = await step.run("detect-overlaps", async () => {
      const componentMap: Record<
        string,
        Array<{ displayId: string; title: string; impactType: string }>
      > = {}
      for (const story of sprintData) {
        for (const comp of story.storyComponents) {
          if (!comp.componentName) continue
          if (!componentMap[comp.componentName])
            componentMap[comp.componentName] = []
          componentMap[comp.componentName].push({
            displayId: story.displayId,
            title: story.title,
            impactType: comp.impactType,
          })
        }
      }
      // Return only components appearing in 2+ stories
      return Object.entries(componentMap)
        .filter(([, stories]) => stories.length > 1)
        .map(([name, stories]) => ({ componentName: name, stories }))
    })

    if (overlaps.length === 0) {
      // No conflicts -- store empty result
      await step.run("store-empty-results", async () => {
        await prisma.sprint.update({
          where: { id: sprintId },
          data: {
            cachedAnalysis: {
              conflicts: [],
              dependencies: [],
              analyzedAt: new Date().toISOString(),
            },
          },
        })
      })
      return { conflicts: 0, dependencies: 0 }
    }

    // Step 3: AI analysis of overlaps (T-03-16: maxTokens 1500)
    const analysis: AnalysisResult = await step.run("ai-analysis", async () => {
      const anthropic = new Anthropic()
      const contextText = overlaps
        .map(
          (o) =>
            `Component "${o.componentName}": ${o.stories.map((s) => `${s.displayId} "${s.title}" (${s.impactType})`).join(", ")}`
        )
        .join("\n")

      const allStories = sprintData
        .map(
          (s) =>
            `${s.displayId}: "${s.title}" [${s.storyComponents.map((c) => `${c.componentName} (${c.impactType})`).join(", ")}]`
        )
        .join("\n")

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: 0.3,
        system:
          "You are a sprint planning advisor for a Salesforce project. Analyze component overlaps between user stories and provide conflict severity assessments and dependency ordering suggestions. Output valid JSON only.",
        messages: [
          {
            role: "user",
            content: `## Component Overlaps\n${contextText}\n\n## All Stories\n${allStories}\n\nAnalyze these overlaps. For each, rate severity (HIGH/MEDIUM/LOW) based on impact types:\n- HIGH: Both MODIFY same component, or one CREATEs and another DELETEs\n- MEDIUM: Both CREATE on same component (naming conflicts)\n- LOW: One MODIFIES and one CREATEs (likely compatible)\n\nThen suggest execution ordering for ALL stories.\n\nOutput JSON:\n{"conflicts": [{"storyADisplayId": "...", "storyBDisplayId": "...", "componentName": "...", "impactA": "...", "impactB": "...", "severity": "HIGH|MEDIUM|LOW", "reasoning": "..."}], "dependencies": [{"order": 1, "storyDisplayId": "...", "reasoning": "..."}]}`,
          },
        ],
      })

      const text =
        response.content[0].type === "text" ? response.content[0].text : ""
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { conflicts: [], dependencies: [] }
      return JSON.parse(jsonMatch[0]) as {
        conflicts: Array<Record<string, unknown>>
        dependencies: Array<Record<string, unknown>>
      }
    })

    // Step 4: Store results in Sprint.cachedAnalysis
    await step.run("store-results", async () => {
      const cachedAnalysis = {
        conflicts: (analysis.conflicts || []).map(
          (c: Record<string, unknown>, i: number) => ({
            id: `conflict-${i}`,
            storyA: { displayId: c.storyADisplayId as string, title: "" },
            storyB: { displayId: c.storyBDisplayId as string, title: "" },
            componentName: c.componentName as string,
            impactA: c.impactA as string,
            impactB: c.impactB as string,
            severity: (c.severity as string) || "MEDIUM",
            reasoning: (c.reasoning as string) || "",
            dismissed: false,
          })
        ),
        dependencies: (analysis.dependencies || []).map(
          (d: Record<string, unknown>) => ({
            order: d.order as number,
            storyDisplayId: d.storyDisplayId as string,
            storyTitle: "",
            reasoning: (d.reasoning as string) || "",
          })
        ),
        analyzedAt: new Date().toISOString(),
      }

      // Enrich with story titles from sprintData
      const titleMap = new Map(
        sprintData.map((s) => [s.displayId, s.title])
      )
      for (const conflict of cachedAnalysis.conflicts) {
        conflict.storyA.title = titleMap.get(conflict.storyA.displayId) || ""
        conflict.storyB.title = titleMap.get(conflict.storyB.displayId) || ""
      }
      for (const dep of cachedAnalysis.dependencies) {
        dep.storyTitle = titleMap.get(dep.storyDisplayId) || ""
      }

      await prisma.sprint.update({
        where: { id: sprintId },
        data: { cachedAnalysis },
      })

      // Send notification if conflicts detected (T-03-18: project-scoped)
      if (cachedAnalysis.conflicts.length > 0) {
        await inngest.send({
          name: EVENTS.NOTIFICATION_SEND,
          data: {
            projectId,
            type: "SPRINT_CONFLICT_DETECTED",
            entityType: "SPRINT",
            entityId: sprintId,
            title: `${cachedAnalysis.conflicts.length} component conflict(s) detected in sprint`,
            actorMemberId: "", // System-generated, no actor
          },
        })
      }
    })

    return {
      conflicts: analysis.conflicts?.length || 0,
      dependencies: analysis.dependencies?.length || 0,
    }
  }
)
