import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CourseCard from './CourseCard'
import type { Course } from '../../types'

// useExpandedRows persists open/closed state in localStorage keyed by row
// id — clear it between tests so one test's expand doesn't leak into the next.
beforeEach(() => window.localStorage.clear())

const course: Course = {
  id: 'course-1',
  name: 'Anatomy Basics',
  modules: [
    {
      id: 'sub-1',
      name: 'Skeletal System',
      topics: [{ id: 't1', name: 'Bones of the arm', hours: 0, done: false, durationSeconds: 322 }],
    },
  ],
}

function renderCard(overrides: Partial<Course> = {}) {
  const onToggleTopic = vi.fn()
  const onRequestDelete = vi.fn()
  render(
    <MemoryRouter>
      <CourseCard course={{ ...course, ...overrides }} categories={[]} onToggleTopic={onToggleTopic} onRequestDelete={onRequestDelete} />
    </MemoryRouter>
  )
  return { onToggleTopic, onRequestDelete }
}

describe('CourseCard accordion', () => {
  it('starts collapsed and expands to show its subtopic on click', () => {
    renderCard()
    expect(screen.queryByText('Skeletal System')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Anatomy Basics'))
    expect(screen.getByText('Skeletal System')).toBeInTheDocument()
  })

  it('expands a subtopic to reveal its module', () => {
    renderCard()
    fireEvent.click(screen.getByText('Anatomy Basics'))
    fireEvent.click(screen.getByText('Skeletal System'))
    expect(screen.getByText('Bones of the arm')).toBeInTheDocument()
  })

  it('calls onToggleTopic with courseId/moduleId/topicId when a module is ticked', () => {
    const { onToggleTopic } = renderCard()
    fireEvent.click(screen.getByText('Anatomy Basics'))
    fireEvent.click(screen.getByText('Skeletal System'))
    fireEvent.click(screen.getByLabelText('Mark "Bones of the arm" done'))
    expect(onToggleTopic).toHaveBeenCalledWith('course-1', 'sub-1', 't1')
  })

  it('calls onRequestDelete when the X button is clicked, without expanding the card', () => {
    const { onRequestDelete } = renderCard()
    fireEvent.click(screen.getByLabelText('Delete Anatomy Basics'))
    expect(onRequestDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Skeletal System')).not.toBeInTheDocument()
  })

  it('never uses the word "lecture" anywhere in its rendered text', () => {
    renderCard()
    fireEvent.click(screen.getByText('Anatomy Basics'))
    fireEvent.click(screen.getByText('Skeletal System'))
    expect(document.body.textContent?.toLowerCase()).not.toContain('lecture')
  })
})
