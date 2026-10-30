import { useCallback, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import type { Course, CourseModule, Habit, HabitCategory, HabitMark, Plan, RoadmapDoc, RoadmapPlan, Topic } from '../types'
import { makeId } from '../utils/id'
import { secondsToTopicFields } from '../utils/duration'

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

  const updateCourse = useCallback(
    (
      courseId: string,
      patch: Partial<Pick<Course, 'name' | 'platform' | 'instructor' | 'categoryId' | 'startDate' | 'hoursPerDay' | 'weekdays'>>
    ) => dispatch({ type: 'UPDATE_COURSE', courseId, patch }),
    [dispatch]
  )

  /** `parentModuleId` nests the new module under an existing one (up to 3 levels under the course); omitted/null adds it as a top-level section. */
  const addModule = useCallback(
    (courseId: string, name: string, parentModuleId?: string | null): CourseModule => {
      const module: CourseModule = { id: makeId('module'), name, topics: [] }
      dispatch({ type: 'ADD_MODULE', courseId, parentModuleId, module })
      return module
    },
    [dispatch]
  )

  const renameModule = useCallback(
    (courseId: string, moduleId: string, name: string) => dispatch({ type: 'RENAME_MODULE', courseId, moduleId, name }),
    [dispatch]
  )

  const deleteModule = useCallback(
    (courseId: string, moduleId: string) => dispatch({ type: 'DELETE_MODULE', courseId, moduleId }),
    [dispatch]
  )

  const reorderModules = useCallback(
    (courseId: string, orderedIds: string[], parentModuleId?: string | null) =>
      dispatch({ type: 'REORDER_MODULES', courseId, parentModuleId, orderedIds }),
    [dispatch]
  )

  /** Replaces a course's entire module tree in one shot — how the Roadmap Builder's form/text editors commit a save. */
  const setCourseModules = useCallback(
    (courseId: string, modules: CourseModule[]) => dispatch({ type: 'SET_COURSE_MODULES', courseId, modules }),
    [dispatch]
  )

  /** Adds one or many lectures (topics) to a module at once — the same action backs both the single-add form and bulk-add. */
  const addTopics = useCallback(
    (courseId: string, moduleId: string, inputs: { name: string; durationSeconds: number }[]): Topic[] => {
      const topics: Topic[] = inputs.map((t) => ({
        id: makeId('topic'),
        name: t.name,
        done: false,
        ...secondsToTopicFields(t.durationSeconds),
      }))
      dispatch({ type: 'ADD_TOPICS', courseId, moduleId, topics })
      return topics
    },
    [dispatch]
  )

  const updateTopic = useCallback(
    (courseId: string, moduleId: string, topicId: string, patch: { name?: string; durationSeconds?: number }) => {
      const { durationSeconds, ...rest } = patch
      dispatch({
        type: 'UPDATE_TOPIC',
        courseId,
        moduleId,
        topicId,
        patch: durationSeconds === undefined ? rest : { ...rest, ...secondsToTopicFields(durationSeconds) },
      })
    },
    [dispatch]
  )

  const deleteTopic = useCallback(
    (courseId: string, moduleId: string, topicId: string) => dispatch({ type: 'DELETE_TOPIC', courseId, moduleId, topicId }),
    [dispatch]
  )

  const reorderTopics = useCallback(
    (courseId: string, moduleId: string, orderedIds: string[]) =>
      dispatch({ type: 'REORDER_TOPICS', courseId, moduleId, orderedIds }),
    [dispatch]
  )

  const addHabit = useCallback(
    (
      name: string,
      categoryId: string | null = null,
      options?: { courseId?: string | null; planId?: string | null; targetSeconds?: number | null }
    ): Habit => {
      const order = data.habits.filter((h) => h.categoryId === categoryId).length
      const habit: Habit = {
        id: makeId('habit'),
        name,
        courseId: options?.courseId ?? null,
        planId: options?.planId ?? null,
        categoryId,
        targetSeconds: options?.targetSeconds ?? null,
        marks: {},
        archived: false,
        order,
      }
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

  const setHabitMark = useCallback(
    (habitId: string, date: string, mark: HabitMark) => dispatch({ type: 'SET_HABIT_MARK', habitId, date, mark }),
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

  const addPlan = useCallback(
    (fields: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Plan => {
      const now = new Date().toISOString()
      const plan: Plan = { id: makeId('plan'), createdAt: now, updatedAt: now, ...fields }
      dispatch({ type: 'ADD_PLAN', plan })
      return plan
    },
    [dispatch]
  )

  const updatePlan = useCallback(
    (id: string, patch: Partial<Omit<Plan, 'id' | 'createdAt'>>) => dispatch({ type: 'UPDATE_PLAN', id, patch }),
    [dispatch]
  )

  const deletePlan = useCallback((id: string) => dispatch({ type: 'DELETE_PLAN', id }), [dispatch])

  const togglePlanStep = useCallback(
    (planId: string, stepId: string) => dispatch({ type: 'TOGGLE_PLAN_STEP', planId, stepId }),
    [dispatch]
  )

  return {
    data,
    toggleTopic,
    addCourse,
    deleteCourse,
    updateCourse,
    addModule,
    renameModule,
    deleteModule,
    reorderModules,
    setCourseModules,
    addTopics,
    updateTopic,
    deleteTopic,
    reorderTopics,
    setRoadmap,
    addHabit,
    renameHabit,
    setHabitCategory,
    archiveHabit,
    reorderHabits,
    cycleHabitMark,
    setHabitMark,
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
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanStep,
  }
}
