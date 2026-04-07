/**
 * PowerPoint Renderer
 *
 * Renders structured content into a branded .pptx file using pptxgenjs.
 * Applies BRANDING_CONFIG per DOC-04: firm name subtitle, heading color,
 * accent color, and font family.
 */

import PptxGenJS from "pptxgenjs"
import type { BrandingConfig } from "../branding"

export interface DocumentContent {
  title: string
  sections: Array<{ heading: string; body: string }>
}

/**
 * Render structured content to a PowerPoint buffer.
 * Title slide uses branding.headingColor, firm name subtitle uses branding.accentColor.
 * Content slides have section heading (24pt bold) and body text (14pt).
 */
export async function renderPptx(
  content: DocumentContent,
  branding: BrandingConfig
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.author = branding.firmName
  pptx.layout = "LAYOUT_WIDE"

  // Title slide
  const titleSlide = pptx.addSlide()
  titleSlide.addText(content.title, {
    x: 1,
    y: 2,
    w: "80%",
    fontSize: 36,
    fontFace: branding.fontFamily,
    color: branding.headingColor,
  })
  titleSlide.addText(branding.firmName, {
    x: 1,
    y: 4,
    w: "80%",
    fontSize: 18,
    color: branding.accentColor,
  })

  // Content slides
  for (const section of content.sections) {
    const slide = pptx.addSlide()
    slide.addText(section.heading, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      fontSize: 24,
      fontFace: branding.fontFamily,
      color: branding.headingColor,
      bold: true,
    })
    slide.addText(section.body, {
      x: 0.5,
      y: 1.5,
      w: "90%",
      h: "70%",
      fontSize: 14,
      fontFace: branding.fontFamily,
      valign: "top",
    })
  }

  const arrayBuffer = (await pptx.write({
    outputType: "arraybuffer",
  })) as ArrayBuffer
  return Buffer.from(arrayBuffer)
}
