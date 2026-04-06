import { createId } from "@paralleldrive/cuid2"

const DEFAULT_DATE = new Date("2026-01-15")

/**
 * Factory function for mock Epic records.
 */
export function makeEpic(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    projectId: "project-1",
    name: "Test Epic",
    prefix: "TE",
    description: "A test epic",
    status: "NOT_STARTED" as const,
    sortOrder: 1,
    createdAt: DEFAULT_DATE,
    updatedAt: DEFAULT_DATE,
    ...overrides,
  }
}

/**
 * Factory function for mock Feature records.
 */
export function makeFeature(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    projectId: "project-1",
    epicId: "epic-1",
    prefix: "TF",
    name: "Test Feature",
    description: "A test feature",
    status: "NOT_STARTED" as const,
    sortOrder: 1,
    createdAt: DEFAULT_DATE,
    updatedAt: DEFAULT_DATE,
    ...overrides,
  }
}

/**
 * Factory function for mock Story records.
 */
export function makeStory(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    projectId: "project-1",
    epicId: "epic-1",
    featureId: null,
    sprintId: null,
    assigneeId: null,
    testAssigneeId: null,
    displayId: "TEST-1",
    title: "Test Story",
    persona: "As a user",
    description: "I want to test things",
    acceptanceCriteria: "Things work correctly",
    storyPoints: 3,
    priority: "MEDIUM" as const,
    status: "DRAFT" as const,
    dependencies: null,
    notes: null,
    sortOrder: 1,
    createdAt: DEFAULT_DATE,
    updatedAt: DEFAULT_DATE,
    ...overrides,
  }
}

/**
 * Factory function for mock Sprint records.
 */
export function makeSprint(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    projectId: "project-1",
    name: "Sprint 1",
    goal: "Complete initial work",
    startDate: new Date("2026-01-15"),
    endDate: new Date("2026-01-29"),
    status: "PLANNING" as const,
    createdAt: DEFAULT_DATE,
    updatedAt: DEFAULT_DATE,
    ...overrides,
  }
}

/**
 * Factory function for mock StoryComponent records.
 */
export function makeStoryComponent(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    storyId: "story-1",
    projectId: "project-1",
    orgComponentId: null,
    componentName: "Account",
    impactType: "MODIFY" as const,
    ...overrides,
  }
}

/**
 * Factory function for mock ProjectMember records.
 */
export function makeProjectMember(overrides: Record<string, unknown> = {}) {
  return {
    id: createId(),
    projectId: "project-1",
    clerkUserId: "user-1",
    displayName: "Test User",
    email: "test@example.com",
    role: "PM" as const,
    status: "ACTIVE" as const,
    joinedAt: DEFAULT_DATE,
    removedAt: null,
    ...overrides,
  }
}
