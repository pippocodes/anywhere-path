interface Props {
  doneToday: number
  totalHabits: number
  currentStreak: number
}

/** A slim, quiet status line at the top of the Tracker tab — not another big stat card, just "where do I stand right now." */
function TodayStrip({ doneToday, totalHabits, currentStreak }: Props) {
  if (totalHabits === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        fontSize: 13,
        color: 'var(--mute)',
        marginBottom: 18,
      }}
    >
      <span>
        <strong style={{ color: 'var(--cream)' }}>
          {doneToday} of {totalHabits}
        </strong>{' '}
        done today
      </span>
      {currentStreak > 0 && (
        <span>
          <span style={{ color: 'var(--gold)' }}>✦</span>{' '}
          <strong style={{ color: 'var(--cream)' }}>{currentStreak}d</strong> current streak
        </span>
      )}
    </div>
  )
}

export default TodayStrip
