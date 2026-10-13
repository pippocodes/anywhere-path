import type { AppData, Course, Habit, RoadmapDoc, RoadmapPlan } from '../types'
import { cycleMark } from '../utils/habits'

export const initialData: AppData = { courses: [], roadmaps: {}, habits: [], roadmapDocs: [] }

export type Action =
  | { type: 'HYDRATE'; data: AppData }
  | { type: 'TOGGLE_TOPIC'; courseId: string; moduleId: string; topicId: string }
  | { type: 'ADD_COURSE'; course: Course }
  | { type: 'DELETE_COURSE'; courseId: string }
  | { type: 'SET_ROADMAP'; courseId: string; plan: RoadmapPlan }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'CYCLE_HABIT_MARK'; habitId: string; date: string }
  | { type: 'DELETE_HABIT'; habitId: string }
  | { type: 'ADD_ROADMAP_DOC'; doc: RoadmapDoc }
  | { type: 'UPDATE_ROADMAP_DOC'; id: string; title: string; outlineText: string }
  | { type: 'DELETE_ROADMAP_DOC'; id: string }

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

    case 'ADD_ROADMAP_DOC':
      return { ...state, roadmapDocs: [...state.roadmapDocs, action.doc] }

    case 'UPDATE_ROADMAP_DOC':
      return {
        ...state,
        roadmapDocs: state.roadmapDocs.map((d) =>
          d.id !== action.id
            ? d
            : { ...d, title: action.title, outlineText: action.outlineText, updatedAt: new Date().toISOString() }
        ),
      }

    case 'DELETE_ROADMAP_DOC':
      return { ...state, roadmapDocs: state.roadmapDocs.filter((d) => d.id !== action.id) }

    default:
      return state
  }
}
