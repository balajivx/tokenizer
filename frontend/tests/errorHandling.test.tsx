import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBanner } from '../src/components/StatusBanner'

describe('StatusBanner', () => {
  it('shows a neutral empty-state message with no error text', () => {
    render(<StatusBanner status="empty" errorMessage={null} />)
    expect(screen.getByRole('status')).toHaveTextContent(/enter text or upload a file/i)
  })

  it('shows a loading message distinct from empty/success/error', () => {
    render(<StatusBanner status="loading" errorMessage={null} />)
    expect(screen.getByRole('status')).toHaveTextContent(/tokenizing/i)
  })

  it('shows a success message with no error text', () => {
    render(<StatusBanner status="success" errorMessage={null} />)
    expect(screen.getByRole('status')).toHaveTextContent(/complete/i)
  })

  it.each([
    'Please enter some text or upload a file before tokenizing.',
    'Unsupported file type. Please upload a .txt or .pdf file.',
    'The uploaded file is too large. Please upload a file under 10 MB.',
    'This PDF could not be read. It may be corrupted or invalid.',
    'No text could be found in this PDF. Scanned/image-only PDFs are not supported.',
    "The encoding 'bogus' is not supported.",
  ])('renders the exact backend error message as an alert: %s', (message) => {
    render(<StatusBanner status="error" errorMessage={message} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(message)
    // No unrelated success/loading banner text should leak through alongside the error.
    expect(alert).not.toHaveTextContent(/tokenization complete/i)
  })
})
