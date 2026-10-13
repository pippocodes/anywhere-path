import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import type { Habit, HabitCategory, HabitMark } from '../../types'
import { cycleMark, monthCompletionPercent, computeCurrentStreak, isPerfectDay, isPerfectWeek, isPerfectMonth } from '../../utils/habits'
import { CATEGORY_COLOR_PRESETS } from './colorPresets'
import HabitGridRow from './HabitGridRow'
import CountUp from '../motion/CountUp'

export type CelebrationKind = 'day' | 'week' | 'month'

interface Props {
  category: HabitCategory
  editable: boolean // false for the pseudo "Uncategorized" bucket
  habits: Habit[] // already filtered to this category + non-archived, sorted by order
  dates: string[]
  dayNumbers: number[]
  month: number
  year: number
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
  onRenameHabit: (habitId: string, name: string) => void
  onArchiveHabit: (habitId: string) => void
  onAddHabit: (name: string) => void
  onRenameCategory?: (name: string) => void
  onSetCategoryColor?: (color: string) => void
  onArchiveCategory?: () => void
  onCelebrate: (kind: CelebrationKind) => void
}

function CategorySection({
  category,
  editable,
  habits,
  dates,
  dayNumbers,
  month,
  year,
  referenceDate,
  onCycle,
  onRenameHabit,
  onArchiveHabit,
  onAddHabit,
  onRenameCategory,
  onSetCategoryColor,
  onArchiveCategory,
  onCelebrate,
}: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(category.name)
  const [pickingColor, setPickingColor] = useState(false)
  const [addingHabit, setAddingHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')

  const percent = monthCompletionPercent(habits, month, year)
  const bestActiveStreak = habits.reduce((max, h) => Math.max(max, computeCurrentStreak(h, referenceDate)), 0)

  function commitName() {
    const trimmed = nameDraft.trim()
    setEditingName(false)
    if (trimmed && trimmed !== category.name) onRenameCategory?.(trimmed)
    else setNameDraft(category.name)
  }

  function handleAddHabit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newHabitName.trim()
    if (!trimmed) return
    onAddHabit(trimmed)
    setNewHabitName('')
    setAddingHabit(false)
  }

  // Checks, before vs. hypothetically after this tick, whether it's the
  // tick that newly completes a perfect day/week/month for this category —
  // so confetti fires once on the transition, not on every click after.
  function handleCellClick(habitId: string, date: string) {
    const target = habits.find((h) => h.id === habitId)
    const nextMark = cycleMark(target?.marks[date])
    onCycle(habitId, date)
    if (nextMark !== 2) return

    const done: HabitMark = 2
    const hypothetical = habits.map((h) => (h.id === habitId ? { ...h, marks: { ...h.marks, [date]: done } } : h))

    if (!isPerfectDay(habits, date) && isPerfectDay(hypothetical, date)) {
      onCelebrate('day')
      return
    }
    if (!isPerfectWeek(habits, date) && isPerfectWeek(hypothetical, date)) {
      onCelebrate('week')
      return
    }
    if (!isPerfectMonth(habits, month, year) && isPerfectMonth(hypothetical, month, year)) {
      onCelebrate('month')
    }
  }

  return (
    <div className="card category-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => editable && setPickingColor((v) => !v)}
            disabled={!editable}
            aria-label="Category color"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: category.color,
              border: 'none',
              cursor: editable ? 'pointer' : 'default',
              padding: 0,
            }}
          />
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && commitName()}
              style={{ fontSize: 16, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--pink)' }}
            />
          ) : (
            <h3 onClick={() => editable && setEditingName(true)} style={{ fontSize: 18, cursor: editable ? 'text' : 'default' }}>
              {category.name}
            </h3>
          )}
          <AnimatePresence>
            {bestActiveStreak > 0 && (
              <motion.span
                key={bestActiveStreak}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ fontSize: 12.5, color: 'var(--cherry)', fontWeight: 700 }}
              >
                🔥 {bestActiveStreak}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 12.5, color: 'var(--rose)', fontWeight: 600 }}>
            <CountUp value={percent} suffix="% this month" />
          </div>
          {editable && (
            <button className="btn-outline" style={{ opacity: 0.75 }} onClick={onArchiveCategory}>
              Archive
            </button>
          )}
        </div>
      </div>

      {pickingColor && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {CATEGORY_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onSetCategoryColor?.(c)
                setPickingColor(false)
              }}
              aria-label={`Use color ${c}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c,
                border: c === category.color ? '2px solid var(--ink)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      <div className="progress-track" style={{ marginTop: 14, marginBottom: 16 }}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: category.color }}
        />
      </div>

      {habits.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--rose)' }}>No habits here yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 12px',
                    fontSize: 12.5,
                    color: 'var(--rose)',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: 'var(--card-bg)',
                  }}
                >
                  Habit
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} style={{ padding: '4px 3px', fontSize: 10.5, color: 'var(--rose)', fontWeight: 600, minWidth: 22 }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                {habits.map((habit) => (
                  <HabitGridRow
                    key={habit.id}
                    habit={habit}
                    dates={dates}
                    referenceDate={referenceDate}
                    onCycle={handleCellClick}
                    onRename={onRenameHabit}
                    onArchive={onArchiveHabit}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
      )}

      {addingHabit ? (
        <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            autoFocus
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="New habit name"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--pink-pale)', fontSize: 13.5 }}
          />
          <button className="btn" type="submit" style={{ padding: '8px 16px', fontSize: 13 }}>
            Add
          </button>
          <button type="button" className="btn-outline" onClick={() => setAddingHabit(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button className="btn-outline" style={{ marginTop: 14, color: 'var(--plum)' }} onClick={() => setAddingHabit(true)}>
          + Add Habit
        </button>
      )}
    </div>
  )
}

export default CategorySection
