import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TokenizeButton } from '../src/components/TokenizeButton'

describe('TokenizeButton', () => {
  it('is disabled when input is empty', () => {
    render(<TokenizeButton onClick={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Tokenize' })).toBeDisabled()
  })

  it('calls onClick when enabled and clicked', async () => {
    const onClick = vi.fn()
    render(<TokenizeButton onClick={onClick} disabled={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Tokenize' }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
