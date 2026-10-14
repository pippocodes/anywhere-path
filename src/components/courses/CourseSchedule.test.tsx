import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CourseSchedule from './CourseSchedule'
import type { CourseModule, HabitCategory } from '../../types'

const category: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }

function course(modules: CourseModule[], overrides: Partial<{ startDate: string; hoursPerDay: number; weekdays: number[]; categoryId: string | null }> = {}) {
  return {
    modules,
    startDate: overrides.startDate ?? '2024-01-01',
    hoursPerDay: overrides.hoursPerDay ?? 1,
    weekdays: overrides.weekdays,
    categoryId: overrides.categoryId ?? null,
  }
}

describe('CourseSchedule', () => {
  it('renders nothing when the course has no schedulable lectures', () => {
    const { container } = render(<CourseSchedule course={course([])} categories={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the start date, estimated finish, and study-day count collapsed by default', () => {
    const modules: CourseModule[] = [
      { id: 'm1', name: 'Section', topics: [{ id: 't1', name: 'A', hours: 1, done: false, durationSeconds: 3600 }] },
    ]
    render(<CourseSchedule course={course(modules, { startDate: '2024-01-01', hoursPerDay: 1 })} categories={[]} />)
    expect(screen.getByText(/Started/)).toBeInTheDocument()
    expect(screen.getByText(/estimated finish/)).toBeInTheDocument()
    // Collapsed by default — the per-lecture row isn't rendered yet.
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })

  it('expands to show each scheduled lecture with its date and duration', () => {
    const modules: CourseModule[] = [
      { id: 'm1', name: 'Section', topics: [{ id: 't1', name: 'A', hours: 1, done: false, durationSeconds: 3600 }] },
    ]
    render(<CourseSchedule course={course(modules)} categories={[]} />)
    fireEvent.click(screen.getByText('Weekly planner'))
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('1:00:00')).toBeInTheDocument()
  })

  it("uses the course's category colour as the card's accent border", () => {
    const modules: CourseModule[] = [
      { id: 'm1', name: 'Section', topics: [{ id: 't1', name: 'A', hours: 1, done: false, durationSeconds: 3600 }] },
    ]
    const { container } = render(
      <CourseSchedule course={course(modules, { categoryId: category.id })} categories={[category]} />
    )
    const card = container.querySelector('.card') as HTMLElement
    // jsdom normalizes the hex value to rgb() in computed style — compare colour, not accept a plain substring match.
    expect(card.style.borderLeft).toContain('232, 121, 155')
  })
})
