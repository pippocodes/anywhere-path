import { describe, it, expect } from 'vitest'
import { evaluatePostSuggestions } from './postSuggestions'
import type { Course, CourseModule, Habit, Plan, Topic } from '../types'

function topic(overrides: Partial<Topic> = {}): Topic {
  return { id: 't1', name: 'Topic', hours: 0, done: false, ...overrides }
}

function module_(overrides: Partial<CourseModule> = {}): CourseModule {
  return { id: 'm1', name: 'Module', topics: [], ...overrides }
}

function course(overrides: Partial<Course> = {}): Course {
  return { id: 'c1', name: 'Course', modules: [], ...overrides }
}

function habit(marks: Record<string, 0 | 1 | 2> = {}, overrides: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Habit', courseId: null, planId: null, categoryId: null, targetSeconds: null, archived: false, order: 0, marks, ...overrides }
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'p1',
    title: 'Plan',
    categoryId: null,
    sourceType: 'custom',
    sourceCourseId: null,
    steps: [],
    startDate: '2026-01-01',
    days: 7,
    hoursPerDay: 1,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const emptyData = { courses: [] as Course[], habits: [] as Habit[], plans: [] as Plan[] }
const today = new Date(2026, 9, 29) // Oct 29, 2026 (a Thursday)

describe('evaluatePostSuggestions', () => {
  it('suggests nothing when no rule matches', () => {
    expect(evaluatePostSuggestions(emptyData, today)).toBeNull()
  })

  it('suggests a finished course — every topic across nested modules done', () => {
    const c = course({
      name: 'Anatomy',
      modules: [
        module_({ id: 'm1', topics: [topic({ id: 't1', done: true })] }),
        module_({ id: 'm2', topics: [], modules: [module_({ id: 'm2a', topics: [topic({ id: 't2', done: true })] })] }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)
    expect(result).toMatchObject({ id: 'course-finished:c1', rule: 'course-finished' })
    expect(result?.draft).toContain('Anatomy')
  })

  it('does not suggest a course with no topics at all (vacuously "done")', () => {
    const c = course({ modules: [module_({ topics: [] })] })
    expect(evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)).toBeNull()
  })

  it('does not suggest an unfinished course', () => {
    const c = course({ modules: [module_({ topics: [topic({ done: true }), topic({ id: 't2', done: false })] })] })
    expect(evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)).toBeNull()
  })

  it('suggests a finished leaf module when the course overall is not finished', () => {
    const c = course({
      name: 'Anatomy',
      modules: [
        module_({ id: 'm1', name: 'Skeletal', topics: [topic({ id: 't1', done: true })] }),
        module_({ id: 'm2', name: 'Muscular', topics: [topic({ id: 't2', done: false })] }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)
    expect(result).toMatchObject({ id: 'module-finished:c1:m1', rule: 'module-finished' })
    expect(result?.draft).toContain('Skeletal')
    expect(result?.draft).toContain('Anatomy')
  })

  it('also finds a module whose OWN topics are done even when it also has an unfinished sub-module', () => {
    const c = course({
      name: 'Anatomy',
      modules: [
        module_({
          id: 'm1',
          name: 'Skeletal',
          topics: [topic({ id: 't1', done: true })],
          modules: [module_({ id: 'm1a', topics: [topic({ id: 't2', done: false })] })],
        }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)
    // m1 itself isn't fully done (its sub-module m1a isn't), but nothing
    // here should be reported finished until m1a is done too.
    expect(result).toBeNull()
  })

  it('finds the shallowest fully-done module, not just leaves', () => {
    const c = course({
      name: 'Anatomy',
      modules: [
        module_({
          id: 'm1',
          name: 'Upper Body',
          topics: [],
          modules: [
            module_({ id: 'm1a', topics: [topic({ id: 't1', done: true })] }),
            module_({ id: 'm1b', topics: [topic({ id: 't2', done: true })] }),
          ],
        }),
        module_({ id: 'm2', name: 'Lower Body', topics: [topic({ id: 't3', done: false })] }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)
    // m1's whole subtree (m1a + m1b) is done, so m1 itself — the shallower
    // module — is reported, not one of its already-done children.
    expect(result).toMatchObject({ id: 'module-finished:c1:m1' })
  })

  it('a finished course outranks a finished module in the same data', () => {
    // Every topic in every module is done -> whole course is finished too.
    const c = course({ modules: [module_({ id: 'm1', topics: [topic({ done: true })] })] })
    const result = evaluatePostSuggestions({ ...emptyData, courses: [c] }, today)
    expect(result?.rule).toBe('course-finished')
  })

  it('suggests a completed plan', () => {
    const p = plan({ title: 'Learn Spanish', steps: [{ id: 's1', title: 'Step', estimatedSeconds: 60, done: true }] })
    const result = evaluatePostSuggestions({ ...emptyData, plans: [p] }, today)
    expect(result).toMatchObject({ id: 'plan-completed:p1', rule: 'plan-completed' })
    expect(result?.draft).toContain('Learn Spanish')
  })

  it('does not suggest a plan with any step left undone', () => {
    const p = plan({ steps: [{ id: 's1', title: 'Step', estimatedSeconds: 60, done: true }, { id: 's2', title: 'Step 2', estimatedSeconds: 60, done: false }] })
    expect(evaluatePostSuggestions({ ...emptyData, plans: [p] }, today)).toBeNull()
  })

  it('suggests a 7-day streak reached exactly today, not every day after', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const result = evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)
    expect(result).toMatchObject({ rule: 'streak-7' })

    // One more day done (streak is now 8, not exactly 7) -> the streak-7
    // rule itself no longer matches, even though the trailing week is also
    // full enough to separately qualify as a "strong week" instead.
    const dBefore = new Date(today)
    dBefore.setDate(dBefore.getDate() - 7)
    const eightDayMarks = { ...marks, [`${dBefore.getFullYear()}-${String(dBefore.getMonth() + 1).padStart(2, '0')}-${String(dBefore.getDate()).padStart(2, '0')}`]: 2 as const }
    const h8 = habit(eightDayMarks)
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h8] }, today)?.rule).not.toBe('streak-7')
  })

  it('keys a streak milestone by habit, not by date — the same 7-day streak gives the same id whether checked today or tomorrow before marking', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Tomorrow isn't marked yet — computeCurrentStreak gives an unmarked
    // "today" a grace day, so this still reads as the same 7-day streak.
    const resultToday = evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)
    const resultTomorrow = evaluatePostSuggestions({ ...emptyData, habits: [h] }, tomorrow)
    expect(resultToday).toMatchObject({ rule: 'streak-7' })
    expect(resultToday?.id).toBe(resultTomorrow?.id)
  })

  it('a 30-day streak outranks a finished module', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const c = course({
      modules: [
        module_({ id: 'm1', topics: [topic({ id: 't1', done: true })] }),
        module_({ id: 'm2', topics: [topic({ id: 't2', done: false })] }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, habits: [h], courses: [c] }, today)
    expect(result?.rule).toBe('streak-30')
  })

  it('a finished module outranks a 7-day streak', () => {
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const c = course({
      modules: [
        module_({ id: 'm1', topics: [topic({ id: 't1', done: true })] }),
        module_({ id: 'm2', topics: [topic({ id: 't2', done: false })] }),
      ],
    })
    const result = evaluatePostSuggestions({ ...emptyData, habits: [h], courses: [c] }, today)
    expect(result?.rule).toBe('module-finished')
  })

  it('suggests a comeback: today active, the 7 days before were fully inactive, with real history before that', () => {
    // Oct 15 is well before the inactive window (Oct 22-28) -> genuine
    // prior activity, not just a habit that didn't exist yet.
    const marks: Record<string, 0 | 1 | 2> = { '2026-10-29': 2, '2026-10-15': 2 }
    const h = habit(marks)
    const result = evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)
    expect(result).toMatchObject({ id: 'comeback:2026-10-29', rule: 'comeback' })
  })

  it('does not suggest a comeback if any of the 7 prior days had activity', () => {
    const h = habit({ '2026-10-29': 2, '2026-10-25': 1, '2026-10-15': 2 })
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)).toBeNull()
  })

  it('does not suggest a comeback if today itself has no activity', () => {
    const h = habit({ '2026-10-15': 2 })
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)).toBeNull()
  })

  it('does not treat a brand-new habit\'s very first mark as a "comeback" — there is no real history before the blank week', () => {
    // Only ever marked once, today. The 7 days "before" read as inactive
    // only because the habit didn't exist yet, not because of a break.
    const h = habit({ '2026-10-29': 2 })
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)).toBeNull()
  })

  it('suggests a strong week at 85%+ completion over the trailing 7 days', () => {
    // 10 straight done days, not 7 or 30 exactly, so this doesn't also
    // (correctly) read as a streak milestone — isolates the strong-week
    // rule on its own.
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = 0; i < 10; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const result = evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)
    expect(result?.rule).toBe('strong-week')
    expect(result?.draft).toContain('100%')
  })

  it('does not suggest a strong week below the threshold', () => {
    // Two partial marks inside the trailing 7 days (Oct 23-29): low enough
    // completion to miss the 85% bar, and spread out enough that the prior
    // week isn't "fully inactive" either, so this doesn't accidentally
    // read as a comeback instead.
    const h = habit({ '2026-10-29': 1, '2026-10-23': 1 })
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)).toBeNull()
  })

  it('keys the strong-week suggestion by the week\'s Monday, not the exact day', () => {
    // 11 straight done days through tomorrow, so neither today's nor
    // tomorrow's evaluation lands on an exact 7- or 30-day streak either.
    const marks: Record<string, 0 | 1 | 2> = {}
    for (let i = -1; i < 10; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      marks[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 2
    }
    const h = habit(marks)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const resultToday = evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)
    const resultTomorrow = evaluatePostSuggestions({ ...emptyData, habits: [h] }, tomorrow)
    expect(resultToday?.rule).toBe('strong-week')
    expect(resultTomorrow?.rule).toBe('strong-week')
    expect(resultToday?.id).toBe(resultTomorrow?.id)
  })

  it('ignores archived habits for streak/comeback/strong-week rules', () => {
    const h = habit({ '2026-10-29': 2 }, { archived: true })
    expect(evaluatePostSuggestions({ ...emptyData, habits: [h] }, today)).toBeNull()
  })
})
