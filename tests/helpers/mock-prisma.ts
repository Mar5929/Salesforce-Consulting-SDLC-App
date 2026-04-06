import { vi } from "vitest"

/**
 * Creates a mock for a single Prisma model with all standard operations.
 */
function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "mock-id", ...data })),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "mock-id", ...data })),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({ id: "mock-id" }),
    count: vi.fn().mockResolvedValue(0),
  }
}

/**
 * Factory that returns a deeply-mocked Prisma client with all Phase 2 models.
 * Each model provides standard CRUD operations as vi.fn() mocks.
 */
export function createMockPrisma() {
  return {
    sessionLog: createModelMock(),
    question: createModelMock(),
    decision: createModelMock(),
    risk: createModelMock(),
    requirement: createModelMock(),
    transcript: createModelMock(),
    conversation: createModelMock(),
    chatMessage: createModelMock(),
    knowledgeArticle: createModelMock(),
    notification: createModelMock(),
    project: createModelMock(),
    projectMember: createModelMock(),
    epic: createModelMock(),
    feature: createModelMock(),
    story: createModelMock(),
    milestone: createModelMock(),
    sprint: createModelMock(),
    attachment: createModelMock(),
    generatedDocument: createModelMock(),
    storyComponent: createModelMock(),
    statusTransition: createModelMock(),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
      // If fn is an array, resolve all. If it's a function, call it with the mock client.
      if (Array.isArray(fn)) {
        return Promise.all(fn)
      }
      return fn(createMockPrisma())
    }),
  }
}

export type MockPrismaClient = ReturnType<typeof createMockPrisma>

/**
 * Creates a mock scoped Prisma client that wraps the mock with project-scoping.
 * Mirrors the scopedPrisma(projectId) pattern from src/lib/project-scope.ts.
 */
export function createMockScopedPrisma(_projectId?: string) {
  return createMockPrisma()
}
