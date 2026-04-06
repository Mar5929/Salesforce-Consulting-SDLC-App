/**
 * Burndown Computation Tests (SPRT-05)
 *
 * Tests the computeBurndown pure function for date calculations,
 * ideal line generation, and edge cases.
 *
 * Source module: src/lib/burndown.ts (created in Plan 05)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { computeBurndown } from "@/lib/burndown"
import type { BurndownStory } from "@/lib/burndown"

describe("computeBurndown", () => {
  beforeEach(() => {
    // Fix "today" to 2026-01-20 for deterministic tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-20T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return correct ideal line (linear from total to 0)", () => {
    const sprintStart = new Date("2026-01-15")
    const sprintEnd = new Date("2026-01-19") // 5 days (15,16,17,18,19)
    const stories: BurndownStory[] = [
      { storyPoints: 10, status: "IN_PROGRESS", updatedAt: new Date("2026-01-15") },
    ]

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    // Should have 5 data points (one per day)
    expect(result).toHaveLength(5)

    // Ideal line decreases linearly from 10 to 0
    expect(result[0].ideal).toBe(10)
    expect(result[result.length - 1].ideal).toBe(0)

    // Check intermediate points are decreasing
    for (let i = 1; i < result.length; i++) {
      expect(result[i].ideal).toBeLessThan(result[i - 1].ideal)
    }
  })

  it("should return null remaining for future days", () => {
    // Today is 2026-01-20; sprint ends 2026-01-25
    const sprintStart = new Date("2026-01-18")
    const sprintEnd = new Date("2026-01-25")
    const stories: BurndownStory[] = [
      { storyPoints: 5, status: "IN_PROGRESS", updatedAt: new Date("2026-01-18") },
    ]

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    // Days after today (2026-01-21 onward) should have null remaining
    const futureDays = result.filter((p) => new Date(p.date) > new Date("2026-01-20"))
    futureDays.forEach((point) => {
      expect(point.remaining).toBeNull()
    })

    // Days on or before today should have a number for remaining
    const pastDays = result.filter((p) => new Date(p.date) <= new Date("2026-01-20"))
    pastDays.forEach((point) => {
      expect(point.remaining).toBeTypeOf("number")
    })
  })

  it("should count completed stories by updatedAt date", () => {
    const sprintStart = new Date("2026-01-15")
    const sprintEnd = new Date("2026-01-19")
    const stories: BurndownStory[] = [
      { storyPoints: 5, status: "DONE", updatedAt: new Date("2026-01-16T10:00:00Z") },
      { storyPoints: 3, status: "DONE", updatedAt: new Date("2026-01-18T14:00:00Z") },
      { storyPoints: 2, status: "IN_PROGRESS", updatedAt: new Date("2026-01-15") },
    ]

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    // Total points = 10
    // Day 1 (Jan 15): remaining = 10 (nothing done yet)
    expect(result[0].remaining).toBe(10)

    // Day 2 (Jan 16): 5 points completed -> remaining = 5
    expect(result[1].remaining).toBe(5)

    // Day 3 (Jan 17): no change -> remaining = 5
    expect(result[2].remaining).toBe(5)

    // Day 4 (Jan 18): 3 more completed -> remaining = 2
    expect(result[3].remaining).toBe(2)

    // Day 5 (Jan 19): all in past (today is Jan 20) -> remaining = 2
    expect(result[4].remaining).toBe(2)
  })

  it("should handle zero total points (no division by zero)", () => {
    const sprintStart = new Date("2026-01-15")
    const sprintEnd = new Date("2026-01-17")
    const stories: BurndownStory[] = []

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    // Should not throw, ideal should all be 0
    expect(result).toHaveLength(3)
    result.forEach((point) => {
      expect(point.ideal).toBe(0)
    })
  })

  it("should handle single-day sprint", () => {
    const sprintStart = new Date("2026-01-15")
    const sprintEnd = new Date("2026-01-15")
    const stories: BurndownStory[] = [
      { storyPoints: 5, status: "DONE", updatedAt: new Date("2026-01-15T10:00:00Z") },
    ]

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    expect(result).toHaveLength(1)
    expect(result[0].ideal).toBe(0) // On last day, ideal is 0
  })

  it("should handle stories with null storyPoints (treated as 0)", () => {
    const sprintStart = new Date("2026-01-15")
    const sprintEnd = new Date("2026-01-17")
    const stories: BurndownStory[] = [
      { storyPoints: null, status: "IN_PROGRESS", updatedAt: new Date("2026-01-15") },
      { storyPoints: 5, status: "IN_PROGRESS", updatedAt: new Date("2026-01-15") },
    ]

    const result = computeBurndown(sprintStart, sprintEnd, stories)

    // Total should be 5 (null treated as 0)
    expect(result[0].ideal).toBe(5)
    expect(result[0].remaining).toBe(5)
  })
})
