import { useState } from 'react'
import type { Plan } from '../../types'
import { useApp } from '../../hooks/useApp'
import { schedulePlanSteps } from '../../utils/planScheduler'
import { formatDateLabel } from '../../utils/scheduler'
import CategoryChip from '../categories/CategoryChip'

const SOURCE_LABEL: Record<Plan['sourceType'], string> = { course: 'From a course', ai: 'AI-generated', custom: 'Custom goal' }

interface Props {
  plans: Plan[]
  onEdit: (plan: Plan) => void
}

/** List of saved plans below the builder — reopen to edit, or delete with an inline confirm (a plan has nothing cascading from it, unlike a course). */
function SavedPlansList({ plans, onEdit }: Props) {
  const { data, deletePlan } = useApp()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (plans.length === 0) return null

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Your Saved Plans</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plans.map((plan) => {
          const schedule = schedulePlanSteps(plan.steps, { startDate: plan.startDate, hoursPerDay: plan.hoursPerDay, weekdays: plan.weekdays })
          return (
            <div
              key={plan.id}
              className="card card-sweep"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => onEdit(plan)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEdit(plan)}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {plan.title}
                  <CategoryChip categories={data.habitCategories} categoryId={plan.categoryId} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
                  {SOURCE_LABEL[plan.sourceType]} · {plan.steps.length} step{plan.steps.length === 1 ? '' : 's'}
                  {schedule.finishDate && <> · finishes {formatDateLabel(schedule.finishDate)}</>}
                </div>
              </div>
              {confirmId === plan.id ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: 13, color: 'var(--mute)' }}>Delete this plan?</span>
                  <button className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => { deletePlan(plan.id); setConfirmId(null) }}>
                    Yes, delete
                  </button>
                  <button className="btn-outline" style={{ color: 'var(--mute)' }} onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn-outline"
                  style={{ opacity: 0.75, flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmId(plan.id)
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SavedPlansList
