import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
  computeBestStreak,
  computeCurrentStreak,
} from '../utils/habits'
import {
  dailyCompletionSeries,
  perHabitCompletion,
  weekdayPattern,
  countPerfectDays,
  yearHeatmapData,
  bestMonthOfYear,
  totalTicksInYear,
} from '../utils/habitStats'
import { generateSuggestions } from '../utils/suggestions'
import CategorySection, { type CelebrationKind } from '../components/habits/CategorySection'
import ProgressRing from '../components/habits/ProgressRing'
import SuggestionsPanel from '../components/habits/SuggestionsPanel'
import Confetti from '../components/habits/Confetti'
import HabitManageSheet from '../components/habits/HabitManageSheet'
import NextStepOfferModal, { type NextItemOffer } from '../components/habits/NextStepOfferModal'
import MonthStats from '../components/habits/MonthStats'
import CategoryYearRings from '../components/habits/CategoryYearRings'
import DailyCompletionChart from '../components/habits/charts/DailyCompletionChart'
import PerHabitBarChart from '../components/habits/charts/PerHabitBarChart'
import WeekdayPatternChart from '../components/habits/charts/WeekdayPatternChart'
import MonthlyBarChart from '../components/habits/charts/MonthlyBarChart'
import YearHeatmap from '../components/habits/charts/YearHeatmap'
import Pills from '../components/ui/Pills'
import RevealHeading from '../components/ui/RevealHeading'
import EmptyState from '../components/ui/EmptyState'
import CountUp from '../components/motion/CountUp'
import type { Habit } from '../types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CELEBRATION_MESSAGE: Record<CelebrationKind, string> = {
  day: 'Perfect day',
  week: 'Perfect week',
  month: 'Perfect month',
}

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

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
    toggleTopic,
    togglePlanStep,
  } = useApp()

  const referenceDate = useMemo(() => new Date(), [])
  const today = referenceDate
  const [view, setView] = useState<'month' | 'year'>('month')
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [celebration, setCelebration] = useState<CelebrationKind | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [nextOffer, setNextOffer] = useState<NextItemOffer | null>(null)

  function handleConfirmNextOffer() {
    if (!nextOffer) return
    if (nextOffer.kind === 'course') toggleTopic(nextOffer.courseId, nextOffer.moduleId, nextOffer.topicId)
    else togglePlanStep(nextOffer.planId, nextOffer.stepId)
    setNextOffer(null)
  }

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
  const bestStreakEver = activeHabits.reduce((max, h) => Math.max(max, computeBestStreak(h)), 0)
  const bestCurrentStreak = activeHabits.reduce((max, h) => Math.max(max, computeCurrentStreak(h, referenceDate)), 0)
  const perfectDays = countPerfectDays(activeHabits, month, year)

  const suggestions = useMemo(
    () => generateSuggestions(data.habits, data.habitCategories, referenceDate),
    [data.habits, data.habitCategories, referenceDate]
  )

  const dailySeries = useMemo(() => dailyCompletionSeries(activeHabits, month, year), [activeHabits, month, year])
  const perHabitSeries = useMemo(
    () =>
      perHabitCompletion(activeHabits, month, year)
        .sort((a, b) => b.percent - a.percent)
        .map((d) => ({ name: d.habit.name, percent: d.percent })),
    [activeHabits, month, year]
  )
  const weekdaySeries = useMemo(() => weekdayPattern(activeHabits, month, year), [activeHabits, month, year])

  const yearlyMonthly = useMemo(() => yearlyCompletion(activeHabits, year), [activeHabits, year])
  const heatmap = useMemo(() => yearHeatmapData(activeHabits, year), [activeHabits, year])
  const bestMonth = useMemo(() => bestMonthOfYear(activeHabits, year), [activeHabits, year])
  const totalTicks = useMemo(() => totalTicksInYear(activeHabits, year), [activeHabits, year])

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
      {celebration &&
        createPortal(
          <>
            <Confetti onDone={() => setCelebration(null)} />
            {/* Centering (left:50% + translateX(-50%)) lives on this plain,
                non-animated div — Framer Motion owns `transform` on the
                motion.div below for its y/scale entrance, so a translate set
                there directly gets overwritten the moment it animates.
                Portalled to document.body so position:fixed is relative to
                the real viewport, not the animated route-transition
                wrapper in App.tsx (which sets its own `transform` on `y`). */}
            <div
              role="status"
              style={{
                position: 'fixed',
                top: 90,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'var(--ink-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--cream)',
                  padding: '10px 22px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: '0 12px 32px var(--shadow)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--gold)', marginRight: 6 }}>✦</span>
                {CELEBRATION_MESSAGE[celebration]}
              </motion.div>
            </div>
          </>,
          document.body
        )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
            Habit Tracker
          </RevealHeading>
          <Pills options={VIEW_OPTIONS} value={view} onChange={(v) => setView(v as 'month' | 'year')} layoutId="habit-view-tab" size="sm" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {view === 'month' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px' }}>
              <button className="btn-outline" style={{ fontSize: 18 }} onClick={prevMonth} aria-label="Previous month">‹</button>
              <div style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: 'center' }}>
                {MONTH_NAMES[month]} {year}
              </div>
              <button className="btn-outline" style={{ fontSize: 18 }} onClick={nextMonth} aria-label="Next month">›</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px' }}>
              <button className="btn-outline" style={{ fontSize: 18 }} onClick={() => setYear((y) => y - 1)} aria-label="Previous year">‹</button>
              <div style={{ fontWeight: 700, fontSize: 14, minWidth: 60, textAlign: 'center' }}>{year}</div>
              <button className="btn-outline" style={{ fontSize: 18 }} onClick={() => setYear((y) => y + 1)} aria-label="Next year">›</button>
            </div>
          )}
          <button className="btn" onClick={() => setManageOpen(true)}>
            Manage
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'month' ? (
          <motion.div key="month" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {activeHabits.length > 0 && (
              <>
                <MonthStats completionPercent={overallPercent} currentStreak={bestCurrentStreak} bestStreak={bestStreakEver} perfectDays={perfectDays} />

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 280px) 1fr', gap: 20, marginBottom: 24 }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <ProgressRing percent={overallPercent} label="this month" />
                  </div>
                  <div className="card">
                    <DailyCompletionChart data={dailySeries} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div className="card">
                    <PerHabitBarChart data={perHabitSeries} />
                  </div>
                  <div className="card">
                    <WeekdayPatternChart data={weekdaySeries} />
                  </div>
                </div>
              </>
            )}

            <SuggestionsPanel suggestions={suggestions} />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <AnimatePresence initial={false}>
                {activeCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <CategorySection
                      category={category}
                      habits={habitsByCategory.get(category.id) ?? []}
                      courses={data.courses}
                      plans={data.plans}
                      dates={dates}
                      dayNumbers={dayNumbers}
                      month={month}
                      year={year}
                      referenceDate={referenceDate}
                      onCycle={cycleHabitMark}
                      onCelebrate={setCelebration}
                      onOfferNext={setNextOffer}
                      onManage={() => setManageOpen(true)}
                    />
                  </motion.div>
                ))}

                {uncategorized.length > 0 && (
                  <motion.div key={UNCATEGORIZED_ID} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CategorySection
                      category={{ id: UNCATEGORIZED_ID, name: 'Uncategorized', color: 'var(--mute)', archived: false, order: -1 }}
                      habits={uncategorized}
                      courses={data.courses}
                      plans={data.plans}
                      dates={dates}
                      dayNumbers={dayNumbers}
                      month={month}
                      year={year}
                      referenceDate={referenceDate}
                      onCycle={cycleHabitMark}
                      onCelebrate={setCelebration}
                      onOfferNext={setNextOffer}
                      onManage={() => setManageOpen(true)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </DndContext>

            {activeCategories.length === 0 && uncategorized.length === 0 && (
              <div style={{ marginBottom: 24 }}>
                <EmptyState
                  title="Nothing to track yet"
                  description="Add your first habit — pick a category like Body, Mind, Study, or Sleep, and start ticking days off."
                  actionLabel="Add your first habit"
                  onAction={() => setManageOpen(true)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 18px', marginBottom: 24, flexWrap: 'wrap' }}>
              <Legend swatch="transparent" border label="Not done" />
              <Legend swatch="color-mix(in srgb, var(--accent) 25%, transparent)" label="Partial" />
              <Legend swatch="var(--gradient-primary)" label="Done" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="year" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 24 }}>
              <StatCard value={totalTicks} label="Total Ticks" />
              {bestMonth && <StatCard value={bestMonth.percent} suffix="%" label={`Best Month: ${MONTH_NAMES[bestMonth.month]}`} />}
              <StatCard value={activeCategories.length} label="Categories" />
              <StatCard value={activeHabits.length} label="Active Habits" />
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <YearHeatmap days={heatmap} year={year} />
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <MonthlyBarChart values={yearlyMonthly} activeMonth={year === today.getFullYear() ? today.getMonth() : undefined} />
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <CategoryYearRings categories={activeCategories} habitsByCategory={habitsByCategory} year={year} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HabitManageSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        categories={activeCategories}
        archivedCategories={archivedCategories}
        habitsByCategory={habitsByCategory}
        uncategorizedHabits={uncategorized}
        archivedHabits={archivedHabits}
        courses={data.courses}
        plans={data.plans}
        addHabit={(input) => addHabit(input.name, input.categoryId, { courseId: input.courseId, planId: input.planId, targetSeconds: input.targetSeconds })}
        renameHabit={renameHabit}
        archiveHabit={archiveHabit}
        deleteHabit={deleteHabit}
        addHabitCategory={addHabitCategory}
        renameHabitCategory={renameHabitCategory}
        setHabitCategoryColor={setHabitCategoryColor}
        archiveHabitCategory={archiveHabitCategory}
        deleteHabitCategory={deleteHabitCategory}
      />

      <NextStepOfferModal offer={nextOffer} onConfirm={handleConfirmNextOffer} onDismiss={() => setNextOffer(null)} />
    </div>
  )
}

function StatCard({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 28 }}>
        <CountUp value={value} suffix={suffix ?? ''} />
      </div>
      <div className="micro-label" style={{ marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

function Legend({ swatch, border, label }: { swatch: string; border?: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--mute)' }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: swatch, border: border ? '1px solid var(--line)' : 'none' }} />
      {label}
    </div>
  )
}

export default Habits
