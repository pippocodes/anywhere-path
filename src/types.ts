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
