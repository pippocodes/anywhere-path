import type { Plan } from '../types'

/** Percent of a plan's steps marked done, by count — the plan-linked-habit equivalent of computeCourseStats().percent. */
export function computePlanProgress(plan: Pick<Plan, 'steps'>): number {
  if (plan.steps.length === 0) return 0
  const done = plan.steps.filter((s) => s.done).length
  return Math.round((done / plan.steps.length) * 100)
}
