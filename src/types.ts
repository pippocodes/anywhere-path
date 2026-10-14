export interface Topic {
  id: string
  name: string
  hours: number
  done: boolean
}

export interface CourseModule {
  id: string
  name: string
  topics: Topic[]
}

export interface Course {
  id: string
  name: string
  modules: CourseModule[]
  isCustom?: boolean
}

export interface RoadmapPlan {
  courseId: string
  targetDays: number
  dailyHours: number
  totalHours: number
  option: 'direct' | 'A' | 'B'
}

// 0 = not done, 1 = partial, 2 = done
export type HabitMark = 0 | 1 | 2

export interface HabitCategory {
  id: string
  name: string
  color: string // hex swatch, e.g. "#ff4d6d"
  archived: boolean
  order: number
}

export interface Habit {
  id: string
  name: string
  courseId: string | null
  categoryId: string | null // null = uncategorized (pre-dates categories, or deliberately unsorted)
  marks: Record<string, HabitMark>
  archived: boolean
  order: number
}

export interface AppData {
  courses: Course[]
  roadmaps: Record<string, RoadmapPlan>
  habits: Habit[]
  roadmapDocs: RoadmapDoc[]
  habitCategories: HabitCategory[]
}

// --- Outline parser (indented-text roadmap input) ---

export type DurationUnit = 'm' | 'h' | 'd' | 'w'

export interface Duration {
  value: number
  unit: DurationUnit
}

/**
 * One line of a parsed outline. `level` is 0-3: topic, subtopic, module,
 * sub-module. `duration` is only ever set from an explicit `(2h)`-style
 * suffix on that line, or defaulted onto leaf nodes with a warning — it is
 * never set as a computed rollup (use `computeNodeMinutes` for that).
 */
export interface OutlineNode {
  id: string
  name: string
  level: number
  duration: Duration | null
  children: OutlineNode[]
  line: number
}

export interface OutlineError {
  line: number
  message: string
}

export interface OutlineWarning {
  line: number
  message: string
}

export interface ParseResult {
  nodes: OutlineNode[]
  errors: OutlineError[]
  warnings: OutlineWarning[]
}

/**
 * A saved roadmap written as indented outline text. `outlineText` is the
 * source of truth (what gets exported/edited); the node tree is re-derived
 * from it with `parseOutline` whenever it's needed rather than stored, so
 * there's only ever one place that can go stale.
 */
export interface RoadmapDoc {
  id: string
  title: string
  outlineText: string
  createdAt: string
  updatedAt: string
  // Scheduling settings, saved per roadmap so reopening one keeps its plan.
  // Optional: older saved roadmaps (or a doc that's never been scheduled)
  // simply fall back to sensible defaults wherever they're read.
  startDate?: string // YYYY-MM-DD
  hoursPerDay?: number
  weekdays?: number[] // 0=Sun..6=Sat
  // Leaf-node ids (see OutlineNode.id) checked off in the read-only view.
  // Ids are position-based and stable across reparses of unchanged text, so
  // this survives normal edits — only a restructure (reordering/adding
  // sibling nodes) can shift which node an id points at.
  completedPaths?: string[]
}
