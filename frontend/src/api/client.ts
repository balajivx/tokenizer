import {
  ApiError,
  type BPETrainingRequest,
  type BPETrainingResult,
  type EncodingListResponse,
  type ErrorResponse,
  type ExtractedTextResponse,
  type TokenizeRequest,
  type TokenizeResponse,
  type VocabularyResponse,
} from '../types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, init)
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }

  if (!response.ok) {
    let body: ErrorResponse
    try {
      body = (await response.json()) as ErrorResponse
    } catch {
      throw new Error('Something went wrong while processing your request.')
    }
    throw new ApiError(body)
  }

  return (await response.json()) as T
}

export function getEncodings(signal?: AbortSignal): Promise<EncodingListResponse> {
  return request<EncodingListResponse>('/encodings', { signal })
}

export function tokenize(
  payload: TokenizeRequest,
  signal?: AbortSignal,
): Promise<TokenizeResponse> {
  return request<TokenizeResponse>('/tokenize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

export function trainBPE(
  payload: BPETrainingRequest,
  signal?: AbortSignal,
): Promise<BPETrainingResult> {
  return request<BPETrainingResult>('/bpe/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

export function getBPEModel(signal?: AbortSignal): Promise<BPETrainingResult> {
  return request<BPETrainingResult>('/bpe/model', { signal })
}

export function resetBPE(signal?: AbortSignal): Promise<BPETrainingResult> {
  return request<BPETrainingResult>('/bpe/reset', { method: 'POST', signal })
}

export function getVocabulary(signal?: AbortSignal): Promise<VocabularyResponse> {
  return request<VocabularyResponse>('/vocabulary', { signal })
}

export function resetVocabulary(signal?: AbortSignal): Promise<VocabularyResponse> {
  return request<VocabularyResponse>('/vocabulary/reset', { method: 'POST', signal })
}

export function extractFile(file: File, signal?: AbortSignal): Promise<ExtractedTextResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return request<ExtractedTextResponse>('/files/extract', {
    method: 'POST',
    body: formData,
    signal,
  })
}
