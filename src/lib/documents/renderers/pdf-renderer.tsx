/**
 * PDF Renderer
 *
 * Renders structured content into a branded PDF using @react-pdf/renderer.
 * Applies BRANDING_CONFIG per DOC-04: firm name header, footer text,
 * heading color, and font family.
 */

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { BrandingConfig } from "../branding"

export interface DocumentContent {
  title: string
  sections: Array<{ heading: string; body: string }>
}

function createStyles(branding: BrandingConfig) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 11,
      paddingTop: 60,
      paddingBottom: 60,
      paddingHorizontal: 50,
    },
    header: {
      position: "absolute",
      top: 20,
      right: 50,
      fontSize: 9,
      color: "#666666",
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 50,
      right: 50,
      fontSize: 8,
      color: "#999999",
      textAlign: "center",
    },
    titlePage: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      color: `#${branding.headingColor}`,
      marginBottom: 20,
      textAlign: "center",
    },
    firmName: {
      fontSize: 14,
      color: "#666666",
      marginBottom: 10,
    },
    date: {
      fontSize: 10,
      color: "#999999",
    },
    sectionHeading: {
      fontSize: 18,
      color: `#${branding.headingColor}`,
      marginBottom: 12,
      marginTop: 8,
    },
    bodyText: {
      fontSize: 11,
      lineHeight: 1.6,
      marginBottom: 8,
    },
  })
}

interface PdfDocumentProps {
  content: DocumentContent
  branding: BrandingConfig
}

function PdfDocument({ content, branding }: PdfDocumentProps) {
  const styles = createStyles(branding)
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document>
      {/* Title Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{branding.firmName}</Text>
        <View style={styles.titlePage}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.firmName}>{branding.firmName}</Text>
          <Text style={styles.date}>{generatedDate}</Text>
        </View>
        <Text style={styles.footer}>{branding.footerText}</Text>
      </Page>

      {/* Content Pages */}
      {content.sections.map((section) => (
        <Page key={section.heading} size="A4" style={styles.page}>
          <Text style={styles.header}>{branding.firmName}</Text>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          {section.body.split("\n").map((paragraph, idx) => (
            <Text key={idx} style={styles.bodyText}>
              {paragraph}
            </Text>
          ))}
          <Text style={styles.footer}>{branding.footerText}</Text>
        </Page>
      ))}
    </Document>
  )
}

/**
 * Render structured content to a PDF buffer.
 * Creates a title page with document title, firm name, and generation date.
 * Each section renders on its own page with heading and body text.
 * Header shows firm name, footer shows branding footerText.
 */
export async function renderPdf(
  content: DocumentContent,
  branding: BrandingConfig
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <PdfDocument content={content} branding={branding} />
  )
  return Buffer.from(buffer)
}
