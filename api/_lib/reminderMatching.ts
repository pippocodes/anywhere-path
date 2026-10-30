// Pure helpers for /api/send-reminders — framework/SDK-free so the rules
// from the Part 1 design (start-date gating, one-per-day, combining,
// quiet hours, per-user opt-out) are directly unit-testable without
// mocking Supabase, web-push, or the system clock.

import { isHabitStarted } from '../../src/utils/reminders.js'
import type { Habit, Course, Plan, HabitMark } from '../../src/types.js'

export interface NotificationSettingsRow {
  userId: string
  enabled: boolean
  timezone: string
  quietHoursStart: string | null // "HH:MM"
  quietHoursEnd: string | null
}

export interface HabitReminderRow {
  habitId: string
  userId: string
  remindAt: string // "HH:MM"
  enabled: boolean
  lastSentDate: string | null // "YYYY-MM-DD"
}

export type ReminderHabit = Pick<Habit, 'id' | 'name' | 'courseId' | 'planId' | 'archived'> & {
  marks: Record<string, HabitMark>
}
export type ReminderCourse = Pick<Course, 'id' | 'startDate'>
export type ReminderPlan = Pick<Plan, 'id' | 'startDate'>

export interface DueHabit {
  habitId: string
  habitName: string
}

/** One user's combined reminder for this tick — empty `due` means nothing to send (includes "settings disabled" and "quiet hours"). */
export interface UserMatchResult {
  userId: string
  localDate: string // "YYYY-MM-DD" in the user's own timezone — stamp this as last_sent_date on every matched reminder
  due: DueHabit[]
}

/** The user's current local "YYYY-MM-DD" and "HH:MM", or UTC's if the timezone string is invalid. */
export function localDateAndTime(nowUtc: Date, timezone: string): { date: string; hm: string } {
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  } catch {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  }
  const parts = formatter.formatToParts(nowUtc)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hm: `${get('hour')}:${get('minute')}`,
  }
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

/** Quiet hours suppress sending outright (no backlog) — handles a window that wraps past midnight (e.g. 22:00-07:00). */
export function isWithinQuietHours(hm: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = toMinutes(hm)
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  if (startMin === endMin) return false
  if (startMin < endMin) return now >= startMin && now < endMin
  return now >= startMin || now < endMin // wraps midnight
}

/**
 * Every habit reminder due to fire for one user at `nowUtc`, combined into
 * a single result. Encodes every Part 1 rule: off switch, quiet hours, no
 * reminder before the linked course's/plan's start date, at most one per
 * habit per day (via `lastSentDate`), nothing for an already-completed
 * habit, and — since this only ever looks at *today*, never a backlog of
 * missed days — at most one gentle nudge, never a stream.
 */
export function matchDueRemindersForUser(
  nowUtc: Date,
  settings: NotificationSettingsRow,
  reminders: HabitReminderRow[],
  habits: ReminderHabit[],
  courses: ReminderCourse[],
  plans: ReminderPlan[]
): UserMatchResult {
  const { date: localDate, hm } = localDateAndTime(nowUtc, settings.timezone)
  const empty: UserMatchResult = { userId: settings.userId, localDate, due: [] }

  if (!settings.enabled) return empty
  if (isWithinQuietHours(hm, settings.quietHoursStart, settings.quietHoursEnd)) return empty

  const habitsById = new Map(habits.map((h) => [h.id, h]))
  const due: DueHabit[] = []

  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    if (reminder.remindAt !== hm) continue
    if (reminder.lastSentDate === localDate) continue // already sent today

    const habit = habitsById.get(reminder.habitId)
    if (!habit || habit.archived) continue
    if (habit.marks[localDate] === 2) continue // already done today
    if (!isHabitStarted(habit, courses, plans, localDate)) continue

    due.push({ habitId: habit.id, habitName: habit.name })
  }

  return { userId: settings.userId, localDate, due }
}

/**
 * The combined push notification's text for one user's due habits — one
 * habit gets its name, several get a count plus the list, and both land on
 * the same warm, non-guilting line the user specified ("your bad days
 * still count"). Never says "missed" or "failed" — a habit becoming due
 * again tomorrow is the only consequence, not a scoreboard.
 */
export function buildReminderMessage(due: DueHabit[]): { title: string; body: string } {
  const title = 'Anywhere Path'
  if (due.length === 1) {
    return { title, body: `A gentle nudge for "${due[0].habitName}" — whenever you're ready. Your bad days still count.` }
  }
  const names = due.map((d) => d.habitName).join(', ')
  return { title, body: `A gentle nudge for ${due.length} things today: ${names}. Your bad days still count.` }
}
