import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useApp } from '../hooks/useApp'
import {
  daysInMonth,
  monthDates,
  monthCompletionPercent,
  yearlyCompletion,
  compareToLastMonth,
  computeBestStreak,
  computeCurrentStreak,
} from '../utils/habits'
import { generateSuggestions } from '../utils/suggestions'
import { CATEGORY_COLOR_PRESETS } from '../components/habits/colorPresets'
import CategorySection, { type CelebrationKind } from '../components/habits/CategorySection'
import ProgressRing from '../components/habits/ProgressRing'
import YearlyBars from '../components/habits/YearlyBars'
import SuggestionsPanel from '../components/habits/SuggestionsPanel'
import Confetti from '../components/habits/Confetti'
import type { Habit } from '../types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CELEBRATION_MESSAGE: Record<CelebrationKind, string> = {
  day: 'Perfect day! 🎉',
  week: 'Perfect week! 🎉',
  month: 'Perfect month! 🎉',
}

const UNCATEGORIZED_ID = '__uncategorized__'

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

function Habits() {
  const {
    data,
    cycleHabitMark,
    addHabit,
    renameHabit,
    archiveHabit,
    reorderHabits,
    deleteHabit,
    addHabitCategory,
    renameHabitCategory,
    setHabitCategoryColor,
    archiveHabitCategory,
    deleteHabitCategory,
  } = useApp()

  const referenceDate = useMemo(() => new Date(), [])
  const today = referenceDate
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState<string>(CATEGORY_COLOR_PRESETS[0])
  const [celebration, setCelebration] = useState<CelebrationKind | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null)
  const [confirmDeleteHabitId, setConfirmDeleteHabitId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const dim = daysInMonth(month, year)
  const dates = useMemo(() => monthDates(month, year), [month, year])
  const dayNumbers = useMemo(() => Array.from({ length: dim }, (_, i) => i + 1), [dim])

  const activeHabits = useMemo(() => data.habits.filter((h) => !h.archived), [data.habits])
  const archivedHabits = useMemo(() => data.habits.filter((h) => h.archived), [data.habits])
  const activeCategories = useMemo(
    () => sortByOrder(data.habitCategories.filter((c) => !c.archived)),
    [data.habitCategories]
  )
  const archivedCategories = useMemo(
    () => data.habitCategories.filter((c) => c.archived),
    [data.habitCategories]
  )

  const habitsByCategory = useMemo(() => {
    const map = new Map<string, Habit[]>()
    for (const h of activeHabits) {
      const key = h.categoryId ?? UNCATEGORIZED_ID
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(h)
    }
    for (const [key, list] of map) map.set(key, sortByOrder(list))
    return map
  }, [activeHabits])

  const uncategorized = habitsByCategory.get(UNCATEGORIZED_ID) ?? []

  const overallPercent = monthCompletionPercent(activeHabits, month, year)
  const overallYearly = useMemo(() => yearlyCompletion(activeHabits, year), [activeHabits, year])
  const comparison = useMemo(() => compareToLastMonth(activeHabits, referenceDate), [activeHabits, referenceDate])
  const bestStreakEver = activeHabits.reduce((max, h) => Math.max(max, computeBestStreak(h)), 0)
  const bestCurrentStreak = activeHabits.reduce((max, h) => Math.max(max, computeCurrentStreak(h, referenceDate)), 0)
  const suggestions = useMemo(
    () => generateSuggestions(data.habits, data.habitCategories, referenceDate),
    [data.habits, data.habitCategories, referenceDate]
  )

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    addHabitCategory(trimmed, newCategoryColor)
    setNewCategoryName('')
    setNewCategoryColor(CATEGORY_COLOR_PRESETS[0])
    setAddingCategory(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeHabit = activeHabits.find((h) => h.id === active.id)
    const overHabit = activeHabits.find((h) => h.id === over.id)
    if (!activeHabit || !overHabit || activeHabit.categoryId !== overHabit.categoryId) return

    const group = habitsByCategory.get(activeHabit.categoryId ?? UNCATEGORIZED_ID) ?? []
    const ids = group.map((h) => h.id)
    const oldIndex = ids.indexOf(activeHabit.id)
    const newIndex = ids.indexOf(overHabit.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderHabits(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {celebration && (
        <>
          <Confetti onDone={() => setCelebration(null)} />
          <div
            role="status"
            style={{
              position: 'fixed',
              top: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--ink)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 14,
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(89,13,34,0.25)',
            }}
          >
            {CELEBRATION_MESSAGE[celebration]}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <h1 className="page-title">Habit Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-bg)', borderRadius: 12, padding: '8px 14px', boxShadow: '0 4px 14px rgba(89,13,34,0.06)' }}>
          <button className="btn-outline" style={{ fontSize: 18 }} onClick={prevMonth} aria-label="Previous month">‹</button>
          <div style={{ fontWeight: 700, fontSize: 15, minWidth: 130, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <button className="btn-outline" style={{ fontSize: 18 }} onClick={nextMonth} aria-label="Next month">›</button>
        </div>
      </div>

      {activeHabits.length > 0 && (
        <div className="card" style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <ProgressRing percent={overallPercent} label="this month" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            <div style={{ fontSize: 13, color: 'var(--plum)' }}>
              🔥 Current best streak: <strong>{bestCurrentStreak}</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--plum)' }}>
              🏆 Longest ever: <strong>{bestStreakEver}</strong>
            </div>
            {comparison.lastMonthPercent > 0 && (
              <div style={{ fontSize: 13, color: comparison.deltaPercent >= 0 ? 'var(--cherry)' : 'var(--rose)', fontWeight: 600 }}>
                {comparison.deltaPercent >= 0
                  ? `You're ${comparison.deltaPercent}% ahead of last month`
                  : `${Math.abs(comparison.deltaPercent)}% behind last month`}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600, marginBottom: 8 }}>{year} at a glance</div>
            <YearlyBars values={overallYearly} activeMonth={year === today.getFullYear() ? today.getMonth() : undefined} />
          </div>
        </div>
      )}

      <SuggestionsPanel suggestions={suggestions} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {activeCategories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            editable
            habits={habitsByCategory.get(category.id) ?? []}
            dates={dates}
            dayNumbers={dayNumbers}
            month={month}
            year={year}
            referenceDate={referenceDate}
            onCycle={cycleHabitMark}
            onRenameHabit={renameHabit}
            onArchiveHabit={(id) => archiveHabit(id)}
            onAddHabit={(name) => addHabit(name, null, category.id)}
            onRenameCategory={(name) => renameHabitCategory(category.id, name)}
            onSetCategoryColor={(color) => setHabitCategoryColor(category.id, color)}
            onArchiveCategory={() => archiveHabitCategory(category.id)}
            onCelebrate={setCelebration}
          />
        ))}

        {uncategorized.length > 0 && (
          <CategorySection
            category={{ id: UNCATEGORIZED_ID, name: 'Uncategorized', color: 'var(--pink-pale)', archived: false, order: -1 }}
            editable={false}
            habits={uncategorized}
            dates={dates}
            dayNumbers={dayNumbers}
            month={month}
            year={year}
            referenceDate={referenceDate}
            onCycle={cycleHabitMark}
            onRenameHabit={renameHabit}
            onArchiveHabit={(id) => archiveHabit(id)}
            onAddHabit={(name) => addHabit(name, null, null)}
            onCelebrate={setCelebration}
          />
        )}
      </DndContext>

      {activeCategories.length === 0 && uncategorized.length === 0 && (
        <p style={{ color: 'var(--rose)', marginBottom: 20 }}>
          No categories yet — add one below (e.g. Body, Skincare, Mind, Study, Sleep) and start tracking.
        </p>
      )}

      {addingCategory ? (
        <form onSubmit={handleAddCategory} className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--rose)', marginBottom: 12 }}>New Category</div>
          <input
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name (e.g. Study)"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--pink-pale)', fontSize: 14, marginBottom: 14 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {CATEGORY_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCategoryColor(c)}
                aria-label={`Use color ${c}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c,
                  border: c === newCategoryColor ? '2px solid var(--ink)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" type="submit">Add Category</button>
            <button type="button" className="btn btn-secondary" onClick={() => setAddingCategory(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn" style={{ marginBottom: 32 }} onClick={() => setAddingCategory(true)}>
          + Add Category
        </button>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'var(--card-bg)', borderRadius: 12, padding: '12px 18px', boxShadow: '0 4px 14px rgba(89,13,34,0.06)', marginBottom: 24, flexWrap: 'wrap' }}>
        <Legend color="var(--bg)" label="Not done" />
        <Legend color="var(--pink-light)" label="Partial" />
        <Legend color="var(--rose)" label="Done" />
      </div>

      {(archivedCategories.length > 0 || archivedHabits.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <button className="btn-outline" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide' : 'Show'} Archived ({archivedCategories.length + archivedHabits.length})
          </button>
          {showArchived && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {archivedCategories.map((c) => (
                <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                  <span style={{ fontSize: 13.5 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color, marginRight: 8 }} />
                    {c.name} <span style={{ color: 'var(--rose)' }}>(category)</span>
                  </span>
                  {confirmDeleteCategoryId === c.id ? (
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--plum)' }}>Delete permanently?</span>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { deleteHabitCategory(c.id); setConfirmDeleteCategoryId(null) }}>Yes</button>
                      <button className="btn-outline" onClick={() => setConfirmDeleteCategoryId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', gap: 14 }}>
                      <button className="btn-outline" onClick={() => archiveHabitCategory(c.id, false)}>Unarchive</button>
                      <button className="btn-outline" style={{ opacity: 0.75 }} onClick={() => setConfirmDeleteCategoryId(c.id)}>Delete</button>
                    </span>
                  )}
                </div>
              ))}
              {archivedHabits.map((h) => (
                <div key={h.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                  <span style={{ fontSize: 13.5 }}>{h.name} <span style={{ color: 'var(--rose)' }}>(habit)</span></span>
                  {confirmDeleteHabitId === h.id ? (
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--plum)' }}>Delete permanently?</span>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { deleteHabit(h.id); setConfirmDeleteHabitId(null) }}>Yes</button>
                      <button className="btn-outline" onClick={() => setConfirmDeleteHabitId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', gap: 14 }}>
                      <button className="btn-outline" onClick={() => archiveHabit(h.id, false)}>Unarchive</button>
                      <button className="btn-outline" style={{ opacity: 0.75 }} onClick={() => setConfirmDeleteHabitId(h.id)}>Delete</button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--plum)' }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: color, border: '1px solid var(--pink-pale)' }} />
      {label}
    </div>
  )
}

export default Habits
