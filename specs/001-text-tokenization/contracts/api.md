# API Contract: Text Tokenization Application with BPE

REST API served by FastAPI. All endpoints are thin route handlers that delegate to backend services and return Pydantic response models. JSON over HTTP throughout; in-memory state only (no database); no authentication (FR-034).

Base path: `/api`

---

## 1. `GET /api/encodings`

Lists every Tiktoken encoding the installed library supports, along with display names and model mappings (FR-006).

**Response 200** — `EncodingListResponse`

```json
{
  "encodings": [
    {
      "name": "o200k_base",
      "is_default": true,
      "display_name": "GPT-4o, GPT-4o mini, o1, o3-mini (o200k_base)",
      "models": ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o3-mini"]
    },
    {
      "name": "cl100k_base",
      "is_default": false,
      "display_name": "GPT-4, GPT-4 Turbo, GPT-3.5 Turbo (cl100k_base)",
      "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
    }
  ]
}
```

---

## 2. `POST /api/files/extract`

Validates an uploaded TXT or PDF file and returns its extracted plain text without tokenizing it.

**Request**: `multipart/form-data` with a single `file` field.

**Response 200** — `ExtractedTextResponse`

```json
{
  "source_type": "txt_file",
  "filename": "sample.txt",
  "text": "Hello world from file",
  "character_count": 21
}
```

**Error responses** (`ErrorResponse`):
- `400 EMPTY_INPUT`: Empty or missing file
- `415 UNSUPPORTED_FILE_TYPE`: Extension/MIME type not `.txt` or `.pdf`
- `413 FILE_TOO_LARGE`: Exceeds 10 MB limit
- `422 INVALID_PDF`: Corrupt or unparseable PDF
- `422 NO_EXTRACTABLE_TEXT`: PDF has no text layer (e.g., scanned images)
- `422 INVALID_TEXT_ENCODING`: TXT file cannot be decoded as UTF-8

---

## 3. `POST /api/tokenize`

Tokenizes text using the selected tokenizer mode (`tiktoken`, `custom`, or `bpe`).

**Request** — `TokenizeRequest`

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | Non-empty text to tokenize |
| `source_type` | enum: `text` \| `txt_file` \| `pdf_file` | yes | Input source origin |
| `tokenizer_mode` | enum: `tiktoken` \| `custom` \| `bpe` | yes | Engine to use |
| `encoding` | string \| null | conditional | Required if `tokenizer_mode = tiktoken`; ignored otherwise |

**Response 200** — `TokenizeResponse`

```json
{
  "original_text": "Hello world",
  "source_type": "text",
  "tokenizer_mode": "bpe",
  "encoding": null,
  "tokens": [
    {
      "index": 0,
      "id": 14,
      "text": "Hello",
      "is_new": false,
      "bytes_repr": null
    },
    {
      "index": 1,
      "id": 2,
      "text": " ",
      "is_new": false,
      "bytes_repr": null
    },
    {
      "index": 2,
      "id": 22,
      "text": "world",
      "is_new": false,
      "bytes_repr": null
    }
  ],
  "token_count": 3,
  "character_count": 11,
  "word_count": 2,
  "tokens_per_word": 1.5,
  "tokens_per_character": 0.27
}
```

**Error responses** (`ErrorResponse`):
- `400 EMPTY_INPUT`: `text` is empty or whitespace-only
- `400 UNSUPPORTED_ENCODING`: `tokenizer_mode = tiktoken` and encoding is invalid/missing
- `400 BPE_NOT_TRAINED`: `tokenizer_mode = bpe` requested but no BPE model has been trained yet

---

## 4. `POST /api/bpe/train`

Trains a Byte Pair Encoding (BPE) model on user-provided training text up to the specified target vocabulary size.

**Request** — `BPETrainingRequest`

| Field | Type | Required | Notes |
|---|---|---|---|
| `training_text` | string | yes | Non-empty training corpus |
| `target_vocab_size` | integer | yes | Desired total vocabulary size ($|V| \ge 1$) |

**Response 200** — `BPETrainingResult`

```json
{
  "is_trained": true,
  "initial_vocab_size": 10,
  "final_vocab_size": 18,
  "total_merges": 8,
  "vocabulary": [
    { "id": 0, "token": " ", "is_base_char": true },
    { "id": 1, "token": "d", "is_base_char": true },
    { "id": 2, "token": "e", "is_base_char": true },
    { "id": 10, "token": "lo", "is_base_char": false },
    { "id": 11, "token": "low", "is_base_char": false }
  ],
  "merge_rules": [
    {
      "rank": 1,
      "pair": ["l", "o"],
      "merged_token": "lo",
      "token_id": 10
    },
    {
      "rank": 2,
      "pair": ["lo", "w"],
      "merged_token": "low",
      "token_id": 11
    }
  ],
  "training_steps": [
    {
      "step": 1,
      "pair": ["l", "o"],
      "frequency": 5,
      "merged_token": "lo",
      "token_id": 10
    },
    {
      "step": 2,
      "pair": ["lo", "w"],
      "frequency": 4,
      "merged_token": "low",
      "token_id": 11
    }
  ]
}
```

**Error responses** (`ErrorResponse`):
- `400 EMPTY_INPUT`: `training_text` is empty or whitespace-only
- `400 INVALID_TARGET_VOCAB_SIZE`: `target_vocab_size` is $< 1$ or less than initial unique base characters count in training text

---

## 5. `GET /api/bpe/model`

Returns the currently trained BPE model's vocabulary, merge rules, and training steps (or indicates untrained state).

**Response 200** — `BPETrainingResult`

- When trained: returns full `BPETrainingResult` with `is_trained: true`.
- When untrained: returns `{ "is_trained": false, "initial_vocab_size": 0, "final_vocab_size": 0, "total_merges": 0, "vocabulary": [], "merge_rules": [], "training_steps": [] }`.

---

## 6. `POST /api/bpe/reset`

Resets the in-memory BPE model back to an untrained initial state.

**Request**: no body.

**Response 200** — `BPETrainingResult` (untrained empty state).

---

## 7. `GET /api/vocabulary` (Simple Custom Tokenizer)

Returns the current state of the Simple Custom Tokenizer's dynamic vocabulary.

**Response 200** — `VocabularyResponse`

---

## 8. `POST /api/vocabulary/reset` (Simple Custom Tokenizer)

Resets the Simple Custom Tokenizer dynamic vocabulary back to empty.

**Response 200** — `VocabularyResponse`

---

## Shared Error Format

All non-2xx responses return `ErrorResponse`:

```json
{
  "error_code": "BPE_NOT_TRAINED",
  "message": "No BPE model has been trained yet. Please train a BPE tokenizer first."
}
```
