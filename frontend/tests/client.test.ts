import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../src/api/client'
import { ApiError } from '../src/types/api'

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as Response
}

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getEncodings resolves with the parsed JSON body on success', async () => {
    const body = { encodings: [{ name: 'cl100k_base', is_default: true }] }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body))

    const result = await client.getEncodings()

    expect(result).toEqual(body)
    expect(fetch).toHaveBeenCalledWith('/api/encodings', { signal: undefined })
  })

  it('tokenize POSTs JSON and returns the parsed response', async () => {
    const responseBody = { token_count: 1 }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(responseBody))

    const request = {
      text: 'hi',
      source_type: 'text' as const,
      tokenizer_mode: 'tiktoken' as const,
      encoding: 'cl100k_base',
    }
    const result = await client.tokenize(request)

    expect(result).toEqual(responseBody)
    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual(request)
  })

  it('throws an ApiError carrying the backend error_code and message on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error_code: 'EMPTY_INPUT', message: 'Please enter some text.' }, { status: 400 }),
    )

    let caught: unknown
    try {
      await client.tokenize({ text: '', source_type: 'text', tokenizer_mode: 'tiktoken', encoding: null })
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).message).toBe('Please enter some text.')
    expect((caught as ApiError).error_code).toBe('EMPTY_INPUT')
  })

  it('throws a generic error when the network request itself fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('network down'))

    await expect(client.getEncodings()).rejects.toThrow(/could not reach the server/i)
  })

  it('extractFile sends the file as multipart form data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ source_type: 'txt_file', filename: 'a.txt', text: 'hi', character_count: 2 }),
    )
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' })

    await client.extractFile(file)

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.body).toBeInstanceOf(FormData)
    expect((init?.body as FormData).get('file')).toBe(file)
  })

  it('trainBPE POSTs training parameters and returns BPE model', async () => {
    const responseBody = { is_trained: true, target_vocab_size: 16 }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(responseBody))

    const request = { training_text: 'hello world', target_vocab_size: 16 }
    const result = await client.trainBPE(request)

    expect(result).toEqual(responseBody)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/bpe/train')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual(request)
  })

  it('getBPEModel GETs current BPE model', async () => {
    const responseBody = { is_trained: false }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(responseBody))

    const result = await client.getBPEModel()

    expect(result).toEqual(responseBody)
    expect(fetch).toHaveBeenCalledWith('/api/bpe/model', { signal: undefined })
  })

  it('resetBPE POSTs reset request and returns cleared model', async () => {
    const responseBody = { is_trained: false }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(responseBody))

    const result = await client.resetBPE()

    expect(result).toEqual(responseBody)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/bpe/reset')
    expect(init?.method).toBe('POST')
  })
})

