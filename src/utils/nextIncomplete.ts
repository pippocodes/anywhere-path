import type { Course, CourseModule, Plan } from '../types'

export interface NextTopic {
  moduleId: string
  topicId: string
  title: string
}

function searchModules(modules: CourseModule[]): NextTopic | null {
  for (const m of modules) {
    const topic = m.topics.find((t) => !t.done)
    if (topic) return { moduleId: m.id, topicId: topic.id, title: topic.name }
    const nested = searchModules(m.modules ?? [])
    if (nested) return nested
  }
  return null
}

/** First not-done topic in a course's module tree, in the same depth-first order it's rendered — used to offer "mark this done too" when a linked habit is ticked complete. */
export function findNextIncompleteTopic(course: Pick<Course, 'modules'>): NextTopic | null {
  return searchModules(course.modules)
}

/** Every done topic's id, anywhere in a course's module tree — used to skip already-finished lectures when walking a schedule (useTodayItems, findNextUpItem). */
export function collectDoneTopicIds(modules: CourseModule[]): Set<string> {
  const ids = new Set<string>()
  function visit(mods: CourseModule[]) {
    for (const m of mods) {
      for (const t of m.topics) {
        if (t.done) ids.add(t.id)
      }
      if (m.modules) visit(m.modules)
    }
  }
  visit(modules)
  return ids
}

function searchForTopicModule(modules: CourseModule[], topicId: string): string | null {
  for (const m of modules) {
    if (m.topics.some((t) => t.id === topicId)) return m.id
    const nested = searchForTopicModule(m.modules ?? [], topicId)
    if (nested) return nested
  }
  return null
}

/** The id of the module that directly contains a given topic — needed to call toggleTopic(courseId, moduleId, topicId) when only the topicId is known (e.g. from useTodayItems). */
export function findModuleIdForTopic(course: Pick<Course, 'modules'>, topicId: string): string | null {
  return searchForTopicModule(course.modules, topicId)
}

export interface NextPlanStep {
  stepId: string
  title: string
}

/** First not-done step in a plan's flat step list. */
export function findNextIncompletePlanStep(plan: Pick<Plan, 'steps'>): NextPlanStep | null {
  const step = plan.steps.find((s) => !s.done)
  return step ? { stepId: step.id, title: step.title } : null
}
