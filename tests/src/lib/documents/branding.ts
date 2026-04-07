/**
 * Firm Branding Configuration
 *
 * Hardcoded V1 branding config for document generation.
 * V2 will support per-firm customization via admin UI.
 *
 * Per D-05 from planning context.
 */

export interface BrandingConfig {
  firmName: string
  logoPath: string | null
  fontFamily: string
  headingColor: string
  accentColor: string
  footerText: string
}

export const BRANDING_CONFIG: BrandingConfig = {
  firmName: "Salesforce Consulting",
  logoPath: null, // V1: no logo file, text-only header
  fontFamily: "Calibri",
  headingColor: "2563EB",
  accentColor: "2563EB",
  footerText: "Confidential",
}
