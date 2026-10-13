import type { Suggestion } from '../../utils/suggestions'

const ICON: Record<Suggestion['type'], string> = {
  'weekend-skip': '📅',
  'beat-streak': '🔥',
  'category-decline': '📉',
  'focus-habit': '🎯',
}

function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15.5, marginBottom: 14 }}>Based on your data</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {suggestions.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--bg)',
              borderRadius: 10,
              fontSize: 13.5,
              color: 'var(--plum)',
            }}
          >
            <span aria-hidden="true">{ICON[s.type]}</span>
            <span>{s.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SuggestionsPanel
