import type { AppData, Habit, HabitCategory } from '../types'
import { initialData } from '../context/reducer'

/**
 * Backfills fields that didn't exist in older saved AppData blobs (e.g. a
 * pre-categories `habits` array) onto sensible defaults, so the rest of the
 * app can trust every habit/category has every field without `?? default`
 * scattered through it. Safe to call on already-current data — it's a
 * no-op in that case.
 */
export function normalizeAppData(partial: Partial<AppData> | null | undefined): AppData {
  const base: AppData = { ...initialData, ...partial }

  const habits: Habit[] = (base.habits ?? []).map((h, i) => ({
    ...h,
    categoryId: h.categoryId ?? null,
    archived: h.archived ?? false,
    order: h.order ?? i,
  }))

  const habitCategories: HabitCategory[] = (base.habitCategories ?? []).map((c, i) => ({
    ...c,
    archived: c.archived ?? false,
    order: c.order ?? i,
  }))

  return { ...base, habits, habitCategories }
}
