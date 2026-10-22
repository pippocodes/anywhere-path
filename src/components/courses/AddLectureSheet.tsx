import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Pills from '../ui/Pills'
import DurationInput from './DurationInput'
import { parseBulkLectures } from '../../utils/bulkLectures'
import { formatDuration } from '../../utils/duration'

interface Props {
  open: boolean
  onClose: () => void
  moduleName: string
  onAdd: (lectures: { name: string; durationSeconds: number }[]) => void
}

const MODE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'bulk', label: 'Bulk add' },
]

/** Side sheet for adding lectures to one section — single form, or paste-a-list bulk add with a live preview. */
function AddLectureSheet({ open, onClose, moduleName, onAdd }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // single-add state
  const [title, setTitle] = useState('')
  const [seconds, setSeconds] = useState(0)

  // bulk-add state
  const [bulkText, setBulkText] = useState('')
  const bulkResult = parseBulkLectures(bulkText)

  function reset() {
    setTitle('')
    setSeconds(0)
    setBulkText('')
    setMode('single')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSingleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || seconds <= 0) return
    onAdd([{ name: trimmed, durationSeconds: seconds }])
    handleClose()
  }

  function handleBulkSubmit() {
    if (bulkResult.valid.length === 0) return
    onAdd(bulkResult.valid.map((v) => ({ name: v.title, durationSeconds: v.durationSeconds })))
    handleClose()
  }

  const bulkTotalSeconds = bulkResult.valid.reduce((sum, v) => sum + v.durationSeconds, 0)

  return (
    <Modal open={open} onClose={handleClose} variant="sheet" title={`Add lectures — ${moduleName}`}>
      <div style={{ marginBottom: 20 }}>
        <Pills options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as 'single' | 'bulk')} layoutId="add-lecture-mode" size="sm" />
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit}>
          <div className="field">
            <label htmlFor="lecture-title">Lecture title</label>
            <input
              id="lecture-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Intro to Arrays"
              required
            />
          </div>
          <div className="field">
            <label>Duration</label>
            <DurationInput seconds={seconds} onChange={setSeconds} />
            {seconds > 0 && (
              <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 8, marginBottom: 0 }}>
                = {formatDuration(seconds)}
              </p>
            )}
          </div>
          <Button type="submit" disabled={!title.trim() || seconds <= 0} style={{ width: '100%' }}>
            Add lecture
          </Button>
        </form>
      ) : (
        <div>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 10 }}>
            One lecture per line: <code>Intro to Arrays (5:22)</code>. Also accepts <code>5:22</code>,{' '}
            <code>1:05:22</code>, or <code>5m 22s</code>.
          </p>
          <textarea
            className="outline-textarea"
            style={{ minHeight: 140 }}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Intro to Arrays (5:22)\nLinked Lists (12:07)\nTrees (1:03:45)'}
            spellCheck={false}
          />

          {bulkText.trim() && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="micro-label" style={{ marginBottom: 0 }}>
                  Preview
                </span>
                {bulkResult.valid.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>
                    {bulkResult.valid.length} lecture{bulkResult.valid.length === 1 ? '' : 's'} · {formatDuration(bulkTotalSeconds)} total
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {bulkResult.lines.map((l) => (
                  <motion.div
                    key={l.line}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      background: l.error ? 'color-mix(in srgb, var(--danger) 8%, transparent)' : 'var(--surface)',
                      border: `1px solid ${l.error ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'var(--line)'}`,
                      color: l.error ? 'var(--rose)' : 'var(--cream)',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <span style={{ color: 'var(--mute)', marginRight: 6 }}>{l.line}.</span>
                      {l.error ? l.raw : l.title}
                    </span>
                    <span style={{ flexShrink: 0, fontWeight: 600 }}>
                      {l.error ? l.error : formatDuration(l.durationSeconds!)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleBulkSubmit} disabled={bulkResult.valid.length === 0} style={{ width: '100%', marginTop: 16 }}>
            Add {bulkResult.valid.length || ''} lecture{bulkResult.valid.length === 1 ? '' : 's'}
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default AddLectureSheet
