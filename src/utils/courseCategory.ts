import type { HabitCategory } from '../types'

// Suggested quick-add chips shown in the category selector when they don't
// already exist as a real category — not auto-seeded data, so a brand new
// account starts with an empty category list, same as the habit tracker.
export const DEFAULT_CATEGORY_SUGGESTIONS = [
  'Body',
  'Skincare',
  'Healthcare',
  'Mind',
  'Study',
  'Career',
  'Finance',
  'Creative',
  'Language',
  'Other',
]

export const UNCATEGORIZED_LABEL = 'Other'
export const UNCATEGORIZED_COLOR = '#8a8390'

export function findCategory(categories: HabitCategory[], id: string | null | undefined): HabitCategory | null {
  if (!id) return null
  return categories.find((c) => c.id === id) ?? null
}

export function categoryLabel(categories: HabitCategory[], id: string | null | undefined): string {
  return findCategory(categories, id)?.name ?? UNCATEGORIZED_LABEL
}

export function categoryColor(categories: HabitCategory[], id: string | null | undefined): string {
  return findCategory(categories, id)?.color ?? UNCATEGORIZED_COLOR
}
