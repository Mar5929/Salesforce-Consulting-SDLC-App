import { describe, it, expect } from "vitest"

describe("document-templates", () => {
  describe("DOCUMENT_TEMPLATES registry", () => {
    it.todo("contains 4 templates")
    it.todo("each template has id, name, description, sections, supportedFormats")
  })

  describe("getTemplate", () => {
    it.todo("returns template by id")
    it.todo("returns undefined for unknown id")
  })

  describe("discovery-report template", () => {
    it.todo("has documentType BRD")
    it.todo("supports DOCX and PDF formats")
    it.todo("has required executive-summary section")
  })

  describe("executive-brief template", () => {
    it.todo("has documentType PRESENTATION")
    it.todo("supports PPTX and PDF formats")
  })
})
