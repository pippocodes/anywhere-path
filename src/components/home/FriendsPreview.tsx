import { useState } from 'react'
import type { HabitMark } from '../../types'
import Avatar from '../ui/Avatar'
import TriStateRing from '../friends/TriStateRing'

// Sample data only — not a real shared tracker. Uses the real Avatar and
// TriStateRing components (the same ring a shared tracker's "together"
// view uses for each member), so this preview is genuinely interactive
// and theme-aware.
const SAMPLE_MEMBERS = [
  { name: 'You', mark: 2 as HabitMark, colorIndex: 0 },
  { name: 'Jordan', mark: 1 as HabitMark, colorIndex: 1 },
]

/** Home's Friends preview — two members sharing one tracker, click either ring to try it. */
function FriendsPreview() {
  const [marks, setMarks] = useState<HabitMark[]>(SAMPLE_MEMBERS.map((m) => m.mark))

  function cycle(index: number) {
    setMarks((prev) => prev.map((m, i) => (i === index ? (((m + 1) % 3) as HabitMark) : m)))
  }

  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Morning run — shared</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SAMPLE_MEMBERS.map((member, i) => (
          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar label={member.name} size={32} colorIndex={member.colorIndex} />
            <span style={{ flex: 1, fontSize: 13 }}>{member.name}</span>
            <TriStateRing state={marks[i]} onClick={() => cycle(i)} size={28} label={`${member.name}'s mark`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendsPreview
