import type { AppData, Course, CourseModule, Habit, HabitCategory, RoadmapDoc, RoadmapPlan, Topic } from '../types'
import { cycleMark } from '../utils/habits'

export const initialData: AppData = {
  courses: [],
  roadmaps: {},
  habits: [],
  roadmapDocs: [],
  habitCategories: [],
}

export type Action =
  | { type: 'HYDRATE'; data: AppData }
  | { type: 'TOGGLE_TOPIC'; courseId: string; moduleId: string; topicId: string }
  | { type: 'ADD_COURSE'; course: Course }
  | { type: 'DELETE_COURSE'; courseId: string }
  | {
      type: 'UPDATE_COURSE'
      courseId: string
      patch: Partial<Pick<Course, 'name' | 'platform' | 'instructor' | 'categoryId' | 'startDate' | 'hoursPerDay' | 'weekdays'>>
    }
  | { type: 'SET_ROADMAP'; courseId: string; plan: RoadmapPlan }
  // `parentModuleId: null` (or omitted) adds/reorders directly under the course; a module id nests under that module instead.
  | { type: 'ADD_MODULE'; courseId: string; parentModuleId?: string | null; module: CourseModule }
  | { type: 'RENAME_MODULE'; courseId: string; moduleId: string; name: string }
  | { type: 'DELETE_MODULE'; courseId: string; moduleId: string }
  | { type: 'REORDER_MODULES'; courseId: string; parentModuleId?: string | null; orderedIds: string[] }
  // Replaces a course's whole module tree atomically — used when saving the
  // Roadmap Builder's form/text editors, which (like RoadmapDoc.outlineText)
  // build the full structure client-side before committing it in one shot.
  | { type: 'SET_COURSE_MODULES'; courseId: string; modules: CourseModule[] }
  | { type: 'ADD_TOPICS'; courseId: string; moduleId: string; topics: Topic[] }
  | { type: 'UPDATE_TOPIC'; courseId: string; moduleId: string; topicId: string; patch: Partial<Pick<Topic, 'name' | 'durationSeconds' | 'hours'>> }
  | { type: 'DELETE_TOPIC'; courseId: string; moduleId: string; topicId: string }
  | { type: 'REORDER_TOPICS'; courseId: string; moduleId: string; orderedIds: string[] }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'RENAME_HABIT'; habitId: string; name: string }
  | { type: 'SET_HABIT_CATEGORY'; habitId: string; categoryId: string | null }
  | { type: 'ARCHIVE_HABIT'; habitId: string; archived: boolean }
  | { type: 'REORDER_HABITS'; orderedIds: string[] }
  | { type: 'CYCLE_HABIT_MARK'; habitId: string; date: string }
  | { type: 'DELETE_HABIT'; habitId: string }
  | { type: 'ADD_HABIT_CATEGORY'; category: HabitCategory }
  | { type: 'RENAME_HABIT_CATEGORY'; categoryId: string; name: string }
  | { type: 'SET_HABIT_CATEGORY_COLOR'; categoryId: string; color: string }
  | { type: 'ARCHIVE_HABIT_CATEGORY'; categoryId: string; archived: boolean }
  | { type: 'REORDER_HABIT_CATEGORIES'; orderedIds: string[] }
  | { type: 'DELETE_HABIT_CATEGORY'; categoryId: string }
  | { type: 'ADD_ROADMAP_DOC'; doc: RoadmapDoc }
  | { type: 'UPDATE_ROADMAP_DOC'; id: string; patch: Partial<Omit<RoadmapDoc, 'id' | 'createdAt'>> }
  | { type: 'DELETE_ROADMAP_DOC'; id: string }

/** Reassigns `order` to each item's index in `orderedIds`, leaving items not listed untouched. */
function applyOrder<T extends { id: string; order: number }>(items: T[], orderedIds: string[]): T[] {
  const indexById = new Map(orderedIds.map((id, i) => [id, i]))
  return items.map((item) => (indexById.has(item.id) ? { ...item, order: indexById.get(item.id)! } : item))
}

/**
 * Course modules/topics don't carry an explicit `order` field — their
 * array position *is* the order — so reordering them means resorting the
 * array itself to match `orderedIds`, rather than stamping an order number
 * on each item the way `applyOrder` does for habits/categories. Anything
 * not named in `orderedIds` keeps its relative position, appended after.
 */
function reorderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const indexById = new Map(orderedIds.map((id, i) => [id, i]))
  return [...items].sort((a, b) => {
    const ai = indexById.get(a.id)
    const bi = indexById.get(b.id)
    if (ai === undefined && bi === undefined) return 0
    if (ai === undefined) return 1
    if (bi === undefined) return -1
    return ai - bi
  })
}

function mapCourse(courses: Course[], courseId: string, fn: (c: Course) => Course): Course[] {
  return courses.map((c) => (c.id !== courseId ? c : fn(c)))
}

/**
 * Finds a module anywhere in a (possibly nested, up to 3 levels under the
 * course) module tree and applies `fn` to it, leaving every other module
 * untouched. Replaces the old one-level-only `course.modules.map(...)` now
 * that `CourseModule.modules` lets sections contain sub-modules.
 */
function updateModuleTree(modules: CourseModule[], moduleId: string, fn: (m: CourseModule) => CourseModule): CourseModule[] {
  return modules.map((m) => {
    if (m.id === moduleId) return fn(m)
    if (!m.modules?.length) return m
    return { ...m, modules: updateModuleTree(m.modules, moduleId, fn) }
  })
}

