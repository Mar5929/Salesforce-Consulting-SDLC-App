import { describe, it, expect } from "vitest"
import { auditLogFunction } from "@/lib/inngest/functions/audit-log"

describe("auditLogFunction", () => {
  it("is defined with id 'audit-log'", () => {
    expect(auditLogFunction).toBeDefined()
    expect(auditLogFunction.opts.id).toBe("audit-log")
  })

  it("has retries set to 3", () => {
    expect(auditLogFunction.opts.retries).toBe(3)
  })

  it('listens to "audit/sensitive-operation" event', () => {
    const triggers = auditLogFunction.opts.triggers
    expect(triggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: "audit/sensitive-operation" }),
      ])
    )
  })
})
