// Curated swatches for category colors — pulled from the active theme's
// chart palette (--chart-1..6) so new categories pick up whichever theme
// the user has selected, instead of one fixed set of hues. Categories a
// user already created keep whatever literal color they were given at the
// time (stored as-is in habit_categories.color) — this only affects the
// picker shown for new colors going forward.
export const CATEGORY_COLOR_PRESETS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const
