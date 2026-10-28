// Pure helpers for /api/generate — kept framework/SDK-free so they're
// directly unit-testable without mocking the Anthropic client or Supabase.

// Free-plan limit: everyone is on the free plan today (no billing backend
// exists yet), so this is the only tier.
export const RATE_LIMIT_MAX_REQUESTS = 2
export const RATE_LIMIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 1 week, rolling

/** True once a user has made `RATE_LIMIT_MAX_REQUESTS` or more calls within the current window. */
export function isRateLimited(requestCountInWindow: number): boolean {
  return requestCountInWindow >= RATE_LIMIT_MAX_REQUESTS
}

const GOAL_MAX_LENGTH = 300

export interface GoalValidation {
  valid: boolean
  error?: string
}

/** Light validation on the user's free-text goal before it's sent to the model. */
export function validateGoal(goal: unknown): GoalValidation {
  if (typeof goal !== 'string') return { valid: false, error: 'goal must be a string.' }
  const trimmed = goal.trim()
  if (trimmed.length === 0) return { valid: false, error: 'Describe what you want to learn first.' }
  if (trimmed.length > GOAL_MAX_LENGTH) {
    return { valid: false, error: `Keep the goal under ${GOAL_MAX_LENGTH} characters.` }
  }
  return { valid: true }
}

/**
 * Models reliably follow "no markdown fences" instructions most of the
 * time, not all of the time — this strips a single wrapping ``` fence
 * (with or without a language tag) if the whole response turned out to
 * be one, rather than trusting the instruction alone.
 */
export function cleanGeneratedOutline(raw: string): string {
  let text = raw.trim()
  const fenceMatch = text.match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/)
  if (fenceMatch) {
    text = fenceMatch[1]
  }
  return text.trim()
}

export function buildSystemPrompt(): string {
  return `You turn a short learning goal into a study roadmap, written as an indented outline.

OUTPUT FORMAT (follow exactly):
- Indent with exactly 2 spaces per level. Never use tabs.
- Level 0 = the main topic (one line, usually just one of these).
- Level 1 = subtopics.
- Level 2 = modules.
- Level 3 = sub-modules (optional, only when a module genuinely needs breaking down further).
- Every leaf line (one with no lines indented under it) MUST end with a duration in parentheses: (2h), (45m), (3d), or (2w) — hours, minutes, days, or weeks.
- Container lines (topic/subtopic lines that have children under them) must NOT have a duration — their total is implied by their children.
- Keep names short and concrete (a real topic/module name, not a sentence).

EXAMPLE (for "learn data structures in 8 weeks, 1h/day"):
Data Structures & Algorithms
  Linear Structures
    Arrays (5h)
    Linked Lists (6h)
    Stacks & Queues (5h)
  Algorithms
    Sorting
      Bubble & Insertion Sort (2h)
      Merge & Quick Sort (3h)
    Searching (4h)
    Dynamic Programming (8h)

Make the total of all leaf durations roughly match the timeframe and pace the user describes (e.g. "8 weeks, 1h/day" is roughly 56 hours — don't pad or undershoot wildly). If no timeframe or pace is given, use your judgment for a reasonable, realistically-paced plan.

Respond with ONLY the outline text — no markdown code fences, no headings, no explanation before or after it.`
}

export function buildUserPrompt(goal: string): string {
  return `Learning goal: ${goal.trim()}`
}
