import { useCallback, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import type { Course, Habit, RoadmapDoc, RoadmapPlan } from '../types'
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
    (name: string, courseId: string | null = null): Habit => {
      const habit: Habit = { id: makeId('habit'), name, courseId, marks: {} }
      dispatch({ type: 'ADD_HABIT', habit })
      return habit
    },
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
    cycleHabitMark,
    deleteHabit,
    addRoadmapDoc,
    updateRoadmapDoc,
    deleteRoadmapDoc,
  }
}
