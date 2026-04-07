import { describe, it, expect } from "vitest"

describe("document-renderers", () => {
  describe("renderDocx", () => {
    it.todo("returns a Buffer")
    it.todo("applies branding firmName in header")
    it.todo("applies branding headingColor to headings")
    it.todo("renders title page with document title")
    it.todo("renders each section as a heading + body")
  })

  describe("renderPptx", () => {
    it.todo("returns a Buffer")
    it.todo("creates title slide with firmName")
    it.todo("creates content slides per section")
  })

  describe("renderPdf", () => {
    it.todo("returns a Buffer")
    it.todo("includes firm name in header")
    it.todo("includes Confidential in footer")
  })
})
