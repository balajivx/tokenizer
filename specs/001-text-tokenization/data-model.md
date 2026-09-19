# Phase 1 Data Model: Text Tokenization Application with BPE

All entities below are in-memory only (no database), per constitution Principle V and
spec FR-033. "Backend-owned" entities live in Python service state; "wire" entities are
the shapes exchanged with the frontend (see `contracts/api.md` for exact schemas).

---

## 1. TokenizationRequest (wire, inbound)

Represents one tokenize action submitted by the frontend.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `text` | string | required if no file source was used; non-empty after trimming | The text to tokenize |
| `source_type` | enum: `text` \| `txt_file` \| `pdf_file` | required | Identifies origin of input for display/statistics |
| `tokenizer_mode` | enum: `tiktoken` \| `custom` \| `bpe` | required | Selects which tokenizer engine processes the text (FR-005) |
| `encoding` | string \| null | required when `tokenizer_mode = tiktoken`; ignored otherwise | One of the supported Tiktoken encodings |

**Validation rules** (FR-023, FR-028, FR-023d):
- Reject if `text` is empty/whitespace-only → `EMPTY_INPUT`.
- Reject if `tokenizer_mode = tiktoken` and `encoding` is missing or unsupported → `UNSUPPORTED_ENCODING`.
- Reject if `tokenizer_mode = bpe` and no BPE model has been trained → `BPE_NOT_TRAINED`.

---

## 2. UploadedFile (wire, inbound — multipart)

Represents a TXT or PDF file submitted for text extraction.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `filename` | string | required | Name of the file for reporting |
| `content_type` / extension | string | must resolve to `.txt` or `.pdf` | FR-024 rejection if unsupported |
| `size_bytes` | integer | MUST be ≤ 10 MB | Over limit → FR-025 rejection |
| `bytes` | binary | valid UTF-8 text (TXT) or readable text-based PDF (PDF) | Failure to read/extract text → FR-026/FR-027 |

---

## 3. Token (wire, outbound — part of TokenizationResult)

One element of the tokenized sequence.

| Field | Type | Notes |
|---|---|---|
| `index` | integer (0-based) | Position within the sequence (FR-021) |
| `id` | integer | Real Tiktoken token ID, Custom Tokenizer vocabulary ID, or BPE vocabulary ID |
| `text` | string | Decoded token text (FR-021) |
| `is_new` | boolean | `custom` mode only: true if this token was newly created in *this* operation; always `false` for `tiktoken` and `bpe` modes |
| `bytes_repr` | string \| null | Optional hex/raw byte representation |

---

## 4. TokenizationResult (wire, outbound)

The full response to a tokenize action.

| Field | Type | Notes |
|---|---|---|
| `original_text` | string | Echoes the input text |
| `source_type` | enum: `text` \| `txt_file` \| `pdf_file` | Echoes input source type |
| `tokenizer_mode` | enum: `tiktoken` \| `custom` \| `bpe` | Echoes selected mode |
| `encoding` | string \| null | Tiktoken encoding name, or null |
| `tokens` | array of `Token` | Full ordered sequence of tokens (FR-021) |
| `token_count` | integer | `len(tokens)` |
| `character_count` | integer | Total character count of input (FR-022) |
| `word_count` | integer | Word count of input (FR-022) |
| `tokens_per_word` | number | `token_count / word_count` (0 if `word_count = 0`) |
| `tokens_per_character` | number | `token_count / character_count` (0 if `character_count = 0`) |

---

## 5. CustomVocabularyEntry (backend-owned + wire)

One row of the Simple Custom Tokenizer dynamic vocabulary.

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Deterministic sequential ID starting at 0 |
| `token` | string | The token string |
| `frequency` | integer ≥ 1 | Total occurrence count |
| `is_new` | boolean | True only if created during the most recent operation |

---

## 6. CustomVocabulary (backend-owned singleton)

The in-memory store for the Simple Custom Tokenizer (word/regex-based), guarded by a thread lock.

---

## 7. BPETrainingRequest (wire, inbound)

Represents a BPE model training request submitted by the user.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `training_text` | string | required; non-empty after trimming | Corpus used to learn frequent pairs |
| `target_vocab_size` | integer | required; integer ≥ 1 | Desired total vocabulary size ($|V_{\text{target}}|$) |

**Validation rules** (FR-023b, FR-023c):
- Reject if `training_text` is empty/whitespace-only → `EMPTY_INPUT`.
- Reject if `target_vocab_size < 1` or `target_vocab_size < initial_unique_characters` → `INVALID_TARGET_VOCAB_SIZE`.

---

## 8. BPEMergeRule (wire, outbound)

Represents one learned BPE merge rule.

| Field | Type | Notes |
|---|---|---|
| `rank` | integer (1-indexed) | Order in which this rule was learned and must be applied |
| `pair` | array of 2 strings `[token_a, token_b]` | The pair of adjacent tokens merged |
| `merged_token` | string | Resulting composite token string (`token_a + token_b`) |
| `token_id` | integer | Deterministic vocabulary ID assigned to the merged token |

---

## 9. BPETrainingStep (wire, outbound)

Detailed record of a single merge step during training.

| Field | Type | Notes |
|---|---|---|
| `step` | integer (1-indexed) | Step number in the training sequence |
| `pair` | array of 2 strings `[token_a, token_b]` | The pair selected for merging |
| `frequency` | integer ≥ 1 | Occurrence count of the pair in the corpus at this step |
| `merged_token` | string | The resulting merged token string |
| `token_id` | integer | The assigned deterministic token ID |

---

## 10. BPEVocabularyEntry (wire, outbound)

One entry in the learned BPE vocabulary.

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Deterministic vocabulary integer ID |
| `token` | string | Subword token string |
| `is_base_char` | boolean | True for initial base character tokens; false for merged tokens |

---

## 11. BPETrainingResult (wire, outbound)

The complete response returned after BPE training.

| Field | Type | Notes |
|---|---|---|
| `is_trained` | boolean | True when a valid trained model exists |
| `initial_vocab_size` | integer | Count of unique initial base characters |
| `final_vocab_size` | integer | Final learned vocabulary size ($|V|$) |
| `total_merges` | integer | Count of merge rules learned |
| `vocabulary` | array of `BPEVocabularyEntry` | Complete learned vocabulary list |
| `merge_rules` | array of `BPEMergeRule` | Ordered merge rules list |
| `training_steps` | array of `BPETrainingStep` | Step-by-step training details log |

---

## 12. BPEModel (backend-owned singleton)

In-memory store representing the current trained BPE tokenizer state in the FastAPI backend:
- `vocabulary`: dict mapping `token_str -> token_id`
- `inverse_vocabulary`: dict mapping `token_id -> token_str`
- `merge_rules`: ordered list of `BPEMergeRule`
- `training_steps`: list of `BPETrainingStep`
- `initial_vocab_size`: int
- `is_trained`: bool
- Concurrency guarded by a process-local lock.

---

## Relationships

```
BPETrainingRequest ──(trains)──> BPEModel ──(contains)──> { BPEVocabularyEntry[], BPEMergeRule[], BPETrainingStep[] }
BPETrainingResult ──(reflects)──> BPEModel

TokenizationRequest (mode: tiktoken) ──> Tiktoken Engine ──> TokenizationResult
TokenizationRequest (mode: custom)   ──> CustomVocabulary ──> TokenizationResult
TokenizationRequest (mode: bpe)      ──> BPEModel (read-only) ──> TokenizationResult

UploadedFile ──(extracted into text)──> { TokenizationRequest | BPETrainingRequest }
```
