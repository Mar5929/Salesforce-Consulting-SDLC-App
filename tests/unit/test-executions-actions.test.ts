import { describe, it, expect } from "vitest"

describe("test-executions actions", () => {
  describe("createTestCase", () => {
    it.todo("creates test case with MANUAL source")
    it.todo("auto-calculates sortOrder")
    it.todo("validates title length 1-500")
  })

  describe("recordTestExecution", () => {
    it.todo("creates execution record with result and notes")
    it.todo("sends TEST_EXECUTION_RECORDED Inngest event")
    it.todo("sends notification to story assignee")
  })

  describe("getStoryTestCases", () => {
    it.todo("returns test cases with latest execution")
    it.todo("orders by sortOrder ascending")
  })
})
