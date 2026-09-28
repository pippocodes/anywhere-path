import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TopicRow from './TopicRow'
import type { Topic } from '../types'

const topic: Topic = { id: 't1', name: 'Color theory', hours: 2, done: false }

describe('TopicRow', () => {
  it('renders the topic name and hours', () => {
    render(<TopicRow topic={topic} onToggle={() => {}} />)
    expect(screen.getByText('Color theory')).toBeInTheDocument()
    expect(screen.getByText('2h')).toBeInTheDocument()
  })

  it('calls onToggle with the topic id when the checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TopicRow topic={topic} onToggle={onToggle} />)

    await user.click(screen.getByRole('checkbox'))

    expect(onToggle).toHaveBeenCalledWith('t1')
  })
})
