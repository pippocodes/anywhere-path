import type { AppData, Course, Habit, HabitCategory, RoadmapDoc, RoadmapPlan } from '../types'
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
  | { type: 'SET_ROADMAP'; courseId: string; plan: RoadmapPlan }
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

export function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'HYDRATE':
      return action.data

    case 'TOGGLE_TOPIC':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id !== action.courseId
            ? c
            : {
                ...c,
                modules: c.modules.map((m) =>
                  m.id !== action.moduleId
                    ? m
                    : {
                        ...m,
                        topics: m.topics.map((t) =>
                          t.id === action.topicId ? { ...t, done: !t.done } : t
                        ),
                      }
                ),
              }
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
