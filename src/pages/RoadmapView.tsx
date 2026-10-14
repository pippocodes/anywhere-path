import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { parseOutline, computeTotalMinutes, formatHours } from '../utils/outlineParser'
import { scheduleOutline, formatDateLabel } from '../utils/scheduler'
import { computeProgress } from '../utils/roadmapProgress'
import { toDateStr } from '../utils/habits'
import OutlineNodeView from '../components/OutlineNodeView'
import ProgressRing from '../components/habits/ProgressRing'
import CountUp from '../components/motion/CountUp'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import RevealHeading from '../components/ui/RevealHeading'
import NotFound from './NotFound'

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

function RoadmapView() {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const { data, updateRoadmapDoc, deleteRoadmapDoc } = useApp()

  const doc = data.roadmapDocs.find((d) => d.id === docId)
  const parsed = useMemo(() => parseOutline(doc?.outlineText ?? ''), [doc?.outlineText])
  const totalMinutes = useMemo(() => computeTotalMinutes(parsed.nodes), [parsed.nodes])
  const schedule = useMemo(
    () =>
      scheduleOutline(parsed.nodes, {
        startDate: doc?.startDate ?? toDateStr(new Date()),
        hoursPerDay: doc?.hoursPerDay ?? 2,
        weekdays: doc?.weekdays ?? DEFAULT_WEEKDAYS,
      }),
    [parsed.nodes, doc?.startDate, doc?.hoursPerDay, doc?.weekdays]
  )
  const progress = useMemo(() => computeProgress(parsed.nodes, doc?.completedPaths), [parsed.nodes, doc?.completedPaths])
  const completedIds = useMemo(() => new Set(doc?.completedPaths ?? []), [doc?.completedPaths])

  if (!doc) return <NotFound />

  function toggleComplete(id: string) {
    if (!doc) return
    const next = new Set(doc.completedPaths ?? [])
    if (next.has(id)) next.delete(id)
    else next.add(id)
    updateRoadmapDoc(doc.id, { completedPaths: Array.from(next) })
  }

  function handleDelete() {
    if (!doc) return
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return
    deleteRoadmapDoc(doc.id)
    navigate('/roadmap', { replace: true })
  }

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="micro-label" style={{ marginBottom: 8 }}>
            Roadmap
          </div>
          <RevealHeading as="h1" className="page-title" style={{ marginBottom: 6 }}>
            {doc.title}
          </RevealHeading>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {parsed.nodes.length} topic{parsed.nodes.length === 1 ? '' : 's'} · {formatHours(totalMinutes)} total
            {schedule.finishDate && <> · finishes {formatDateLabel(schedule.finishDate)}</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/roadmap?edit=${doc.id}`)}>
            Edit as text
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Card style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginTop: 28, marginBottom: 24 }}>
          <ProgressRing percent={progress.percent} color="var(--gold)" label="complete" />
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <Stat value={progress.completedCount} label="topics done" />
            <Stat value={progress.totalCount - progress.completedCount} label="topics left" />
            {schedule.totalDays > 0 && <Stat value={schedule.totalDays} label="study days" />}
          </div>
        </Card>
      </motion.div>

      {schedule.finishDate && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: 'var(--mute)',
            marginBottom: 24,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
          }}
        >
          <span className="micro-label" style={{ marginBottom: 0 }}>
            Timeline
          </span>
          <span>
            Started {formatDateLabel(doc.startDate ?? toDateStr(new Date()))} → estimated finish{' '}
            <strong style={{ color: 'var(--cream)' }}>{formatDateLabel(schedule.finishDate)}</strong>
          </span>
        </div>
      )}

      <Card>
        {parsed.nodes.map((node) => (
          <OutlineNodeView
            key={node.id}
            node={node}
            checkable
            completedIds={completedIds}
            onToggleComplete={toggleComplete}
          />
        ))}
      </Card>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 26 }}>
        <CountUp value={value} />
      </div>
      <div className="micro-label" style={{ marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

export default RoadmapView
