import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import { daysInMonth, monthDates, monthCompletionPercent } from '../utils/habits'
import HabitRow from '../components/HabitRow'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function Habits() {
  const { data, cycleHabitMark, deleteHabit, addHabit } = useApp()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [newHabitName, setNewHabitName] = useState('')

  const dim = daysInMonth(month, year)
  const dates = useMemo(() => monthDates(month, year), [month, year])
  const dayNumbers = useMemo(() => Array.from({ length: dim }, (_, i) => i + 1), [dim])
  const completion = useMemo(
    () => monthCompletionPercent(data.habits, month, year),
    [data.habits, month, year]
  )

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function handleAddHabit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newHabitName.trim()
    if (!trimmed) return
    addHabit(trimmed)
    setNewHabitName('')
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <h1 className="page-title">Habit Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-bg)', borderRadius: 12, padding: '8px 14px', boxShadow: '0 4px 14px rgba(89,13,34,0.06)' }}>
          <button className="btn-outline" style={{ fontSize: 18 }} onClick={prevMonth}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 15, minWidth: 130, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <button className="btn-outline" style={{ fontSize: 18 }} onClick={nextMonth}>›</button>
        </div>
      </div>

      <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Add a habit manually (e.g. Read 20 minutes)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--pink-pale)', fontSize: 14 }}
        />
        <button className="btn" type="submit">Add Habit</button>
      </form>

      {data.habits.length === 0 ? (
        <p style={{ color: 'var(--rose)' }}>
          No habits yet — add one above, or build a roadmap for a course to get one automatically.
        </p>
      ) : (
        <div className="card" style={{ padding: 20, overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12.5, color: 'var(--rose)', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--card-bg)' }}>
                  Habit
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} style={{ padding: '4px 3px', fontSize: 10.5, color: 'var(--rose)', fontWeight: 600, minWidth: 22 }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.habits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} dates={dates} onCycle={cycleHabitMark} onDelete={deleteHabit} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'var(--card-bg)', borderRadius: 12, padding: '12px 18px', boxShadow: '0 4px 14px rgba(89,13,34,0.06)' }}>
          <Legend color="var(--bg)" label="Not done" />
          <Legend color="var(--pink-light)" label="Partial" />
          <Legend color="var(--rose)" label="Done" />
        </div>
        <div className="card" style={{ padding: '16px 24px', textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>This Month</div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 24 }}>{completion}% complete</div>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--plum)' }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: color, border: '1px solid var(--pink-pale)' }} />
      {label}
    </div>
  )
}

export default Habits
