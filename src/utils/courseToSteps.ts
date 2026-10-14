import type { Course, CourseModule, PlanStep } from '../types'
import { getTopicSeconds } from './duration'
import { makeId } from './id'

function flattenModule(module: CourseModule, path: string[]): PlanStep[] {
  const nextPath = [...path, module.name]
  const ownSteps: PlanStep[] = module.topics.map((t) => ({
    id: makeId('step'),
    title: [...nextPath, t.name].join(' / '),
    estimatedSeconds: getTopicSeconds(t),
    done: false,
  }))
  const childSteps = (module.modules ?? []).flatMap((m) => flattenModule(m, nextPath))
  return [...ownSteps, ...childSteps]
}

/** Flattens a course's subtopic/module tree into a plan's flat, schedulable step list — each step's title is its ancestor path joined, e.g. "Skeletal System / Bones of the arm". */
export function courseToSteps(course: Pick<Course, 'modules'>): PlanStep[] {
  return course.modules.flatMap((m) => flattenModule(m, []))
}
