import { describe, it, expect } from "vitest"
import { BRANDING_CONFIG } from "@/lib/documents/branding"
import type { BrandingConfig } from "@/lib/documents/branding"

describe("branding", () => {
  it("exports BRANDING_CONFIG with firmName", () => {
    expect(BRANDING_CONFIG.firmName).toBe("Salesforce Consulting")
  })

  it("exports BRANDING_CONFIG with headingColor as hex without #", () => {
    expect(BRANDING_CONFIG.headingColor).toBe("2563EB")
    expect(BRANDING_CONFIG.headingColor).not.toContain("#")
  })

  it("exports BRANDING_CONFIG with fontFamily", () => {
    expect(BRANDING_CONFIG.fontFamily).toBe("Calibri")
  })

  it("exports BrandingConfig type", () => {
    const config: BrandingConfig = BRANDING_CONFIG
    expect(config).toBeDefined()
    expect(config.accentColor).toBe("2563EB")
    expect(config.footerText).toBe("Confidential")
    expect(config.logoPath).toBeNull()
  })
})
