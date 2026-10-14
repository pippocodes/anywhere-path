import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import CategorySelect from './CategorySelect'
import type { HabitCategory } from '../../types'

function Harness({
  initialCategories,
  usageCount = () => 0,
}: {
  initialCategories: HabitCategory[]
  usageCount?: (id: string) => number
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [value, setValue] = useState<string | null>(null)

  function createCategory(name: string, color: string): HabitCategory {
    const created = { id: `cat-${categories.length + 1}`, name, color, archived: false, order: categories.length }
    setCategories((prev) => [...prev, created])
    return created
  }

  return (
    <CategorySelect
      categories={categories}
      value={value}
      onChange={setValue}
      usageCount={usageCount}
      onCreateCategory={createCategory}
      onRenameCategory={(id, name) => setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))}
      onSetCategoryColor={(id, color) => setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)))}
      onDeleteCategory={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
    />
  )
}

describe('CategorySelect', () => {
  it('defaults to "Other" with no category chosen', () => {
    render(<Harness initialCategories={[]} />)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('opens the dropdown and selects an existing category', () => {
    const study: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }
    render(<Harness initialCategories={[study]} />)
    fireEvent.click(screen.getByText('Other'))
    fireEvent.click(screen.getByRole('button', { name: 'Study' }))
    expect(screen.getAllByText('Study').length).toBeGreaterThan(0)
  })

  it('quick-adds a suggested default category and selects it', () => {
    render(<Harness initialCategories={[]} />)
    fireEvent.click(screen.getByText('Other'))
    fireEvent.click(screen.getByText('+ Body'))
    // The trigger button now shows the newly created "Body" category.
    expect(screen.getAllByText('Body').length).toBeGreaterThan(0)
  })

  it('creates a free-typed category via the inline "+ New category" field', () => {
    render(<Harness initialCategories={[]} />)
    fireEvent.click(screen.getByText('Other'))
    fireEvent.change(screen.getByPlaceholderText('+ New category'), { target: { value: 'Side Projects' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getAllByText('Side Projects').length).toBeGreaterThan(0)
  })

  it('manage panel warns how many courses will move to "Other" before deleting a category', () => {
    const study: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }
    render(<Harness initialCategories={[study]} usageCount={() => 2} />)
    fireEvent.click(screen.getByText('Other'))
    fireEvent.click(screen.getByText('Manage categories'))
    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('This will move 2 courses to "Other".')).toBeInTheDocument()
  })

  it('deleting a category in the manage panel removes it from the list', () => {
    const study: HabitCategory = { id: 'cat-1', name: 'Study', color: '#e8799b', archived: false, order: 0 }
    render(<Harness initialCategories={[study]} />)
    fireEvent.click(screen.getByText('Other'))
    fireEvent.click(screen.getByText('Manage categories'))
    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Yes, delete'))
    expect(screen.queryByText('Study')).not.toBeInTheDocument()
  })
})
