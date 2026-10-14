import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { parseDuration, formatDuration } from '../../utils/duration'
import DurationInput from '../courses/DurationInput'

interface Props {
  id: string
  name: string
  seconds: number
  autoFocus?: boolean
  onChangeName: (name: string) => void
  onChangeSeconds: (seconds: number) => void
  onEnter: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/**
 * One editable lecture row for the direct-entry course builder. The
 * duration cell is a free-typed text field (accepts "5:22", "1:05:22",
 * "5m 22s", ...) backed by `parseDuration`, plus the same h/m/s steppers
 * used elsewhere for precise mouse entry — both edit the same seconds value.
 */
function EditableLectureRow({ id, name, seconds, autoFocus, onChangeName, onChangeSeconds, onEnter, onDuplicate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [durationText, setDurationText] = useState(() => (seconds > 0 ? formatDuration(seconds) : ''))
  const [durationInvalid, setDurationInvalid] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus()
  }, [autoFocus])

  function commitDurationText(text: string) {
    setDurationText(text)
    if (text.trim() === '') {
      setDurationInvalid(false)
      onChangeSeconds(0)
      return
    }
    const parsed = parseDuration(text)
    if (parsed === null) {
      setDurationInvalid(true)
      return
    }
    setDurationInvalid(false)
    onChangeSeconds(parsed)
  }

  function blurDurationText() {
    // Snap back to the canonical formatting once editing is done, so stray
    // typed forms (e.g. "5m22s") read consistently as "5:22" afterwards.
    setDurationInvalid(false)
    setDurationText(seconds > 0 ? formatDuration(seconds) : '')
  }

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 4px',
        borderBottom: '1px solid var(--line)',
        flexWrap: 'wrap',
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{ cursor: 'grab', color: 'var(--line)', fontSize: 14, touchAction: 'none', flexShrink: 0 }}
      >
        ⠿
      </span>

      <input
        ref={titleRef}
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter()
          }
        }}
        placeholder="Lecture title"
        style={{ flex: '1 1 160px', minWidth: 0, fontSize: 14, padding: '7px 10px' }}
      />

      <input
        value={durationText}
        onChange={(e) => commitDurationText(e.target.value)}
        onBlur={blurDurationText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
            onEnter()
          }
        }}
        placeholder="5:22"
        aria-label="Duration"
        style={{
          width: 72,
          fontSize: 13,
          padding: '7px 8px',
          textAlign: 'center',
          flexShrink: 0,
          borderColor: durationInvalid ? 'var(--rose)' : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      />

      <div style={{ flexShrink: 0 }}>
        <DurationInput
          seconds={seconds}
          onChange={(s) => {
            onChangeSeconds(s)
            setDurationText(s > 0 ? formatDuration(s) : '')
            setDurationInvalid(false)
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button type="button" onClick={onDuplicate} className="btn-outline" style={{ fontSize: 11.5, opacity: 0.75, padding: '6px 10px' }} aria-label="Duplicate lecture">
          Duplicate
        </button>
        <button type="button" onClick={onDelete} className="btn-outline" style={{ fontSize: 12, opacity: 0.6, padding: '6px 10px' }} aria-label="Delete lecture">
          ✕
        </button>
      </div>
    </motion.div>
  )
}

export default EditableLectureRow