function removeModuleFromTree(modules: CourseModule[], moduleId: string): CourseModule[] {
  return modules
    .filter((m) => m.id !== moduleId)
    .map((m) => (m.modules?.length ? { ...m, modules: removeModuleFromTree(m.modules, moduleId) } : m))
}

function mapModule(course: Course, moduleId: string, fn: (m: CourseModule) => CourseModule): Course {
  return { ...course, modules: updateModuleTree(course.modules, moduleId, fn) }
}

export function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'HYDRATE':
      return action.data

    case 'TOGGLE_TOPIC':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({
            ...m,
            topics: m.topics.map((t) => (t.id === action.topicId ? { ...t, done: !t.done } : t)),
          }))
        ),
      }

    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.course] }

    case 'DELETE_COURSE': {
      const roadmaps = { ...state.roadmaps }
      delete roadmaps[action.courseId]
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== action.courseId),
        roadmaps,
        habits: state.habits.filter((h) => h.courseId !== action.courseId),
      }
    }

    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) => ({ ...c, ...action.patch })),
      }

    case 'ADD_MODULE':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          action.parentModuleId == null
            ? { ...c, modules: [...c.modules, action.module] }
            : {
                ...c,
                modules: updateModuleTree(c.modules, action.parentModuleId, (m) => ({
                  ...m,
                  modules: [...(m.modules ?? []), action.module],
                })),
              }
        ),
      }

    case 'RENAME_MODULE':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({ ...m, name: action.name }))
        ),
      }

    case 'DELETE_MODULE':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) => ({
          ...c,
          modules: removeModuleFromTree(c.modules, action.moduleId),
        })),
      }

    case 'REORDER_MODULES':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          action.parentModuleId == null
            ? { ...c, modules: reorderByIds(c.modules, action.orderedIds) }
            : {
                ...c,
                modules: updateModuleTree(c.modules, action.parentModuleId, (m) => ({
                  ...m,
                  modules: reorderByIds(m.modules ?? [], action.orderedIds),
                })),
              }
        ),
      }

    case 'SET_COURSE_MODULES':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) => ({ ...c, modules: action.modules })),
      }

    case 'ADD_TOPICS':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({ ...m, topics: [...m.topics, ...action.topics] }))
        ),
      }

    case 'UPDATE_TOPIC':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({
            ...m,
            topics: m.topics.map((t) => (t.id !== action.topicId ? t : { ...t, ...action.patch })),
          }))
        ),
      }

    case 'DELETE_TOPIC':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({ ...m, topics: m.topics.filter((t) => t.id !== action.topicId) }))
        ),
      }

    case 'REORDER_TOPICS':
      return {
        ...state,
        courses: mapCourse(state.courses, action.courseId, (c) =>
          mapModule(c, action.moduleId, (m) => ({ ...m, topics: reorderByIds(m.topics, action.orderedIds) }))
        ),
      }

    case 'SET_ROADMAP':
      return { ...state, roadmaps: { ...state.roadmaps, [action.courseId]: action.plan } }

    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.habit] }

    case 'RENAME_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id !== action.habitId ? h : { ...h, name: action.name })),
      }

    case 'SET_HABIT_CATEGORY':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id !== action.habitId ? h : { ...h, categoryId: action.categoryId }
        ),
      }

    case 'ARCHIVE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id !== action.habitId ? h : { ...h, archived: action.archived })),
      }

    case 'REORDER_HABITS':
      return { ...state, habits: applyOrder(state.habits, action.orderedIds) }

    case 'CYCLE_HABIT_MARK':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id !== action.habitId
            ? h
            : { ...h, marks: { ...h.marks, [action.date]: cycleMark(h.marks[action.date]) } }
        ),
      }

    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.habitId) }

    case 'ADD_HABIT_CATEGORY':
      return { ...state, habitCategories: [...state.habitCategories, action.category] }

    case 'RENAME_HABIT_CATEGORY':
      return {
        ...state,
        habitCategories: state.habitCategories.map((c) =>
          c.id !== action.categoryId ? c : { ...c, name: action.name }
        ),
      }

    case 'SET_HABIT_CATEGORY_COLOR':
      return {
        ...state,
        habitCategories: state.habitCategories.map((c) =>
          c.id !== action.categoryId ? c : { ...c, color: action.color }
        ),
      }

    case 'ARCHIVE_HABIT_CATEGORY':
      return {
        ...state,
        habitCategories: state.habitCategories.map((c) =>
          c.id !== action.categoryId ? c : { ...c, archived: action.archived }
        ),
      }

    case 'REORDER_HABIT_CATEGORIES':
      return { ...state, habitCategories: applyOrder(state.habitCategories, action.orderedIds) }

    case 'DELETE_HABIT_CATEGORY':
      return {
        ...state,
        habitCategories: state.habitCategories.filter((c) => c.id !== action.categoryId),
        // Habits in a deleted category fall back to uncategorized rather than vanishing.
        habits: state.habits.map((h) =>
          h.categoryId !== action.categoryId ? h : { ...h, categoryId: null }
        ),
      }

    case 'ADD_ROADMAP_DOC':
      return { ...state, roadmapDocs: [...state.roadmapDocs, action.doc] }

    case 'UPDATE_ROADMAP_DOC':
      return {
        ...state,
        roadmapDocs: state.roadmapDocs.map((d) =>
          d.id !== action.id ? d : { ...d, ...action.patch, updatedAt: new Date().toISOString() }
        ),
      }

    case 'DELETE_ROADMAP_DOC':
      return { ...state, roadmapDocs: state.roadmapDocs.filter((d) => d.id !== action.id) }

    default:
      return state
  }
}
