/**
 * Word Document Renderer
 *
 * Renders structured content into a branded .docx file using the docx library.
 * Applies BRANDING_CONFIG per DOC-04: firm name header, footer text,
 * heading color, and font family.
 */

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Header,
  Footer,
  AlignmentType,
} from "docx"
import type { BrandingConfig } from "../branding"

export interface DocumentContent {
  title: string
  sections: Array<{ heading: string; body: string }>
}

/**
 * Render structured content to a Word document buffer.
 * Applies branding: firm name in header (right-aligned), footerText in footer (centered),
 * heading color and font from branding config.
 */
export async function renderDocx(
  content: DocumentContent,
  branding: BrandingConfig
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        heading1: {
          run: {
            font: branding.fontFamily,
            size: 28,
            color: branding.headingColor,
          },
        },
        document: {
          run: {
            font: branding.fontFamily,
            size: 24,
          },
        },
      },
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun(branding.firmName)],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun(branding.footerText)],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            text: content.title,
            heading: HeadingLevel.TITLE,
          }),
          ...content.sections.flatMap((section) => [
            new Paragraph({
              text: section.heading,
              heading: HeadingLevel.HEADING_1,
            }),
            ...section.body.split("\n").map(
              (line) =>
                new Paragraph({
                  children: [new TextRun(line)],
                })
            ),
          ]),
        ],
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
