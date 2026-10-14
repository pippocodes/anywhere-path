import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import CourseOutlineEditor from './CourseOutlineEditor'
import type { Course, HabitCategory } from '../../types'

const noCategoryProps = {
  categories: [] as HabitCategory[],
  usageCount: () => 0,
  onCreateCategory: vi.fn((name: string, color: string) => ({ id: 'cat-1', name, color, archived: false, order: 0 })),
  onRenameCategory: vi.fn(),
  onSetCategoryColor: vi.fn(),
  onDeleteCategory: vi.fn(),
}

function Harness({ onSave }: { onSave: (courses: Pick<Course, 'id' | 'name' | 'modules' | 'categoryId'>[]) => void }) {
  const [value, setValue] = useState('')
  return <CourseOutlineEditor value={value} onChange={setValue} onSave={onSave} saveLabel="Save course(s)" {...noCategoryProps} />
}

describe('CourseOutlineEditor (text-outline course builder)', () => {
  it('shows a live preview with the correct rolled-up total as the user types', () => {
    render(<Harness onSave={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(/Skeletal System/)
    fireEvent.change(textarea, {
      target: {
        value: ['Anatomy', '  Section', '    Lecture A (5:22)', '    Lecture B (12:07)', '    Lecture C (1:03:45)'].join('\n'),
      },
    })
    expect(screen.getByText('1 course will be created')).toBeInTheDocument()
    // 5:22 + 12:07 + 1:03:45 = 1:21:14, shown on the course preview card.
    expect(screen.getByText('3 lectures · 1:21:14')).toBeInTheDocument()
  })

  it('counts multiple unindented roots as separate courses', () => {
    render(<Harness onSave={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(/Skeletal System/)
    fireEvent.change(textarea, {
      target: { value: ['Course A', '  Section\n    Lecture (2h)', 'Course B', '  Section\n    Lecture (1h)'].join('\n') },
    })
    expect(screen.getByText('2 courses will be created')).toBeInTheDocument()
  })

  it('shows a friendly, line-numbered error and blocks saving until fixed', () => {
    const onSave = vi.fn()
    render(<Harness onSave={onSave} />)
    const textarea = screen.getByPlaceholderText(/Skeletal System/)
    fireEvent.change(textarea, { target: { value: 'Course\n  Section\n    Lecture with no duration' } })
    expect(screen.getByText(/needs a duration, like \(5:22\)/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Save course(s)'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with real Course objects once the outline is valid', () => {
    const onSave = vi.fn()
    render(<Harness onSave={onSave} />)
    const textarea = screen.getByPlaceholderText(/Skeletal System/)
    fireEvent.change(textarea, { target: { value: 'Course\n  Section\n    Lecture (5:22)' } })
    fireEvent.click(screen.getByText('Save course(s)'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const [courses] = onSave.mock.calls[0]
    expect(courses).toHaveLength(1)
    expect(courses[0].name).toBe('Course')
    expect(courses[0].modules[0].topics[0]).toMatchObject({ name: 'Lecture', durationSeconds: 322 })
  })
})
