import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import CourseForm, { emptyFormValue, type CourseFormValue } from './CourseForm'

// dnd-kit's useSortable measures elements via ResizeObserver, which jsdom
// doesn't implement — stub it so rendering the sortable lecture/section
// lists doesn't throw. No actual drag is exercised by these tests.
beforeAll(() => {
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error - minimal test stub, not a real observer
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

function Harness() {
  const [value, setValue] = useState<CourseFormValue>(emptyFormValue())
  const [saved, setSaved] = useState<CourseFormValue | null>(null)
  return (
    <>
      <CourseForm value={value} onChange={setValue} onSave={() => setSaved(value)} saveLabel="Save course" />
      {saved && <div data-testid="saved-total">{saved.modules.length}</div>}
    </>
  )
}

describe('CourseForm (direct-entry course builder)', () => {
  it('builds a section with three lectures and totals their durations correctly', () => {
    render(<Harness />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Data Structures & Algorithms'), {
      target: { value: 'Data Structures & Algorithms' },
    })

    fireEvent.click(screen.getByText('+ Add section'))
    fireEvent.change(screen.getByPlaceholderText('Section name'), { target: { value: 'Linear Structures' } })

    fireEvent.click(screen.getByText('+ Add lecture'))
    const titleInputs = () => screen.getAllByPlaceholderText('Lecture title')
    const durationInputs = () => screen.getAllByPlaceholderText('5:22')

    fireEvent.change(titleInputs()[0], { target: { value: 'Intro to Arrays' } })
    fireEvent.change(durationInputs()[0], { target: { value: '5:22' } })

    // Enter in the title field adds the next lecture row.
    fireEvent.keyDown(titleInputs()[0], { key: 'Enter' })
    fireEvent.change(titleInputs()[1], { target: { value: 'Linked Lists' } })
    fireEvent.change(durationInputs()[1], { target: { value: '12:07' } })

    fireEvent.keyDown(titleInputs()[1], { key: 'Enter' })
    fireEvent.change(titleInputs()[2], { target: { value: 'Trees' } })
    fireEvent.change(durationInputs()[2], { target: { value: '1:03:45' } })

    expect(titleInputs()).toHaveLength(3)
    // 5:22 + 12:07 + 1:03:45 = 1:21:14
    expect(screen.getByText('1:21:14 total')).toBeInTheDocument()
    expect(screen.getByText('3 lectures')).toBeInTheDocument()
  })

  it('blocks saving an incomplete course and explains why', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Save course'))
    expect(screen.getByText(/Give the course a title/)).toBeInTheDocument()
    expect(screen.getByText(/Add at least one section/)).toBeInTheDocument()
  })

  it('saves successfully once the course is complete', () => {
    render(<Harness />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Data Structures & Algorithms'), {
      target: { value: 'Web Dev' },
    })
    fireEvent.click(screen.getByText('+ Add section'))
    fireEvent.change(screen.getByPlaceholderText('Section name'), { target: { value: 'Basics' } })
    fireEvent.click(screen.getByText('+ Add lecture'))
    fireEvent.change(screen.getByPlaceholderText('Lecture title'), { target: { value: 'HTML' } })
    fireEvent.change(screen.getByPlaceholderText('5:22'), { target: { value: '10:00' } })

    fireEvent.click(screen.getByText('Save course'))
    expect(screen.getByTestId('saved-total')).toHaveTextContent('1')
  })
})
