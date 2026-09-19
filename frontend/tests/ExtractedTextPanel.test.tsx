import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExtractedTextPanel } from '../src/components/ExtractedTextPanel'

describe('ExtractedTextPanel', () => {
  it('shows the filename and extracted text', () => {
    render(<ExtractedTextPanel filename="notes.txt" text="hello there" />)
    expect(screen.getByText(/notes.txt/)).toBeInTheDocument()
    expect(screen.getByText('hello there')).toBeInTheDocument()
  })
})
