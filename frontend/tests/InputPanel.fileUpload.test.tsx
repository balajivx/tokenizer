import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputPanel } from '../src/components/InputPanel'

describe('InputPanel file upload', () => {
  it('calls onUploadFile with the selected file', async () => {
    const onUploadFile = vi.fn()
    render(
      <InputPanel
        inputMode="text"
        text=""
        tokenizerMode="tiktoken"
        onTextChange={vi.fn()}
        onUseDirectTextEntry={vi.fn()}
        onUploadFile={onUploadFile}
        onTokenizerModeChange={vi.fn()}
      />,
    )

    const file = new File(['hello there'], 'notes.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('Upload file') as HTMLInputElement

    await userEvent.upload(input, file)

    expect(onUploadFile).toHaveBeenCalledWith(file)
  })

  it('switches back to direct text entry when that tab is clicked', async () => {
    const onUseDirectTextEntry = vi.fn()
    render(
      <InputPanel
        inputMode="file"
        text="extracted text"
        tokenizerMode="tiktoken"
        onTextChange={vi.fn()}
        onUseDirectTextEntry={onUseDirectTextEntry}
        onUploadFile={vi.fn()}
        onTokenizerModeChange={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Type text' }))

    expect(onUseDirectTextEntry).toHaveBeenCalledOnce()
  })
})
