import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TokenVisualization } from '../src/components/TokenVisualization'
import type { TokenInfo } from '../src/types/api'

describe('TokenVisualization (Custom Tokenizer mode)', () => {
  it('visually distinguishes newly created tokens from existing ones', () => {
    const tokens: TokenInfo[] = [
      { index: 0, id: 0, text: 'the', is_new: false },
      { index: 1, id: 5, text: 'brand-new', is_new: true },
    ]
    render(<TokenVisualization tokens={tokens} />)

    const existing = screen.getByText('the').closest('li')
    const created = screen.getByText('brand-new').closest('li')

    expect(existing?.className).not.toMatch(/new/)
    expect(created?.className).toMatch(/new/)
  })
})
