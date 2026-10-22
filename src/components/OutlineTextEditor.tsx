import { useRef, type ChangeEvent } from 'react'
import type { OutlineError } from '../types'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  errors: OutlineError[]
}

/**
 * The outline textarea with a synced line-number gutter and inline
 * per-line error markers — a calm, code-editor-like home for the one
 * roadmap-creation method (plain indented text), not a fancier widget.
 */
function OutlineTextEditor({ value, onChange, placeholder, errors }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lineCount = Math.max(value.split('\n').length, 1)
  const errorLines = new Set(errors.map((e) => e.line))

  function handleScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        padding: 0,
        overflow: 'hidden',
        minHeight: 420,
      }}
    >
      <div
        ref={gutterRef}
        aria-hidden
        style={{
          flexShrink: 0,
          width: 40,
          padding: '18px 0',
          textAlign: 'right',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 13.5,
          lineHeight: 1.6,
          color: 'var(--mute)',
          background: 'rgba(0, 0, 0, 0.15)',
          borderRight: '1px solid var(--line)',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => i + 1).map((n) => (
          <div key={n} style={{ paddingRight: 10, color: errorLines.has(n) ? 'var(--rose)' : 'var(--mute)' }}>
            {n}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="outline-textarea"
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          flex: 1,
          border: 'none',
          borderRadius: 0,
          minHeight: 420,
        }}
      />
    </div>
  )
}

export default OutlineTextEditor
