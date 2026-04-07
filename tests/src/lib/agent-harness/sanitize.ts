/**
 * Input Sanitization Module
 *
 * Sanitizes all string inputs from AI tool calls before they reach the database.
 * Prevents prompt injection via tool inputs and XSS via AI-generated content.
 *
 * Threat mitigation: T-02-01 (DOMPurify on ALL string inputs before DB write)
 */

import DOMPurify from "isomorphic-dompurify"

/**
 * Recursively sanitize all string values in a tool input object.
 * Runs DOMPurify.sanitize() on every string to strip HTML/script content.
 *
 * @param input - The tool input object from Claude's tool_use response
 * @returns A new object with all string values sanitized
 */
export function sanitizeToolInput<T extends Record<string, unknown>>(
  input: T
): T {
  return sanitizeValue(input) as T
}

/**
 * Sanitize an HTML string for safe rendering on the frontend.
 * Use this when displaying AI-generated content in React components.
 *
 * @param html - Raw HTML string from AI output
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}

/**
 * Recursively walk a value and sanitize all strings.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return DOMPurify.sanitize(value)
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }

  // Numbers, booleans, null, undefined pass through unchanged
  return value
}
