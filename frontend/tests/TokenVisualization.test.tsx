import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TokenVisualization } from '../src/components/TokenVisualization'
import type { TokenInfo } from '../src/types/api'

describe('TokenVisualization', () => {
  it('renders one chip per token with its decoded text', () => {
    const tokens: TokenInfo[] = [
      { index: 0, id: 13225, text: 'Hello', is_new: false },
      { index: 1, id: 2375, text: 'world', is_new: false },
    ]
    render(<TokenVisualization tokens={tokens} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('switches to Token IDs view and renders the raw token IDs array', async () => {
    const tokens: TokenInfo[] = [
      { index: 0, id: 13225, text: 'Hello', is_new: false },
      { index: 1, id: 2375, text: ' world', is_new: false },
    ]
    render(<TokenVisualization tokens={tokens} />)

    const idsTab = screen.getByRole('tab', { name: /Token IDs/i })
    await userEvent.click(idsTab)

    expect(screen.getByText('[13225,2375]')).toBeInTheDocument()
    expect(screen.getByText('13225')).toBeInTheDocument()
    expect(screen.getByText('2375')).toBeInTheDocument()
  })
})
