import { describe, it, expect } from 'vitest'
import { normalizeAppData } from './normalizeAppData'

describe('normalizeAppData', () => {
  it('fills in defaults for completely empty/missing data', () => {
    const result = normalizeAppData(undefined)
    expect(result.habits).toEqual([])
    expect(result.habitCategories).toEqual([])
    expect(result.roadmapDocs).toEqual([])
  })

  it('backfills categoryId/archived/order onto pre-categories habits', () => {
    const result = normalizeAppData({
      habits: [
        // @ts-expect-error simulating an older saved shape missing the new fields
        { id: 'h1', name: 'Read', courseId: null, marks: {} },
        // @ts-expect-error same
        { id: 'h2', name: 'Stretch', courseId: null, marks: {} },
      ],
    })
    expect(result.habits[0]).toMatchObject({ id: 'h1', categoryId: null, planId: null, targetSeconds: null, archived: false, order: 0 })
    expect(result.habits[1]).toMatchObject({ id: 'h2', categoryId: null, planId: null, targetSeconds: null, archived: false, order: 1 })
  })

  it('leaves already-current habits and categories untouched', () => {
    const result = normalizeAppData({
      habits: [
        { id: 'h1', name: 'Read', courseId: null, planId: null, categoryId: 'c1', targetSeconds: null, marks: {}, archived: true, order: 5 },
      ],
      habitCategories: [{ id: 'c1', name: 'Mind', color: '#ff4d6d', archived: false, order: 2 }],
    })
    expect(result.habits[0]).toEqual({
      id: 'h1',
      name: 'Read',
      courseId: null,
      planId: null,
      categoryId: 'c1',
      targetSeconds: null,
      marks: {},
      archived: true,
      order: 5,
    })
    expect(result.habitCategories[0]).toEqual({ id: 'c1', name: 'Mind', color: '#ff4d6d', archived: false, order: 2 })
  })

  it('preserves courses and roadmaps untouched', () => {
    const result = normalizeAppData({ courses: [{ id: 'c1', name: 'Test', modules: [] }] })
    expect(result.courses).toEqual([{ id: 'c1', name: 'Test', modules: [] }])
  })
})
