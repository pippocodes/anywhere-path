import type { HabitMark } from '../types'
import { toDateStr, monthDates } from './habits'

/** One row from shared_item_logs — a single member's state on a single day. */
export interface SharedLog {
  userId: string
  date: string // YYYY-MM-DD
  state: HabitMark // 0 none, 1 partial, 2 full — same semantics as a personal habit mark
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** This member's state for one date, or 0 if nothing logged. */
export function stateFor(logs: SharedLog[], userId: string, date: string): HabitMark {
  return logs.find((l) => l.userId === userId && l.date === date)?.state ?? 0
}

/**
 * The shared streak, ending today. A day breaks it only if at least one
 * member did nothing at all (state 0) that day. A day where everyone did at
 * least something but not everyone finished doesn't break it, but doesn't
 * add to it either — same transparent-partial rule as computeCurrentStreak.
 * Today gets the same one-time grace for being still fully undecided.
 */
export function computeSharedStreak(logs: SharedLog[], memberIds: string[], today: Date = new Date()): number {
  if (memberIds.length === 0) return 0

  function allDoneOn(date: string): boolean {
    return memberIds.every((id) => stateFor(logs, id, date) === 2)
  }
  function allAtLeastPartialOn(date: string): boolean {
    return memberIds.every((id) => stateFor(logs, id, date) >= 1)
  }

  let cursor = today
  if (!allAtLeastPartialOn(toDateStr(cursor))) cursor = addDays(cursor, -1)

  let streak = 0
  while (true) {
    const date = toDateStr(cursor)
    if (!allAtLeastPartialOn(date)) break
    if (allDoneOn(date)) streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export interface FinishOrderEntry {
  userId: string
  finishedAt: string // ISO timestamp this member's state for `date` was last written
}

/**
 * Members who are fully done (state 2) on `date`, ordered by who got there
 * first — needs each log row's `updatedAt` (the DB's own timestamp), not
 * just the date, since multiple members can finish the same day.
 */
export function finishOrderFor(
  logsWithTimestamps: { userId: string; date: string; state: HabitMark; updatedAt: string }[],
  date: string
): FinishOrderEntry[] {
  return logsWithTimestamps
    .filter((l) => l.date === date && l.state === 2)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .map((l) => ({ userId: l.userId, finishedAt: l.updatedAt }))
}

/** True once every member is fully done for `date`. */
export function isTogetherComplete(logs: SharedLog[], memberIds: string[], date: string): boolean {
  return memberIds.length > 0 && memberIds.every((id) => stateFor(logs, id, date) === 2)
}

/** This month's "together" completion, averaged across members (full=1, partial=0.5) — mirrors monthCompletionPercent's own math for the personal tracker. */
export function monthTogetherPercent(logs: SharedLog[], memberIds: string[], month: number, year: number): number {
  const dates = monthDates(month, year)
  if (memberIds.length === 0 || dates.length === 0) return 0

  let total = 0
  let earned = 0
  for (const id of memberIds) {
    for (const date of dates) {
      total++
      earned += stateFor(logs, id, date) / 2
    }
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100)
}
