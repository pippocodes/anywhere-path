export interface Topic {
  id: string
  name: string
  hours: number
  done: boolean
  // Precise lecture duration in whole seconds — the Course Tracker's unit
  // of record (supports mm:ss / h:mm:ss). Optional so older saved topics
  // (which only ever had `hours`, a decimal) keep working unchanged: read
  // duration through `getTopicSeconds()` in utils/duration.ts, which falls
  // back to `hours * 3600` when this isn't set, rather than migrating
  // existing data.
  durationSeconds?: number
}

export interface CourseModule {
  id: string
  name: string
  topics: Topic[]
  // Nested sections/sub-modules — optional so the existing flat
  // CourseModule -> Topic[] shape (every course saved before this) keeps
  // working unchanged; read as `module.modules ?? []`. Capped at 3 levels
  // under the course itself (course -> section -> module -> sub-module) by
  // the UI/parser, not by this type.
  modules?: CourseModule[]
}

export interface Course {
  id: string
  name: string
  modules: CourseModule[]
  isCustom?: boolean
  // Optional metadata for the Course Tracker — e.g. "Udemy", "YouTube".
  platform?: string
  instructor?: string
  // References a HabitCategory id — courses and habits share one category
  // list (AppData.habitCategories). null/undefined = "Other"/uncategorized.
  categoryId?: string | null
  // Weekly-planner scheduling, set when a course is created/edited with a
  // start date + daily pace. Optional: a course with neither just has no
  // schedule yet (shows no planner section), same as RoadmapDoc's pattern.
  startDate?: string // YYYY-MM-DD
  hoursPerDay?: number
  weekdays?: number[] // 0=Sun..6=Sat
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
  // References a Plan id — a habit can be linked to a course OR a plan
  // (never both), set only at creation time via "Add from...". null = not
  // linked to a plan.
  planId: string | null
  categoryId: string | null // null = uncategorized (pre-dates categories, or deliberately unsorted)
  // Daily target time in seconds, shown next to the habit — pulled from the
  // linked course's/plan's hoursPerDay at creation time, or set manually for
  // a custom habit. null = no target (a plain tick-it-off habit).
  targetSeconds: number | null
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
  plans: Plan[]
}

// --- Roadmap Builder "plan how to finish something" (Step 3) ---

export type PlanSourceType = 'course' | 'ai' | 'custom'

/**
 * One flattened, schedulable unit of work inside a Plan. When the plan's
 * source is a course, each step is a snapshot of one leaf module's title
 * (ancestor path joined) and duration at the moment the plan was built or
 * last resynced — not a live reference, so the plan keeps working even if
 * the course is later edited or deleted (see Plan.sourceCourseId).
 */
export interface PlanStep {
  id: string
  title: string
  estimatedSeconds: number
  done: boolean
}

/**
 * A roadmap for *when/how* to finish something — distinct from the older
 * RoadmapDoc outline-text system (untouched, still its own saved-roadmap
 * list) and from the barely-used courseId-keyed RoadmapPlan above. Always
 * has its own flat `steps` list regardless of source, which is what gets
 * scheduled day-by-day; `sourceCourseId` is kept only so a course-sourced
 * plan can later be resynced on request, not for live binding.
 */
export interface Plan {
  id: string
  title: string
  categoryId: string | null
  sourceType: PlanSourceType
  sourceCourseId: string | null
  steps: PlanStep[]
  startDate: string // YYYY-MM-DD
  days: number
  hoursPerDay: number
  weekdays: number[] // 0=Sun..6=Sat
  createdAt: string
  updatedAt: string
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
