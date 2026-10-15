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

export interface NextPlanStep {
  stepId: string
  title: string
}

/** First not-done step in a plan's flat step list. */
export function findNextIncompletePlanStep(plan: Pick<Plan, 'steps'>): NextPlanStep | null {
  const step = plan.steps.find((s) => !s.done)
  return step ? { stepId: step.id, title: step.title } : null
}
