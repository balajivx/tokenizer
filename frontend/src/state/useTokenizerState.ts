import { useCallback, useEffect, useRef, useState } from 'react'
import * as client from '../api/client'
import type {
  BPETrainingResult,
  EncodingOption,
  SourceType,
  TokenizeResponse,
  TokenizerMode,
  VocabularyResponse,
} from '../types/api'
import { ApiError } from '../types/api'

export type Status = 'empty' | 'loading' | 'success' | 'error'
export type InputMode = 'text' | 'file'

export interface TokenizerState {
  inputMode: InputMode
  text: string
  uploadedFilename: string | null
  tokenizerMode: TokenizerMode
  encoding: string
  encodingOptions: EncodingOption[]
  status: Status
  result: TokenizeResponse | null
  vocabulary: VocabularyResponse | null
  bpeModel: BPETrainingResult | null
  bpeTrainingText: string
  bpeTargetVocabSize: number
  errorMessage: string | null
  setText: (text: string) => void
  setTokenizerMode: (mode: TokenizerMode) => void
  setEncoding: (encoding: string) => void
  setBpeTrainingText: (text: string) => void
  setBpeTargetVocabSize: (size: number) => void
  uploadFile: (file: File) => Promise<void>
  useDirectTextEntry: () => void
  tokenize: () => Promise<void>
  trainBPE: () => Promise<void>
  resetBPE: () => Promise<void>
  resetVocabulary: () => Promise<void>
}

function errorMessageFrom(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export function useTokenizerState(): TokenizerState {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [text, setText] = useState('')
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null)
  const [tokenizerMode, setTokenizerMode] = useState<TokenizerMode>('tiktoken')
  const [encoding, setEncoding] = useState('o200k_base')
  const [encodingOptions, setEncodingOptions] = useState<EncodingOption[]>([])
  const [status, setStatus] = useState<Status>('empty')
  const [result, setResult] = useState<TokenizeResponse | null>(null)
  const [vocabulary, setVocabulary] = useState<VocabularyResponse | null>(null)
  const [bpeModel, setBpeModel] = useState<BPETrainingResult | null>(null)
  const [bpeTrainingText, setBpeTrainingText] = useState(
    'low low low low low lower lower widest newest',
  )
  const [bpeTargetVocabSize, setBpeTargetVocabSize] = useState(16)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Guards against a stale in-flight request overwriting a newer one when the
  // user switches mode/encoding mid-request (spec.md Edge Cases / SC-006).
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    client
      .getEncodings(controller.signal)
      .then((response) => {
        setEncodingOptions(response.encodings)
        const defaultOption = response.encodings.find((option) => option.is_default)
        if (defaultOption) setEncoding(defaultOption.name)
      })
      .catch(() => {
        // Non-fatal: the selector just stays empty until the user retries.
      })

    client
      .getBPEModel(controller.signal)
      .then((response) => {
        setBpeModel(response)
      })
      .catch(() => {
        // Non-fatal
      })

    return () => controller.abort()
  }, [])

  const refreshVocabulary = useCallback(async () => {
    try {
      const response = await client.getVocabulary()
      setVocabulary(response)
    } catch {
      // Vocabulary panel simply keeps its last known state on transient failure.
    }
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setInputMode('file')
    setStatus('loading')
    setErrorMessage(null)

    try {
      const response = await client.extractFile(file, controller.signal)
      if (requestId !== requestIdRef.current) return
      setText(response.text)
      setUploadedFilename(response.filename)
      setStatus('empty')
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setStatus('error')
      setErrorMessage(errorMessageFrom(error))
    }
  }, [])

  const useDirectTextEntry = useCallback(() => {
    setInputMode('text')
    setUploadedFilename(null)
  }, [])

  const tokenize = useCallback(async () => {
    if (!text.trim()) {
      setStatus('error')
      setErrorMessage('Please enter some text or upload a file before tokenizing.')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setStatus('loading')
    setErrorMessage(null)

    const sourceType: SourceType =
      inputMode === 'file' ? (uploadedFilename?.endsWith('.pdf') ? 'pdf_file' : 'txt_file') : 'text'

    try {
      const response = await client.tokenize(
        {
          text,
          source_type: sourceType,
          tokenizer_mode: tokenizerMode,
          encoding: tokenizerMode === 'tiktoken' ? encoding : null,
        },
        controller.signal,
      )
      if (requestId !== requestIdRef.current) return
      setResult(response)
      setStatus('success')
      if (tokenizerMode === 'custom') {
        await refreshVocabulary()
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setStatus('error')
      setErrorMessage(errorMessageFrom(error))
    }
  }, [text, inputMode, uploadedFilename, tokenizerMode, encoding, refreshVocabulary])

  const trainBPE = useCallback(async () => {
    if (!bpeTrainingText.trim()) {
      setStatus('error')
      setErrorMessage('Please enter training text before starting BPE training.')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const response = await client.trainBPE({
        training_text: bpeTrainingText,
        target_vocab_size: bpeTargetVocabSize,
      })
      setBpeModel(response)
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(errorMessageFrom(error))
    }
  }, [bpeTrainingText, bpeTargetVocabSize])

  const resetBPE = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const response = await client.resetBPE()
      setBpeModel(response)
      setStatus('empty')
    } catch (error) {
      setStatus('error')
      setErrorMessage(errorMessageFrom(error))
    }
  }, [])

  const resetVocabulary = useCallback(async () => {
    try {
      const response = await client.resetVocabulary()
      setVocabulary(response)
    } catch (error) {
      setStatus('error')
      setErrorMessage(errorMessageFrom(error))
    }
  }, [])

  return {
    inputMode,
    text,
    uploadedFilename,
    tokenizerMode,
    encoding,
    encodingOptions,
    status,
    result,
    vocabulary,
    bpeModel,
    bpeTrainingText,
    bpeTargetVocabSize,
    errorMessage,
    setText,
    setTokenizerMode,
    setEncoding,
    setBpeTrainingText,
    setBpeTargetVocabSize,
    uploadFile,
    useDirectTextEntry,
    tokenize,
    trainBPE,
    resetBPE,
    resetVocabulary,
  }
}
