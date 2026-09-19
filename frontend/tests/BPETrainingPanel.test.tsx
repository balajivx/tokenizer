import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BPETrainingPanel } from '../src/components/BPETrainingPanel'
import type { BPETrainingResult } from '../src/types/api'

const sampleTrainedModel: BPETrainingResult = {
  is_trained: true,
  training_text: 'low low low lower newest',
  target_vocab_size: 14,
  initial_vocab_size: 7,
  final_vocab_size: 10,
  total_merges: 3,
  base_characters: [' ', 'e', 'l', 'o', 'r', 's', 'w'],
  merge_rules: [
    { rank: 1, pair: ['l', 'o'], merged_token: 'lo', token_id: 7 },
    { rank: 2, pair: ['lo', 'w'], merged_token: 'low', token_id: 8 },
    { rank: 3, pair: ['e', 'w'], merged_token: 'ew', token_id: 9 },
  ],
  training_steps: [
    { step: 1, pair: ['l', 'o'], frequency: 4, merged_token: 'lo', token_id: 7 },
    { step: 2, pair: ['lo', 'w'], frequency: 4, merged_token: 'low', token_id: 8 },
    { step: 3, pair: ['e', 'w'], frequency: 1, merged_token: 'ew', token_id: 9 },
  ],
  vocabulary: [
    { id: 0, token: ' ', is_base_char: true, rank: null },
    { id: 1, token: 'e', is_base_char: true, rank: null },
    { id: 2, token: 'l', is_base_char: true, rank: null },
    { id: 7, token: 'lo', is_base_char: false, rank: 1 },
    { id: 8, token: 'low', is_base_char: false, rank: 2 },
    { id: 9, token: 'ew', is_base_char: false, rank: 3 },
  ],
}

describe('BPETrainingPanel', () => {
  it('renders untrained state with textarea, presets, and enabled train button', () => {
    const onTrainingTextChange = vi.fn()
    const onTargetVocabSizeChange = vi.fn()
    const onTrain = vi.fn()
    const onReset = vi.fn()

    render(
      <BPETrainingPanel
        trainingText="low low"
        targetVocabSize={16}
        bpeModel={null}
        isLoading={false}
        onTrainingTextChange={onTrainingTextChange}
        onTargetVocabSizeChange={onTargetVocabSizeChange}
        onTrain={onTrain}
        onReset={onReset}
      />,
    )

    expect(screen.getByRole('heading', { name: /1\. BPE Model Training/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type or paste training text/i)).toHaveValue('low low')
    expect(screen.getByRole('button', { name: 'Train BPE Tokenizer' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /Reset BPE Model/i })).not.toBeInTheDocument()
  })

  it('handles preset selection and clear button', () => {
    const onTrainingTextChange = vi.fn()
    const onTargetVocabSizeChange = vi.fn()
    const onTrain = vi.fn()
    const onReset = vi.fn()

    render(
      <BPETrainingPanel
        trainingText="something"
        targetVocabSize={16}
        bpeModel={null}
        isLoading={false}
        onTrainingTextChange={onTrainingTextChange}
        onTargetVocabSizeChange={onTargetVocabSizeChange}
        onTrain={onTrain}
        onReset={onReset}
      />,
    )

    // Click Word Families preset
    fireEvent.click(screen.getByRole('button', { name: 'Word Families' }))
    expect(onTrainingTextChange).toHaveBeenCalledWith(
      'the other others another brother mother father',
    )
    expect(onTargetVocabSizeChange).toHaveBeenCalledWith(25)

    // Click Clear
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onTrainingTextChange).toHaveBeenCalledWith('')
  })

  it('triggers onTrain when Train button is clicked', () => {
    const onTrain = vi.fn()
    render(
      <BPETrainingPanel
        trainingText="low low lower"
        targetVocabSize={16}
        bpeModel={null}
        isLoading={false}
        onTrainingTextChange={vi.fn()}
        onTargetVocabSizeChange={vi.fn()}
        onTrain={onTrain}
        onReset={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Train BPE Tokenizer' }))
    expect(onTrain).toHaveBeenCalledTimes(1)
  })

  it('renders trained model statistics, merge rules, and allows tab switching', () => {
    const onReset = vi.fn()
    render(
      <BPETrainingPanel
        trainingText="low low low lower newest"
        targetVocabSize={14}
        bpeModel={sampleTrainedModel}
        isLoading={false}
        onTrainingTextChange={vi.fn()}
        onTargetVocabSizeChange={vi.fn()}
        onTrain={vi.fn()}
        onReset={onReset}
      />,
    )

    // Status & Stats
    expect(screen.getByText(/Trained \(10 tokens\)/i)).toBeInTheDocument()
    expect(screen.getByText('Initial Base Chars:')).toBeInTheDocument()
    expect(screen.getByText('Total Merges Learned:')).toBeInTheDocument()
    expect(screen.getByText('Final Vocab Size:')).toBeInTheDocument()

    // Default tab: Ordered Merge Rules
    expect(screen.getByRole('table', { name: 'BPE Merge Rules' })).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()

    // Switch to Step-by-Step Merge Log
    fireEvent.click(screen.getByRole('tab', { name: /Step-by-Step Merge Log/i }))
    expect(screen.getByRole('table', { name: 'BPE Training Steps Log' })).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getAllByText('4x')).toHaveLength(2)

    // Switch to Learned Vocabulary
    fireEvent.click(screen.getByRole('tab', { name: /Learned Vocabulary/i }))
    expect(screen.getByRole('table', { name: 'BPE Vocabulary Table' })).toBeInTheDocument()
    expect(screen.getByText('Showing 6 of 6 entries')).toBeInTheDocument()

    // Filter vocabulary
    const searchInput = screen.getByPlaceholderText(/Search vocabulary tokens…/i)
    fireEvent.change(searchInput, { target: { value: 'lo' } })
    expect(screen.getByText('Showing 2 of 6 entries')).toBeInTheDocument()

    // Reset button
    const resetBtn = screen.getByRole('button', { name: 'Reset BPE Model' })
    fireEvent.click(resetBtn)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
