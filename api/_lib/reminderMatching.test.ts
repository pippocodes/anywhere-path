import { describe, it, expect } from 'vitest'
import {
  localDateAndTime,
  isWithinQuietHours,
  matchDueRemindersForUser,
  buildReminderMessage,
  type NotificationSettingsRow,
  type HabitReminderRow,
  type ReminderHabit,
} from './reminderMatching.js'

const UTC = 'UTC'

function settings(overrides: Partial<NotificationSettingsRow> = {}): NotificationSettingsRow {
  return {
    userId: 'u1',
    enabled: true,
    timezone: UTC,
    quietHoursStart: null,
    quietHoursEnd: null,
    ...overrides,
  }
}

function habit(overrides: Partial<ReminderHabit> = {}): ReminderHabit {
  return {
    id: 'h1',
    name: 'Read',
    courseId: null,
    planId: null,
    archived: false,
    marks: {},
    ...overrides,
  }
}

function reminder(overrides: Partial<HabitReminderRow> = {}): HabitReminderRow {
  return {
    habitId: 'h1',
    userId: 'u1',
    remindAt: '09:00',
    enabled: true,
    lastSentDate: null,
    ...overrides,
  }
}

describe('localDateAndTime', () => {
  it('reads date and time in the given timezone', () => {
    // 2024-01-01T23:30:00Z is already 2024-01-02 in UTC+1 territories
    const result = localDateAndTime(new Date('2024-01-01T23:30:00Z'), 'Europe/Berlin')
    expect(result).toEqual({ date: '2024-01-02', hm: '00:30' })
  })

  it('falls back to UTC for an invalid timezone instead of throwing', () => {
    const result = localDateAndTime(new Date('2024-01-01T12:00:00Z'), 'Not/A_Zone')
    expect(result).toEqual({ date: '2024-01-01', hm: '12:00' })
  })
})

describe('isWithinQuietHours', () => {
  it('is false when no quiet hours are set', () => {
    expect(isWithinQuietHours('23:00', null, null)).toBe(false)
  })

  it('handles a same-day window', () => {
    expect(isWithinQuietHours('13:00', '12:00', '14:00')).toBe(true)
    expect(isWithinQuietHours('11:00', '12:00', '14:00')).toBe(false)
  })

  it('handles a window that wraps past midnight', () => {
    expect(isWithinQuietHours('23:30', '22:00', '07:00')).toBe(true)
    expect(isWithinQuietHours('06:30', '22:00', '07:00')).toBe(true)
    expect(isWithinQuietHours('12:00', '22:00', '07:00')).toBe(false)
  })
})

describe('matchDueRemindersForUser', () => {
  const now = new Date('2024-06-10T09:00:00Z') // local date "2024-06-10", time "09:00" in UTC

  it('matches a habit whose reminder time equals the current local time', () => {
    const result = matchDueRemindersForUser(now, settings(), [reminder()], [habit()], [], [])
    expect(result.due).toEqual([{ habitId: 'h1', habitName: 'Read' }])
  })

  it('does not match when the time does not line up', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder({ remindAt: '09:01' })],
      [habit()],
      [],
      []
    )
    expect(result.due).toEqual([])
  })

  it('sends nothing when notifications are globally off', () => {
    const result = matchDueRemindersForUser(now, settings({ enabled: false }), [reminder()], [habit()], [], [])
    expect(result.due).toEqual([])
  })

  it('sends nothing during quiet hours', () => {
    const result = matchDueRemindersForUser(
      now,
      settings({ quietHoursStart: '08:00', quietHoursEnd: '10:00' }),
      [reminder()],
      [habit()],
      [],
      []
    )
    expect(result.due).toEqual([])
  })

  it('skips a reminder already sent today — at most one per habit per day', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder({ lastSentDate: '2024-06-10' })],
      [habit()],
      [],
      []
    )
    expect(result.due).toEqual([])
  })

  it('still matches when the habit was last sent a previous day', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder({ lastSentDate: '2024-06-09' })],
      [habit()],
      [],
      []
    )
    expect(result.due).toEqual([{ habitId: 'h1', habitName: 'Read' }])
  })

  it('skips a habit already marked done today', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder()],
      [habit({ marks: { '2024-06-10': 2 } })],
      [],
      []
    )
    expect(result.due).toEqual([])
  })

  it('skips an archived habit', () => {
    const result = matchDueRemindersForUser(now, settings(), [reminder()], [habit({ archived: true })], [], [])
    expect(result.due).toEqual([])
  })

  it('skips a disabled per-habit reminder', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder({ enabled: false })],
      [habit()],
      [],
      []
    )
    expect(result.due).toEqual([])
  })

  it('never reminds before the linked plan has started', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder()],
      [habit({ planId: 'p1' })],
      [],
      [{ id: 'p1', startDate: '2024-06-11' }]
    )
    expect(result.due).toEqual([])
  })

  it('reminds once the linked course has started', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder()],
      [habit({ courseId: 'c1' })],
      [{ id: 'c1', startDate: '2024-06-10' }],
      []
    )
    expect(result.due).toEqual([{ habitId: 'h1', habitName: 'Read' }])
  })

  it('combines several due habits into one result for the user', () => {
    const result = matchDueRemindersForUser(
      now,
      settings(),
      [reminder({ habitId: 'h1' }), reminder({ habitId: 'h2' })],
      [habit({ id: 'h1', name: 'Read' }), habit({ id: 'h2', name: 'Stretch' })],
      [],
      []
    )
    expect(result.due).toHaveLength(2)
    expect(result.due.map((d: { habitId: string }) => d.habitId).sort()).toEqual(['h1', 'h2'])
  })

  it('never produces a backlog for a habit missed several days in a row — each day is evaluated independently', () => {
    const day1 = matchDueRemindersForUser(new Date('2024-06-08T09:00:00Z'), settings(), [reminder()], [habit()], [], [])
    expect(day1.due).toHaveLength(1)
    // Habit still isn't marked done and the reminder wasn't sent (simulating a missed day) —
    // the next day's tick still yields exactly one reminder, not two.
    const day2 = matchDueRemindersForUser(
      new Date('2024-06-09T09:00:00Z'),
      settings(),
      [reminder({ lastSentDate: '2024-06-08' })],
      [habit()],
      [],
      []
    )
    expect(day2.due).toHaveLength(1)
  })
})

describe('buildReminderMessage', () => {
  it('names the single habit', () => {
    const { body } = buildReminderMessage([{ habitId: 'h1', habitName: 'Read' }])
    expect(body).toContain('Read')
  })

  it('combines several habits into one message', () => {
    const { body } = buildReminderMessage([
      { habitId: 'h1', habitName: 'Read' },
      { habitId: 'h2', habitName: 'Stretch' },
    ])
    expect(body).toContain('Read')
    expect(body).toContain('Stretch')
  })

  it('never uses guilt-tripping language', () => {
    const { body } = buildReminderMessage([{ habitId: 'h1', habitName: 'Read' }])
    expect(body.toLowerCase()).not.toMatch(/missed|failed|forgot|behind|broke your streak/)
  })
})
