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

export interface Habit {
  id: string
  name: string
  courseId: string | null
  marks: Record<string, HabitMark>
}

export interface AppData {
  courses: Course[]
  roadmaps: Record<string, RoadmapPlan>
  habits: Habit[]
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
