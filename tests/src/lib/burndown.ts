/**
 * Burndown Chart Computation
 *
 * Pure function that computes burndown data for sprint charts.
 * Calculates ideal line (linear) and actual remaining points
 * based on story completion dates.
 */

export interface BurndownStory {
  storyPoints: number | null
  status: string
  updatedAt: Date
}

export interface BurndownDataPoint {
  date: string
  ideal: number
  remaining: number | null
}

/**
 * Extract a UTC date key (YYYY-MM-DD) from a Date object.
 */
function utcDateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}

/**
 * Create a UTC midnight date from year/month/day.
 */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Compute burndown chart data for a sprint.
 *
 * @param sprintStart - Sprint start date
 * @param sprintEnd - Sprint end date
 * @param stories - Stories in the sprint with points, status, and updatedAt
 * @returns Array of data points with date, ideal line, and actual remaining
 */
export function computeBurndown(
  sprintStart: Date,
  sprintEnd: Date,
  stories: BurndownStory[]
): BurndownDataPoint[] {
  const totalPoints = stories.reduce(
    (sum, s) => sum + (s.storyPoints ?? 0),
    0
  )

  // Generate array of dates from start to end (inclusive), all UTC midnight
  const dates: Date[] = []
  const current = utcMidnight(sprintStart)
  const end = utcMidnight(sprintEnd)

  while (current <= end) {
    dates.push(new Date(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  const totalDays = dates.length
  const today = utcMidnight(new Date())

  // Pre-compute completed points by date
  // A story's points are "burned" on the day its updatedAt falls on (when status is DONE)
  const completedByDate = new Map<string, number>()
  for (const story of stories) {
    if (story.status === "DONE") {
      const key = utcDateKey(story.updatedAt)
      completedByDate.set(
        key,
        (completedByDate.get(key) ?? 0) + (story.storyPoints ?? 0)
      )
    }
  }

  let cumulativeCompleted = 0

  return dates.map((date, index) => {
    // Ideal line: linear from totalPoints to 0
    let ideal: number
    if (totalDays <= 1) {
      ideal = 0
    } else {
      ideal = totalPoints - (totalPoints * index) / (totalDays - 1)
    }

    // Round to avoid floating point noise
    ideal = Math.round(ideal * 100) / 100

    // Actual remaining: only compute for days up to and including today
    let remaining: number | null = null
    if (date <= today) {
      const dateKey = utcDateKey(date)
      cumulativeCompleted += completedByDate.get(dateKey) ?? 0
      remaining = totalPoints - cumulativeCompleted
    }

    return {
      date: utcDateKey(date),
      ideal,
      remaining,
    }
  })
}
