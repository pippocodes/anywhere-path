import { useCallback, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import type { Course, Habit, HabitCategory, RoadmapDoc, RoadmapPlan } from '../types'
import { makeId } from '../utils/id'

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  const { data, dispatch } = ctx

  const toggleTopic = useCallback(
    (courseId: string, moduleId: string, topicId: string) =>
      dispatch({ type: 'TOGGLE_TOPIC', courseId, moduleId, topicId }),
    [dispatch]
  )

  const addCourse = useCallback(
    (course: Course) => dispatch({ type: 'ADD_COURSE', course }),
    [dispatch]
  )

  const deleteCourse = useCallback(
    (courseId: string) => dispatch({ type: 'DELETE_COURSE', courseId }),
    [dispatch]
  )

  const setRoadmap = useCallback(
    (courseId: string, plan: RoadmapPlan) => dispatch({ type: 'SET_ROADMAP', courseId, plan }),
    [dispatch]
  )

  const addHabit = useCallback(
    (name: string, courseId: string | null = null, categoryId: string | null = null): Habit => {
      const order = data.habits.filter((h) => h.categoryId === categoryId).length
      const habit: Habit = { id: makeId('habit'), name, courseId, categoryId, marks: {}, archived: false, order }
      dispatch({ type: 'ADD_HABIT', habit })
      return habit
    },
    [dispatch, data.habits]
  )

  const renameHabit = useCallback(
    (habitId: string, name: string) => dispatch({ type: 'RENAME_HABIT', habitId, name }),
    [dispatch]
  )

  const setHabitCategory = useCallback(
    (habitId: string, categoryId: string | null) => dispatch({ type: 'SET_HABIT_CATEGORY', habitId, categoryId }),
    [dispatch]
  )

  const archiveHabit = useCallback(
    (habitId: string, archived = true) => dispatch({ type: 'ARCHIVE_HABIT', habitId, archived }),
    [dispatch]
  )

  const reorderHabits = useCallback(
    (orderedIds: string[]) => dispatch({ type: 'REORDER_HABITS', orderedIds }),
    [dispatch]
  )

  const cycleHabitMark = useCallback(
    (habitId: string, date: string) => dispatch({ type: 'CYCLE_HABIT_MARK', habitId, date }),
    [dispatch]
  )

  const deleteHabit = useCallback(
    (habitId: string) => dispatch({ type: 'DELETE_HABIT', habitId }),
    [dispatch]
  )

  const addHabitCategory = useCallback(
    (name: string, color: string): HabitCategory => {
      const order = data.habitCategories.length
      const category: HabitCategory = { id: makeId('habitcat'), name, color, archived: false, order }
      dispatch({ type: 'ADD_HABIT_CATEGORY', category })
      return category
    },
    [dispatch, data.habitCategories]
  )

  const renameHabitCategory = useCallback(
    (categoryId: string, name: string) => dispatch({ type: 'RENAME_HABIT_CATEGORY', categoryId, name }),
    [dispatch]
  )

  const setHabitCategoryColor = useCallback(
    (categoryId: string, color: string) => dispatch({ type: 'SET_HABIT_CATEGORY_COLOR', categoryId, color }),
    [dispatch]
  )

  const archiveHabitCategory = useCallback(
    (categoryId: string, archived = true) => dispatch({ type: 'ARCHIVE_HABIT_CATEGORY', categoryId, archived }),
    [dispatch]
  )

  const reorderHabitCategories = useCallback(
    (orderedIds: string[]) => dispatch({ type: 'REORDER_HABIT_CATEGORIES', orderedIds }),
    [dispatch]
  )

  const deleteHabitCategory = useCallback(
    (categoryId: string) => dispatch({ type: 'DELETE_HABIT_CATEGORY', categoryId }),
    [dispatch]
  )

  const addRoadmapDoc = useCallback(
    (fields: Omit<RoadmapDoc, 'id' | 'createdAt' | 'updatedAt'>): RoadmapDoc => {
      const now = new Date().toISOString()
      const doc: RoadmapDoc = { id: makeId('roadmapdoc'), createdAt: now, updatedAt: now, ...fields }
      dispatch({ type: 'ADD_ROADMAP_DOC', doc })
      return doc
    },
    [dispatch]
  )

  const updateRoadmapDoc = useCallback(
    (id: string, patch: Partial<Omit<RoadmapDoc, 'id' | 'createdAt'>>) =>
      dispatch({ type: 'UPDATE_ROADMAP_DOC', id, patch }),
    [dispatch]
  )

  const deleteRoadmapDoc = useCallback(
    (id: string) => dispatch({ type: 'DELETE_ROADMAP_DOC', id }),
    [dispatch]
  )

  return {
    data,
    toggleTopic,
    addCourse,
    deleteCourse,
    setRoadmap,
    addHabit,
    renameHabit,
    setHabitCategory,
    archiveHabit,
    reorderHabits,
    cycleHabitMark,
    deleteHabit,
    addHabitCategory,
    renameHabitCategory,
    setHabitCategoryColor,
    archiveHabitCategory,
    reorderHabitCategories,
    deleteHabitCategory,
    addRoadmapDoc,
    updateRoadmapDoc,
    deleteRoadmapDoc,
  }
}
