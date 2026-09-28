import type { HabitMark, Habit } from '../types'

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Date strings (YYYY-MM-DD) for every day in the given month, in order.
export function monthDates(month: number, year: number): string[] {
  const count = daysInMonth(month, year)
  return Array.from({ length: count }, (_, i) => toDateStr(new Date(year, month, i + 1)))
}

export function cycleMark(mark: HabitMark | undefined): HabitMark {
  const current = mark ?? 0
  return ((current + 1) % 3) as HabitMark
}

export function monthCompletionPercent(habits: Habit[], month: number, year: number): number {
  const dates = monthDates(month, year)
  if (habits.length === 0 || dates.length === 0) return 0

  let total = 0
  let earned = 0
  for (const habit of habits) {
    for (const date of dates) {
      total++
      earned += (habit.marks[date] ?? 0) / 2
    }
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100)
}
