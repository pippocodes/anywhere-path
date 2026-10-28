import { describe, it, expect } from 'vitest'
import type { AppData } from '../types'
import { buildExportPayload } from './exportData'

const EMPTY_DATA: AppData = { courses: [], roadmaps: {}, habits: [], roadmapDocs: [], habitCategories: [], plans: [] }

describe('buildExportPayload', () => {
  it('includes every AppData field plus an ISO exportedAt timestamp', () => {
    const payload = buildExportPayload(EMPTY_DATA, new Date('2026-10-29T12:00:00.000Z'))
    expect(payload).toEqual({
      exportedAt: '2026-10-29T12:00:00.000Z',
      courses: [],
      roadmaps: {},
      habits: [],
      roadmapDocs: [],
      habitCategories: [],
      plans: [],
    })
  })

  it("doesn't mutate the data it's given", () => {
    const data = { ...EMPTY_DATA, courses: [{ id: 'c1' }] as unknown as AppData['courses'] }
    buildExportPayload(data)
    expect(data.courses).toHaveLength(1)
  })
})
