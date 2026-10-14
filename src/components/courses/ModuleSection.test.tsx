import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ModuleSection, { type ModuleSectionActions } from './ModuleSection'
import type { CourseModule } from '../../types'

beforeAll(() => {
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error - minimal test stub, dnd-kit's useSortable needs this in jsdom
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

function makeActions(): ModuleSectionActions {
  return {
    toggleTopic: vi.fn(),
    deleteTopic: vi.fn(),
    reorderTopics: vi.fn(),
    renameModule: vi.fn(),
    deleteModule: vi.fn(),
    addModule: vi.fn(),
  }
}

describe('ModuleSection', () => {
  it('renders a nested sub-module\'s lectures, not just the top-level section\'s own', () => {
    const subModule: CourseModule = {
      id: 'sub-1',
      name: 'Sub-module',
      topics: [{ id: 't1', name: 'Nested lecture', hours: 1, done: false, durationSeconds: 3600 }],
    }
    const section: CourseModule = { id: 'm1', name: 'Section', topics: [], modules: [subModule] }

    render(<ModuleSection courseId="course-1" module={section} onAddLectures={vi.fn()} actions={makeActions()} />)

    expect(screen.getByText('Nested lecture')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sub-module')).toBeInTheDocument()
  })

  it('does not offer "+ Add sub-module" past the 3-level nesting cap', () => {
    const level3: CourseModule = { id: 'm3', name: 'Sub-module', topics: [] }
    const level2: CourseModule = { id: 'm2', name: 'Module', topics: [], modules: [level3] }
    const level1: CourseModule = { id: 'm1', name: 'Section', topics: [], modules: [level2] }

    render(<ModuleSection courseId="course-1" module={level1} onAddLectures={vi.fn()} actions={makeActions()} />)

    // Depths 1 and 2 can each add one more level; depth 3 (the innermost "Sub-module") cannot.
    expect(screen.getAllByText(/\+ Add (Module|Sub-module)/)).toHaveLength(2)
  })

  it('calls addModule with the correct parent id when adding a sub-module', () => {
    const section: CourseModule = { id: 'm1', name: 'Section', topics: [] }
    const actions = makeActions()
    render(<ModuleSection courseId="course-1" module={section} onAddLectures={vi.fn()} actions={actions} />)

    fireEvent.click(screen.getByText('+ Add Module'))
    fireEvent.change(screen.getByPlaceholderText('Module name'), { target: { value: 'New sub' } })
    fireEvent.click(screen.getByText('Add'))

    expect(actions.addModule).toHaveBeenCalledWith('course-1', 'New sub', 'm1')
  })

  it('calls onAddLectures with the specific nested module\'s id, not the top-level section\'s', () => {
    const subModule: CourseModule = { id: 'sub-1', name: 'Sub-module', topics: [] }
    const section: CourseModule = { id: 'm1', name: 'Section', topics: [], modules: [subModule] }
    const onAddLectures = vi.fn()

    render(<ModuleSection courseId="course-1" module={section} onAddLectures={onAddLectures} actions={makeActions()} />)

    const addButtons = screen.getAllByText('+ Add lectures')
    fireEvent.click(addButtons[1]) // the nested sub-module's own button
    expect(onAddLectures).toHaveBeenCalledWith('sub-1', 'Sub-module')
  })
})
