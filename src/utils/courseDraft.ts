import type { Course, CourseModule, Topic } from '../types'
import { makeId } from './id'

export function makeEmptyTopic(): Topic {
  return { id: makeId('topic'), name: '', hours: 0, done: false, durationSeconds: 0 }
}

export function makeEmptyModule(): CourseModule {
  return { id: makeId('module'), name: '', topics: [] }
}

/** Deep-clones a module (and everything nested under it) with fresh ids — used by "Duplicate section". */
export function cloneModuleWithNewIds(module: CourseModule): CourseModule {
  return {
    ...module,
    id: makeId('module'),
    topics: module.topics.map((t) => ({ ...t, id: makeId('topic') })),
    modules: module.modules ? module.modules.map(cloneModuleWithNewIds) : undefined,
  }
}

/** Finds a module anywhere in a (possibly nested) module tree by id. */
export function findModuleById(modules: CourseModule[], moduleId: string): CourseModule | null {
  for (const m of modules) {
    if (m.id === moduleId) return m
    const found = findModuleById(m.modules ?? [], moduleId)
    if (found) return found
  }
  return null
}

/** True once every module in the tree has a non-empty title and every topic has a title and a positive duration — the bar for "ready to save". */
export function isModuleTreeComplete(modules: CourseModule[]): boolean {
  return modules.every(
    (m) =>
      m.name.trim() !== '' &&
      m.topics.every((t) => t.name.trim() !== '' && (t.durationSeconds ?? 0) > 0) &&
      isModuleTreeComplete(m.modules ?? [])
  )
}

export function makeEmptyCourse(): Pick<Course, 'id' | 'name' | 'modules'> {
  return { id: makeId('course'), name: '', modules: [] }
}
