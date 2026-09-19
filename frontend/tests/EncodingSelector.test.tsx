import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EncodingSelector } from '../src/components/EncodingSelector'

const OPTIONS = [
  { name: 'cl100k_base', is_default: true },
  { name: 'r50k_base', is_default: false },
]

describe('EncodingSelector', () => {
  it('renders every option and marks the default', () => {
    render(<EncodingSelector options={OPTIONS} value="cl100k_base" onChange={vi.fn()} />)
    expect(screen.getByText('cl100k_base (default)')).toBeInTheDocument()
    expect(screen.getByText('r50k_base')).toBeInTheDocument()
  })

  it('calls onChange when the user selects a different encoding', async () => {
    const onChange = vi.fn()
    render(<EncodingSelector options={OPTIONS} value="cl100k_base" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Tiktoken encoding'), 'r50k_base')

    expect(onChange).toHaveBeenCalledWith('r50k_base')
  })
})
