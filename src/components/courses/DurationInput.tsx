import { useId } from 'react'

interface Props {
  seconds: number
  onChange: (seconds: number) => void
  disabled?: boolean
}

function clampInt(value: string, max?: number): number {
  const n = Math.max(0, Math.floor(Number(value) || 0))
  return max !== undefined ? Math.min(n, max) : n
}

/** Separate hours / minutes / seconds number inputs for precise lecture-length entry — the structured counterpart to the free-text parser used by bulk add. */
function DurationInput({ seconds, onChange, disabled }: Props) {
  const idBase = useId()
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  function update(next: { h?: number; m?: number; s?: number }) {
    const nh = next.h ?? h
    const nm = next.m ?? m
    const ns = next.s ?? s
    onChange(nh * 3600 + nm * 60 + ns)
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <Field id={`${idBase}-h`} label="hr" value={h} disabled={disabled} onChange={(v) => update({ h: clampInt(v) })} />
      <Field id={`${idBase}-m`} label="min" value={m} disabled={disabled} onChange={(v) => update({ m: clampInt(v, 59) })} />
      <Field id={`${idBase}-s`} label="sec" value={s} disabled={disabled} onChange={(v) => update({ s: clampInt(v, 59) })} />
    </div>
  )
}

function Field({ id, label, value, disabled, onChange }: { id: string; label: string; value: number; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <div style={{ width: 64 }}>
      <input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', textAlign: 'center' }}
        aria-label={label}
      />
      <label htmlFor={id} style={{ display: 'block', textAlign: 'center', fontSize: 11, color: 'var(--mute)', marginTop: 4 }}>
        {label}
      </label>
    </div>
  )
}

export default DurationInput
