import type { HabitCategory } from '../../types'
import { categoryColor, categoryLabel } from '../../utils/courseCategory'

interface Props {
  categories: HabitCategory[]
  categoryId: string | null | undefined
  size?: 'sm' | 'md'
}

/** Small coloured pill showing a course's category — used on course cards, the filter row, and the category selector. */
function CategoryChip({ categories, categoryId, size = 'sm' }: Props) {
  const label = categoryLabel(categories, categoryId)
  const color = categoryColor(categories, categoryId)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: size === 'sm' ? 11 : 12.5,
        fontWeight: 600,
        padding: size === 'sm' ? '3px 9px' : '4px 11px',
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--text) 6%, transparent)',
        border: '1px solid var(--line)',
        color: 'var(--cream)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

export default CategoryChip
