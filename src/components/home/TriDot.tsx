import type { HabitMark } from '../../types'

interface Props {
  mark: HabitMark
  size?: number
  onClick?: () => void
  label?: string
}

/** A quiet, non-gold tri-state dot: solid fill = done, dim fill = partial, empty outline = not done. Used on Home only, where gold is reserved for the single Start action. */
function TriDot({ mark, size = 20, onClick, label }: Props) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    padding: 0,
    background: mark === 2 ? 'var(--text)' : mark === 1 ? 'color-mix(in srgb, var(--text) 42%, transparent)' : 'transparent',
    border: mark === 0 ? '1.5px solid var(--line-strong)' : '1.5px solid transparent',
  }

  if (!onClick) return <span aria-label={label} style={style} />

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (mark === 2 ? 'Done — tap to mark partial' : mark === 1 ? 'Partial — tap to clear' : 'Not done — tap to mark done')}
      style={{ ...style, cursor: 'pointer' }}
    />
  )
}

export default TriDot
