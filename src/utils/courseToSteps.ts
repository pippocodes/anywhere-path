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
    moduleTitle: nextPath.join(' / '),
  }))
  const childSteps = (module.modules ?? []).flatMap((m) => flattenModule(m, nextPath))
  return [...ownSteps, ...childSteps]
}

/** Flattens a course's subtopic/module tree into a plan's flat, schedulable step list — each step's title is its ancestor path joined, e.g. "Skeletal System / Bones of the arm". */
export function courseToSteps(course: Pick<Course, 'modules'>): PlanStep[] {
  return course.modules.flatMap((m) => flattenModule(m, []))
}

export interface PlanStepGroup {
  key: string
  moduleTitle: string | null
  steps: PlanStep[]
}

/**
 * Buckets consecutive steps sharing the same `moduleTitle` into one group —
 * used to render a plan's steps module-by-module instead of all at once, so
 * a long course (hundreds of steps) only mounts the handful in an opened
 * module. Steps without a `moduleTitle` (hand-added/legacy) each get their
 * own ungrouped bucket, rendered flat like today.
 */
export function groupStepsByModule(steps: PlanStep[]): PlanStepGroup[] {
  const groups: PlanStepGroup[] = []
  for (const step of steps) {
    const moduleTitle = step.moduleTitle ?? null
    const last = groups[groups.length - 1]
    if (moduleTitle !== null && last?.moduleTitle === moduleTitle) {
      last.steps.push(step)
    } else {
      // The first step's id (stable, unique) rather than a positional index,
      // so an open/closed group doesn't flip when an earlier step is edited
      // or removed and the groups re-flow.
      groups.push({ key: step.id, moduleTitle, steps: [step] })
    }
  }
  return groups
}
