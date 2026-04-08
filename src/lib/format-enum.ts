/**
 * Convert SCREAMING_SNAKE_CASE enum values to human-readable labels.
 * E.g., "BUILD_PHASE" -> "Build Phase", "NOT_STARTED" -> "Not Started"
 */
export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
