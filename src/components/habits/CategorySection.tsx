import { useEffect, useRef, useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course, Habit, HabitCategory, HabitMark, Plan } from '../../types'
import { cycleMark, monthCompletionPercent, computeCurrentStreak, isPerfectDay, isPerfectWeek, isPerfectMonth, toDateStr } from '../../utils/habits'
import { findNextIncompleteTopic, findNextIncompletePlanStep } from '../../utils/nextIncomplete'
import type { NextItemOffer } from './NextStepOfferModal'
import HabitGridRow from './HabitGridRow'
import CountUp from '../motion/CountUp'

export type CelebrationKind = 'day' | 'week' | 'month'

interface Props {
  category: HabitCategory
  habits: Habit[] // already filtered to this category + non-archived, sorted by order
  courses: Course[]
  plans: Plan[]
  dates: string[]
  dayNumbers: number[]
  month: number
  year: number
  referenceDate: Date
  onCycle: (habitId: string, date: string) => void
  onCelebrate: (kind: CelebrationKind) => void
  onOfferNext: (offer: NextItemOffer) => void
  onManage?: () => void // opens the manage sheet focused on this category
  onShare?: (habitId: string) => void
}

function CategorySection({ category, habits, courses, plans, dates, dayNumbers, month, year, referenceDate, onCycle, onCelebrate, onOfferNext, onManage, onShare }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const todayThRef = useRef<HTMLTableCellElement | null>(null)

  const percent = monthCompletionPercent(habits, month, year)
  const bestActiveStreak = habits.reduce((max, h) => Math.max(max, computeCurrentStreak(h, referenceDate)), 0)
  const todayStr = toDateStr(referenceDate)

  // Only matters on narrow screens where the grid actually overflows — on
  // desktop the whole month fits, so this is a no-op scroll.
  useEffect(() => {
    todayThRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [dates, collapsed])

  // Checks, before vs. hypothetically after this tick, whether it's the
  // tick that newly completes a perfect day/week/month for this category —
  // so confetti fires once on the transition, not on every click after.
  function handleCellClick(habitId: string, date: string) {
    const target = habits.find((h) => h.id === habitId)
    const nextMark = cycleMark(target?.marks[date])
    onCycle(habitId, date)
    if (nextMark !== 2 || !target) return

    if (target.courseId) {
      const course = courses.find((c) => c.id === target.courseId)
      const next = course && findNextIncompleteTopic(course)
      if (course && next) {
        onOfferNext({ kind: 'course', habitName: target.name, courseId: course.id, moduleId: next.moduleId, topicId: next.topicId, title: next.title })
      }
    } else if (target.planId) {
      const plan = plans.find((p) => p.id === target.planId)
      const next = plan && findNextIncompletePlanStep(plan)
      if (plan && next) {
        onOfferNext({ kind: 'plan', habitName: target.name, planId: plan.id, stepId: next.stepId, title: next.title })
      }
    }

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
        <button
          className="expandable-header"
          onClick={() => setCollapsed((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-expanded={!collapsed}
        >
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-block', color: 'var(--mute)', fontSize: 14 }}
          >
            ›
          </motion.span>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: category.color, flexShrink: 0 }} />
          <h3 style={{ fontSize: 18 }}>{category.name}</h3>
          <AnimatePresence>
            {bestActiveStreak > 0 && (
              <motion.span
                key={bestActiveStreak}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}
              >
                {bestActiveStreak}d streak
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="micro-label" style={{ marginBottom: 0 }}>
            <CountUp value={percent} suffix="% this month" />
          </div>
          {onManage && (
            <button className="btn-outline" onClick={onManage}>
              Manage
            </button>
          )}
        </div>
      </div>

      <div className="progress-track" style={{ marginTop: 14, marginBottom: collapsed ? 0 : 16 }}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: category.color }}
        />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {habits.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--mute)' }}>No habits here yet — add one from Manage.</p>
            ) : (
              <div style={{ overflowX: 'auto' }} onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}>
                <table className="habit-grid-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th
                        className="habit-grid-name-cell"
                        style={{
                          textAlign: 'left',
                          padding: '6px 12px',
                          fontSize: 12.5,
                          color: 'var(--mute)',
                          fontWeight: 600,
                          position: 'sticky',
                          left: 0,
                          background: 'var(--surface)',
                          backdropFilter: 'blur(14px)',
                          boxShadow: scrolled ? 'inset -8px 0 8px -8px rgba(0,0,0,.35)' : 'none',
                        }}
                      >
                        Habit
                      </th>
                      {dayNumbers.map((d, i) => (
                        <th
                          key={d}
                          ref={dates[i] === todayStr ? todayThRef : undefined}
                          className="habit-grid-day-th"
                          style={{
                            padding: '4px 0',
                            fontSize: 10.5,
                            color: dates[i] === todayStr ? 'var(--gold)' : 'var(--mute)',
                            fontWeight: 600,
                          }}
                        >
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
                          courses={courses}
                          plans={plans}
                          dates={dates}
                          referenceDate={referenceDate}
                          onCycle={handleCellClick}
                          onShare={onShare}
                          scrolled={scrolled}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategorySection
