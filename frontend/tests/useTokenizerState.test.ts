import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../src/api/client'
import { useTokenizerState } from '../src/state/useTokenizerState'
import type { TokenizeResponse, VocabularyResponse } from '../src/types/api'

vi.mock('../src/api/client', () => ({
  getEncodings: vi.fn(),
  tokenize: vi.fn(),
  getVocabulary: vi.fn(),
  resetVocabulary: vi.fn(),
  extractFile: vi.fn(),
  getBPEModel: vi.fn(),
  trainBPE: vi.fn(),
  resetBPE: vi.fn(),
}))

function makeResult(overrides: Partial<TokenizeResponse> = {}): TokenizeResponse {
  return {
    original_text: 'hi',
    source_type: 'text',
    tokenizer_mode: 'tiktoken',
    encoding: 'cl100k_base',
    tokens: [{ index: 0, id: 1, text: 'hi', is_new: false }],
    token_count: 1,
    character_count: 2,
    word_count: 1,
    tokens_per_word: 1,
    tokens_per_character: 0.5,
    ...overrides,
  }
}

describe('useTokenizerState', () => {
  beforeEach(() => {
    vi.mocked(client.getEncodings).mockResolvedValue({
      encodings: [
        { name: 'cl100k_base', is_default: true },
        { name: 'r50k_base', is_default: false },
      ],
    })
    vi.mocked(client.getVocabulary).mockResolvedValue({ entries: [], total_tokens: 0 })
    vi.mocked(client.getBPEModel).mockResolvedValue({
      is_trained: false,
      target_vocab_size: 16,
      training_text: '',
      base_characters: [],
      merge_rules: [],
      training_steps: [],
      vocabulary: [],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads encodings and BPE model on mount and selects the default', async () => {
    const { result } = renderHook(() => useTokenizerState())

    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))
    expect(result.current.encoding).toBe('cl100k_base')
    expect(client.getBPEModel).toHaveBeenCalled()
    expect(result.current.bpeModel?.is_trained).toBe(false)
  })

  it('rejects tokenizing empty input without calling the API', async () => {
    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    await act(async () => {
      await result.current.tokenize()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toMatch(/enter some text/i)
    expect(client.tokenize).not.toHaveBeenCalled()
  })

  it('tokenizes successfully and does not touch the vocabulary in tiktoken mode', async () => {
    const response = makeResult()
    vi.mocked(client.tokenize).mockResolvedValueOnce(response)
    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    act(() => result.current.setText('hi'))
    await act(async () => {
      await result.current.tokenize()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.result).toEqual(response)
    expect(client.getVocabulary).not.toHaveBeenCalled()
  })

  it('refetches the vocabulary after a successful custom-mode tokenize', async () => {
    const response = makeResult({ tokenizer_mode: 'custom', encoding: null })
    vi.mocked(client.tokenize).mockResolvedValueOnce(response)
    const vocabulary: VocabularyResponse = {
      entries: [{ id: 0, token: 'hi', frequency: 1, is_new: true }],
      total_tokens: 1,
    }
    vi.mocked(client.getVocabulary).mockResolvedValue(vocabulary)

    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    act(() => {
      result.current.setTokenizerMode('custom')
      result.current.setText('hi')
    })
    await act(async () => {
      await result.current.tokenize()
    })

    expect(client.getVocabulary).toHaveBeenCalled()
    expect(result.current.vocabulary).toEqual(vocabulary)
  })

  it('surfaces the backend error message and status on a failed tokenize', async () => {
    vi.mocked(client.tokenize).mockRejectedValueOnce(new Error('The encoding is not supported.'))
    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    act(() => result.current.setText('hi'))
    await act(async () => {
      await result.current.tokenize()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe('The encoding is not supported.')
  })

  it('ignores a stale in-flight response when a newer tokenize call has already resolved (SC-006)', async () => {
    let resolveStale!: (value: TokenizeResponse) => void
    const stalePromise = new Promise<TokenizeResponse>((resolve) => {
      resolveStale = resolve
    })
    const freshResponse = makeResult({ encoding: 'r50k_base' })

    vi.mocked(client.tokenize).mockReturnValueOnce(stalePromise).mockResolvedValueOnce(freshResponse)

    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))
    act(() => result.current.setText('hi'))

    // Fire the first (slow) request, then immediately switch encoding and
    // fire a second (fast) request before the first resolves.
    let firstCall!: Promise<void>
    act(() => {
      firstCall = result.current.tokenize()
    })
    act(() => result.current.setEncoding('r50k_base'))
    await act(async () => {
      await result.current.tokenize()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.result).toEqual(freshResponse)

    // Now let the stale first request resolve — it must NOT overwrite the
    // already-applied fresh result.
    await act(async () => {
      resolveStale(makeResult({ encoding: 'cl100k_base', original_text: 'STALE' }))
      await firstCall
    })

    expect(result.current.result).toEqual(freshResponse)
  })

  it('resets the vocabulary', async () => {
    const emptyVocabulary: VocabularyResponse = { entries: [], total_tokens: 0 }
    vi.mocked(client.resetVocabulary).mockResolvedValueOnce(emptyVocabulary)
    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    await act(async () => {
      await result.current.resetVocabulary()
    })

    expect(client.resetVocabulary).toHaveBeenCalled()
    expect(result.current.vocabulary).toEqual(emptyVocabulary)
  })

  it('uploadFile switches to file input mode and stores the extracted text', async () => {
    vi.mocked(client.extractFile).mockResolvedValueOnce({
      source_type: 'txt_file',
      filename: 'notes.txt',
      text: 'hello there',
      character_count: 11,
    })
    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    const file = new File(['hello there'], 'notes.txt', { type: 'text/plain' })
    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.inputMode).toBe('file')
    expect(result.current.text).toBe('hello there')
    expect(result.current.uploadedFilename).toBe('notes.txt')
  })

  it('trains BPE successfully and stores the model', async () => {
    const trainedModel = {
      is_trained: true,
      target_vocab_size: 10,
      training_text: 'low low lower',
      base_characters: [' ', 'e', 'l', 'o', 'r', 'w'],
      merge_rules: [{ rank: 1, first: 'l', second: 'o', merged: 'lo' }],
      training_steps: [{ step: 1, pair: ['l', 'o'] as [string, string], frequency: 3, merged_token: 'lo', new_token_id: 6 }],
      vocabulary: [{ id: 0, token: ' ', token_type: 'base' as const, is_merged: false, rank: null }],
    }
    vi.mocked(client.trainBPE).mockResolvedValueOnce(trainedModel)

    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    act(() => {
      result.current.setBpeTrainingText('low low lower')
      result.current.setBpeTargetVocabSize(10)
    })

    await act(async () => {
      await result.current.trainBPE()
    })

    expect(client.trainBPE).toHaveBeenCalledWith({
      training_text: 'low low lower',
      target_vocab_size: 10,
    })
    expect(result.current.status).toBe('success')
    expect(result.current.bpeModel).toEqual(trainedModel)
  })

  it('resets BPE model', async () => {
    const emptyBPE = {
      is_trained: false,
      target_vocab_size: 16,
      training_text: '',
      base_characters: [],
      merge_rules: [],
      training_steps: [],
      vocabulary: [],
    }
    vi.mocked(client.resetBPE).mockResolvedValueOnce(emptyBPE)

    const { result } = renderHook(() => useTokenizerState())
    await waitFor(() => expect(result.current.encodingOptions).toHaveLength(2))

    await act(async () => {
      await result.current.resetBPE()
    })

    expect(client.resetBPE).toHaveBeenCalled()
    expect(result.current.bpeModel).toEqual(emptyBPE)
  })
})
