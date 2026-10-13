import type { OutlineNode } from '../types'
import { durationToMinutes, minutesToHours } from './outlineParser'
import { toDateStr } from './habits'

// Safety valve against an impossible schedule (e.g. a bug leaves hoursLeft
// never reaching zero) turning into an infinite loop.
const MAX_SCHEDULING_ITERATIONS = 20000

export interface ScheduleOptions {
  startDate: string // YYYY-MM-DD
  hoursPerDay: number
  weekdays: number[] // 0=Sun..6=Sat — which days of the week count as study days
}

export interface ScheduledItem {
  nodeId: string
  name: string
  path: string[] // ancestor names, topic first
  level: number
  hours: number
  startDate: string
  endDate: string
}

export interface ScheduleResult {
  items: ScheduledItem[]
  finishDate: string | null
  totalHours: number
  totalDays: number
}

function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Walks the tree in document order, allocating each leaf's hours across
 * study days starting from `startDate`, `hoursPerDay` at a time, skipping
 * any weekday not in `weekdays`. A leaf's hours can spill across multiple
 * days; a day can carry leftover budget into the next leaf.
 */
export function scheduleOutline(nodes: OutlineNode[], options: ScheduleOptions): ScheduleResult {
  const { startDate, hoursPerDay, weekdays } = options

  if (hoursPerDay <= 0 || weekdays.length === 0 || nodes.length === 0) {
    return { items: [], finishDate: null, totalHours: 0, totalDays: 0 }
  }

  const items: ScheduledItem[] = []
  const usedDays = new Set<string>()

  let cursor = parseDateStr(startDate)
  let dayBudget = hoursPerDay
  let iterations = 0

  function advanceToValidDay(): void {
    while (!weekdays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1)
      iterations++
      if (iterations > MAX_SCHEDULING_ITERATIONS) {
        throw new Error('scheduleOutline: could not find a valid study day — check the weekday selection.')
      }
    }
  }

  advanceToValidDay()

  function visit(node: OutlineNode, path: string[]): void {
    if (node.children.length > 0) {
      node.children.forEach((child) => visit(child, [...path, node.name]))
      return
    }

    let hoursLeft = node.duration ? minutesToHours(durationToMinutes(node.duration)) : 0
    let itemStart: string | null = null
    let itemEnd: string | null = null

    while (hoursLeft > 1e-9) {
      if (dayBudget <= 1e-9) {
        cursor = addDays(cursor, 1)
        advanceToValidDay()
        dayBudget = hoursPerDay
      }

      const allocation = Math.min(hoursLeft, dayBudget)
      const dateStr = toDateStr(cursor)
      if (itemStart === null) itemStart = dateStr
      itemEnd = dateStr
      usedDays.add(dateStr)
      dayBudget -= allocation
      hoursLeft -= allocation

      iterations++
      if (iterations > MAX_SCHEDULING_ITERATIONS) {
        throw new Error('scheduleOutline: exceeded the maximum number of scheduling steps.')
      }
    }

    const hours = node.duration ? minutesToHours(durationToMinutes(node.duration)) : 0
    items.push({
      nodeId: node.id,
      name: node.name,
      path,
      level: node.level,
      hours,
      startDate: itemStart ?? toDateStr(cursor),
      endDate: itemEnd ?? toDateStr(cursor),
    })
  }

  nodes.forEach((node) => visit(node, []))

  return {
    items,
    finishDate: items.length > 0 ? items[items.length - 1].endDate : null,
    totalHours: items.reduce((sum, item) => sum + item.hours, 0),
    totalDays: usedDays.size,
  }
}

export function buildScheduleIndex(items: ScheduledItem[]): Map<string, ScheduledItem> {
  return new Map(items.map((item) => [item.nodeId, item]))
}

/** Rolls a node's scheduled date range up from its leaves (min start, max end). */
export function computeNodeDateRange(
  node: OutlineNode,
  index: Map<string, ScheduledItem>
): { startDate: string | null; endDate: string | null } {
  if (node.children.length === 0) {
    const item = index.get(node.id)
    return item ? { startDate: item.startDate, endDate: item.endDate } : { startDate: null, endDate: null }
  }

  let startDate: string | null = null
  let endDate: string | null = null
  for (const child of node.children) {
    const range = computeNodeDateRange(child, index)
    if (range.startDate && (!startDate || range.startDate < startDate)) startDate = range.startDate
    if (range.endDate && (!endDate || range.endDate > endDate)) endDate = range.endDate
  }
  return { startDate, endDate }
}

export function formatDateLabel(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
