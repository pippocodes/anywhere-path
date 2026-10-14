import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import CategorySection, { type CelebrationKind } from './CategorySection'
import type { Habit, HabitCategory } from '../../types'
import { cycleMark } from '../../utils/habits'

const category: HabitCategory = { id: 'c1', name: 'Study', color: '#ff4d6d', archived: false, order: 0 }

// Mirrors how the real Habits page wires onCycle -> app state -> back down
// as the `habits` prop, so the celebration logic sees real before/after
// transitions across clicks (not a single static snapshot).
function Harness({
  initialHabits,
  onCelebrate,
}: {
  initialHabits: Habit[]
  onCelebrate: (k: CelebrationKind) => void
}) {
  const [habits, setHabits] = useState(initialHabits)
  function handleCycle(habitId: string, date: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id !== habitId ? h : { ...h, marks: { ...h.marks, [date]: cycleMark(h.marks[date]) } }))
    )
  }
  return (
    <CategorySection
      category={category}
      habits={habits}
      dates={['2024-01-01']}
      dayNumbers={[1]}
      month={0}
      year={2024}
      referenceDate={new Date(2024, 0, 1)}
      onCycle={handleCycle}
      onCelebrate={onCelebrate}
    />
  )
}

function habit(id: string, order: number, marks: Record<string, 0 | 1 | 2> = {}): Habit {
  return { id, name: id, courseId: null, categoryId: 'c1', archived: false, order, marks }
}

describe('CategorySection celebration trigger', () => {
  it('fires onCelebrate("day") the moment the last habit in the category becomes done for that date', () => {
    const onCelebrate = vi.fn()
    render(<Harness initialHabits={[habit('h1', 0)]} onCelebrate={onCelebrate} />)

    const cell = screen.getByTitle('2024-01-01')
    fireEvent.click(cell) // 0 -> 1 (partial) — not a completion
    expect(onCelebrate).not.toHaveBeenCalled()

    fireEvent.click(cell) // 1 -> 2 (done) — now the whole (1-habit) category is perfect for this day
    expect(onCelebrate).toHaveBeenCalledWith('day')
    expect(onCelebrate).toHaveBeenCalledTimes(1)
  })

  it('does not celebrate while any habit in the category is still incomplete', () => {
    const onCelebrate = vi.fn()
    render(<Harness initialHabits={[habit('h1', 0), habit('h2', 1)]} onCelebrate={onCelebrate} />)

    const cells = screen.getAllByTitle('2024-01-01')
    fireEvent.click(cells[0])
    fireEvent.click(cells[0]) // h1 -> done, h2 still untouched
    expect(onCelebrate).not.toHaveBeenCalled()
  })

  it('celebrates once both habits in the category are done, on whichever completes last', () => {
    const onCelebrate = vi.fn()
    render(<Harness initialHabits={[habit('h1', 0), habit('h2', 1)]} onCelebrate={onCelebrate} />)

    const cells = screen.getAllByTitle('2024-01-01')
    fireEvent.click(cells[0])
    fireEvent.click(cells[0]) // h1 -> done
    expect(onCelebrate).not.toHaveBeenCalled()

    fireEvent.click(cells[1])
    fireEvent.click(cells[1]) // h2 -> done -> now perfect
    expect(onCelebrate).toHaveBeenCalledWith('day')
    expect(onCelebrate).toHaveBeenCalledTimes(1)
  })

  it('re-fires on re-completing a day after it was un-ticked, but not on every click in between', () => {
    const onCelebrate = vi.fn()
    render(<Harness initialHabits={[habit('h1', 0, { '2024-01-01': 2 })]} onCelebrate={onCelebrate} />)

    const cell = screen.getByTitle('2024-01-01')
    fireEvent.click(cell) // 2 -> 0
    fireEvent.click(cell) // 0 -> 1
    expect(onCelebrate).not.toHaveBeenCalled()
    fireEvent.click(cell) // 1 -> 2, completes again
    expect(onCelebrate).toHaveBeenCalledTimes(1)
  })
})
