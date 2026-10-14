import { describe, it, expect } from 'vitest'
import { appReducer, initialData } from './reducer'
import type { AppData, Course, HabitCategory } from '../types'

const category: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }
const course: Course = { id: 'course-1', name: 'Anatomy', modules: [], categoryId: category.id }

function stateWith(data: Partial<AppData>): AppData {
  return { ...initialData, ...data }
}

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
