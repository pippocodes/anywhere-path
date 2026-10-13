import { supabase } from './supabaseClient'
import type { AppData, Course, Habit, HabitCategory, RoadmapDoc, RoadmapPlan } from '../types'
import { normalizeAppData } from '../utils/normalizeAppData'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

// --- Row <-> app-shape mapping. Only the column names differ (snake_case,
// a couple of renames to dodge reserved words) — the nested JS structures
// (modules/topics, marks) pass straight through as JSONB. ---

type CourseRow = {
  id: string
  name: string
  is_custom: boolean
  modules: Course['modules']
}

type RoadmapPlanRow = {
  course_id: string
  target_days: number
  daily_hours: number
  total_hours: number
  option: RoadmapPlan['option']
}

type RoadmapDocRow = {
  id: string
  title: string
  outline_text: string
  start_date: string | null
  hours_per_day: number | null
  weekdays: number[] | null
  created_at: string
  updated_at: string
}

type HabitCategoryRow = {
  id: string
  name: string
  color: string
  archived: boolean
  sort_order: number
}

type HabitRow = {
  id: string
  name: string
  course_id: string | null
  category_id: string | null
  marks: Habit['marks']
  archived: boolean
  sort_order: number
}

/** Fetches everything for this user and assembles it into AppData. Empty tables just mean a fresh account. */
export async function fetchCloudData(userId: string): Promise<AppData> {
  const client = requireClient()

  const [coursesRes, plansRes, docsRes, categoriesRes, habitsRes] = await Promise.all([
    client.from('courses').select('id, name, is_custom, modules').eq('user_id', userId),
    client.from('roadmap_plans').select('course_id, target_days, daily_hours, total_hours, option').eq('user_id', userId),
    client
      .from('roadmap_docs')
      .select('id, title, outline_text, start_date, hours_per_day, weekdays, created_at, updated_at')
      .eq('user_id', userId),
    client.from('habit_categories').select('id, name, color, archived, sort_order').eq('user_id', userId),
    client.from('habits').select('id, name, course_id, category_id, marks, archived, sort_order').eq('user_id', userId),
  ])

  const firstError = [coursesRes, plansRes, docsRes, categoriesRes, habitsRes].find((r) => r.error)?.error
  if (firstError) throw firstError

  const courses: Course[] = ((coursesRes.data ?? []) as CourseRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    isCustom: r.is_custom,
    modules: r.modules ?? [],
  }))

  const roadmaps: Record<string, RoadmapPlan> = {}
  for (const r of (plansRes.data ?? []) as RoadmapPlanRow[]) {
    roadmaps[r.course_id] = {
      courseId: r.course_id,
      targetDays: r.target_days,
      dailyHours: r.daily_hours,
      totalHours: r.total_hours,
      option: r.option,
    }
  }

  const roadmapDocs: RoadmapDoc[] = ((docsRes.data ?? []) as RoadmapDocRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    outlineText: r.outline_text,
    startDate: r.start_date ?? undefined,
    hoursPerDay: r.hours_per_day ?? undefined,
    weekdays: r.weekdays ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  const habitCategories: HabitCategory[] = ((categoriesRes.data ?? []) as HabitCategoryRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    archived: r.archived,
    order: r.sort_order,
  }))

  const habits: Habit[] = ((habitsRes.data ?? []) as HabitRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    courseId: r.course_id,
    categoryId: r.category_id,
    marks: r.marks ?? {},
    archived: r.archived,
    order: r.sort_order,
  }))

  return normalizeAppData({ courses, roadmaps, roadmapDocs, habitCategories, habits })
}

/** True once this account has saved anything at all — used to tell "empty new account" apart from "has data". */
export async function cloudHasAnyData(userId: string): Promise<boolean> {
  const client = requireClient()
  const { count, error } = await client
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  if ((count ?? 0) > 0) return true

  const { count: habitCount, error: habitError } = await client
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (habitError) throw habitError
  return (habitCount ?? 0) > 0
}

/**
 * Full reconciliation: upserts everything currently present, then deletes
 * any previously-saved row of that type that's no longer present locally.
 * Simpler and far less error-prone than diffing every reducer action into
 * its own network call, at the cost of re-sending unchanged rows — an
 * acceptable trade for a single user's own data at this scale.
 */
export async function pushAppDataToCloud(userId: string, data: AppData): Promise<void> {
  const client = requireClient()

  if (data.courses.length > 0) {
    const { error } = await client.from('courses').upsert(
      data.courses.map((c) => ({ id: c.id, user_id: userId, name: c.name, is_custom: c.isCustom ?? false, modules: c.modules }))
    )
    if (error) throw error
  }
  await deleteMissing(client, 'courses', userId, data.courses.map((c) => c.id))

  const planEntries = Object.values(data.roadmaps)
  if (planEntries.length > 0) {
    const { error } = await client.from('roadmap_plans').upsert(
      planEntries.map((p) => ({
        course_id: p.courseId,
        user_id: userId,
        target_days: p.targetDays,
        daily_hours: p.dailyHours,
        total_hours: p.totalHours,
        option: p.option,
      }))
    )
    if (error) throw error
  }
  await deleteMissing(client, 'roadmap_plans', userId, planEntries.map((p) => p.courseId), 'course_id')

  if (data.roadmapDocs.length > 0) {
    const { error } = await client.from('roadmap_docs').upsert(
      data.roadmapDocs.map((d) => ({
        id: d.id,
        user_id: userId,
        title: d.title,
        outline_text: d.outlineText,
        start_date: d.startDate ?? null,
        hours_per_day: d.hoursPerDay ?? null,
        weekdays: d.weekdays ?? null,
        created_at: d.createdAt,
        updated_at: d.updatedAt,
      }))
    )
    if (error) throw error
  }
  await deleteMissing(client, 'roadmap_docs', userId, data.roadmapDocs.map((d) => d.id))

  if (data.habitCategories.length > 0) {
    const { error } = await client.from('habit_categories').upsert(
      data.habitCategories.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        color: c.color,
        archived: c.archived,
        sort_order: c.order,
      }))
    )
    if (error) throw error
  }
  await deleteMissing(client, 'habit_categories', userId, data.habitCategories.map((c) => c.id))

  if (data.habits.length > 0) {
    const { error } = await client.from('habits').upsert(
      data.habits.map((h) => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        course_id: h.courseId,
        category_id: h.categoryId,
        marks: h.marks,
        archived: h.archived,
        sort_order: h.order,
      }))
    )
    if (error) throw error
  }
  await deleteMissing(client, 'habits', userId, data.habits.map((h) => h.id))
}

async function deleteMissing(
  client: NonNullable<typeof supabase>,
  table: string,
  userId: string,
  keepIds: string[],
  idColumn = 'id'
): Promise<void> {
  // An empty "not in ()" is invalid SQL, and Supabase's `.not('id','in',[])`
  // would otherwise mean "keep nothing" — handle the all-deleted case plainly.
  if (keepIds.length === 0) {
    const { error } = await client.from(table).delete().eq('user_id', userId)
    if (error) throw error
    return
  }
  // Safe to join unquoted: every id here comes from makeId() (`prefix-<timestamp>-<rand>`),
  // never from free-text user input, so it can't contain a comma/paren that would
  // need escaping in PostgREST's "(a,b,c)" in-list syntax.
  const { error } = await client.from(table).delete().eq('user_id', userId).not(idColumn, 'in', `(${keepIds.join(',')})`)
  if (error) throw error
}
