import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VocabularyPanel } from '../src/components/VocabularyPanel'
import type { VocabularyResponse } from '../src/types/api'

describe('VocabularyPanel', () => {
  it('shows an empty message when there is no vocabulary yet', () => {
    render(<VocabularyPanel vocabulary={null} onReset={vi.fn()} />)
    expect(screen.getByText(/No vocabulary yet/)).toBeInTheDocument()
  })

  it('renders id/token/frequency/status for every entry', () => {
    const vocabulary: VocabularyResponse = {
      entries: [
        { id: 0, token: 'the', frequency: 2, is_new: false },
        { id: 1, token: 'fox', frequency: 1, is_new: true },
      ],
      total_tokens: 2,
    }
    render(<VocabularyPanel vocabulary={vocabulary} onReset={vi.fn()} />)

    expect(screen.getByText('the')).toBeInTheDocument()
    expect(screen.getByText('fox')).toBeInTheDocument()
    expect(screen.getByText('existing')).toBeInTheDocument()
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('calls onReset when the reset button is clicked', async () => {
    const onReset = vi.fn()
    render(<VocabularyPanel vocabulary={null} onReset={onReset} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reset vocabulary' }))

    expect(onReset).toHaveBeenCalledOnce()
  })
})
