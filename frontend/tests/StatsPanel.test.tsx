import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatsPanel } from '../src/components/StatsPanel'
import type { TokenizeResponse } from '../src/types/api'

const RESULT: TokenizeResponse = {
  original_text: 'hello world',
  source_type: 'text',
  tokenizer_mode: 'tiktoken',
  encoding: 'cl100k_base',
  tokens: [
    { index: 0, id: 15339, text: 'hello', is_new: false },
    { index: 1, id: 1917, text: ' wor', is_new: false },
    { index: 2, id: 1918, text: 'ld', is_new: false },
  ],
  token_count: 3,
  character_count: 11,
  word_count: 2,
  tokens_per_word: 1.5,
  tokens_per_character: 3 / 11,
}

describe('StatsPanel', () => {
  it('renders every statistic', () => {
    render(<StatsPanel result={RESULT} />)

    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1.50')).toBeInTheDocument()
    expect(screen.getByText('0.27')).toBeInTheDocument()
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Tokens / word')).toBeInTheDocument()
  })
})
