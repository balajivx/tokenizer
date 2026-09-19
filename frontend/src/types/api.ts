export type SourceType = 'text' | 'txt_file' | 'pdf_file'
export type TokenizerMode = 'tiktoken' | 'custom' | 'bpe'

export interface EncodingOption {
  name: string
  is_default: boolean
  display_name?: string
  models?: string[]
}

export interface EncodingListResponse {
  encodings: EncodingOption[]
}

export interface TokenizeRequest {
  text: string
  source_type: SourceType
  tokenizer_mode: TokenizerMode
  encoding: string | null
}

export interface TokenInfo {
  index: number
  id: number
  text: string
  is_new: boolean
  bytes_repr?: string | null
}

export interface TokenizeResponse {
  original_text: string
  source_type: SourceType
  tokenizer_mode: TokenizerMode
  encoding: string | null
  tokens: TokenInfo[]
  token_count: number
  character_count: number
  word_count: number
  tokens_per_word: number
  tokens_per_character: number
}

export interface VocabularyEntry {
  id: number
  token: string
  frequency: number
  is_new: boolean
}

export interface VocabularyResponse {
  entries: VocabularyEntry[]
  total_tokens: number
}

export interface BPEMergeRule {
  rank: number
  pair: string[]
  merged_token: string
  token_id: number
}

export interface BPETrainingStep {
  step: number
  pair: string[]
  frequency: number
  merged_token: string
  token_id: number
}

export interface BPEVocabularyEntry {
  id: number
  token: string
  is_base_char: boolean
}

export interface BPETrainingResult {
  is_trained: boolean
  initial_vocab_size: number
  final_vocab_size: number
  total_merges: number
  vocabulary: BPEVocabularyEntry[]
  merge_rules: BPEMergeRule[]
  training_steps: BPETrainingStep[]
}

export interface BPETrainingRequest {
  training_text: string
  target_vocab_size: number
}

export interface ExtractedTextResponse {
  source_type: SourceType
  filename: string
  text: string
  character_count: number
}

export interface ErrorResponse {
  error_code: string
  message: string
}

export class ApiError extends Error {
  error_code: string

  constructor(body: ErrorResponse) {
    super(body.message)
    this.error_code = body.error_code
  }
}
