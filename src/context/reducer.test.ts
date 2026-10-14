import { describe, it, expect } from 'vitest'
import { appReducer, initialData } from './reducer'
import type { AppData, Course, Habit, HabitCategory } from '../types'

const category: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }
const course: Course = { id: 'course-1', name: 'Anatomy', modules: [], categoryId: category.id }

function stateWith(data: Partial<AppData>): AppData {
  return { ...initialData, ...data }
}

describe('DELETE_COURSE', () => {
  it('unlinks habits tied to the deleted course instead of deleting them', () => {
    const habit: Habit = { id: 'habit-1', name: 'Study anatomy', courseId: course.id, categoryId: null, marks: {}, archived: false, order: 0 }
    const state = stateWith({ courses: [course], habits: [habit] })
    const next = appReducer(state, { type: 'DELETE_COURSE', courseId: course.id })

    expect(next.courses).toHaveLength(0)
    expect(next.habits).toHaveLength(1)
    expect(next.habits[0].courseId).toBeNull()
  })

  it('leaves a habit linked to a different course untouched', () => {
    const habit: Habit = { id: 'habit-1', name: 'Study anatomy', courseId: 'course-2', categoryId: null, marks: {}, archived: false, order: 0 }
    const state = stateWith({ courses: [course], habits: [habit] })
    const next = appReducer(state, { type: 'DELETE_COURSE', courseId: course.id })

    expect(next.habits[0].courseId).toBe('course-2')
  })

  it('removes the course\'s legacy roadmap plan (it has no identity without the course)', () => {
    const state = stateWith({ courses: [course], roadmaps: { [course.id]: { courseId: course.id, targetDays: 5, dailyHours: 2, totalHours: 10, option: 'direct' } } })
    const next = appReducer(state, { type: 'DELETE_COURSE', courseId: course.id })

    expect(next.roadmaps[course.id]).toBeUndefined()
  })
})

describe('DELETE_HABIT_CATEGORY', () => {
  it('reassigns courses using the deleted category to uncategorized ("Other"), not just habits', () => {
    const state = stateWith({ habitCategories: [category], courses: [course] })
    const next = appReducer(state, { type: 'DELETE_HABIT_CATEGORY', categoryId: category.id })

    expect(next.habitCategories).toHaveLength(0)
    expect(next.courses[0].categoryId).toBeNull()
  })

  it('leaves a course in an unrelated category untouched', () => {
    const otherCourse: Course = { ...course, id: 'course-2', categoryId: 'cat-2' }
    const state = stateWith({ habitCategories: [category], courses: [course, otherCourse] })
    const next = appReducer(state, { type: 'DELETE_HABIT_CATEGORY', categoryId: category.id })

    expect(next.courses.find((c) => c.id === 'course-2')?.categoryId).toBe('cat-2')
  })
})
