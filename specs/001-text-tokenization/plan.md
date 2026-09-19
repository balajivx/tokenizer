# Implementation Plan: Text Tokenization Application

**Branch**: `001-text-tokenization` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-text-tokenization/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A small web tool that turns text into visible tokens. Users type text (or upload a TXT /
text-based PDF), pick Tiktoken or the app's own Custom Tokenizer, and see a token-by-token
breakdown plus statistics. Tiktoken mode calls the real Tiktoken library and never touches
its vocabulary; Custom Tokenizer mode splits text with a fixed regex and grows a single,
global, in-memory vocabulary (deterministic IDs, frequency counts, new-vs-existing status)
that can be reset. All tokenization is backend-authoritative (FastAPI); React only
renders what the backend returns, styled as a dark, neon-gradient interface. No database —
everything lives in one backend process's memory for its lifetime.

## Technical Context

**Language/Version**: Python 3.11+ (backend); TypeScript 5.x + React 18+ (frontend, via Vite)

**Primary Dependencies**: Backend — FastAPI, Pydantic v2, `tiktoken`, `PyMuPDF` (`fitz`), `python-multipart` (file uploads), `uvicorn`. Frontend — React, TypeScript, Vite, native `fetch` for API calls (no HTTP client library needed).

**Storage**: N/A — no database or persistent storage; the Custom Tokenizer vocabulary is a single global in-memory structure for the life of the backend process (FR-033).

**Testing**: `pytest` (backend contract/unit/integration tests); Vitest + React Testing Library (frontend component/interaction tests).

**Target Platform**: Browser client (any modern evergreen browser, responsive down to mobile widths) + single-process Linux/macOS backend server.

**Project Type**: Web application (frontend + backend) — Option 2 structure.

**Performance Goals**: End-to-end tokenize-and-display under 5 seconds for input up to 10,000 words (SC-001); encoding/mode switches feel instant (no full page reload).

**Constraints**: Single Uvicorn worker process (required so the "global" Custom Tokenizer vocabulary is actually singular — see research.md §5); uploads capped at 10 MB; no OCR; no network calls beyond the local API; Tiktoken vocabulary must never be mutated.

**Scale/Scope**: Single small application, low concurrent usage expected (a learning/demo tool, not a multi-tenant SaaS product); 5 backend endpoints; ~4-6 React components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Frontend/Backend Separation of Concerns | React limited to UI/API calls/states/visualization; FastAPI owns validation, extraction, tokenization, stats, vocabulary, responses | PASS — see Architecture Overview |
| II. Backend-Authoritative Tokenization (NON-NEGOTIABLE) | No tokenization logic planned for React; `POST /api/tokenize` is the sole tokenize entry point | PASS |
| III. Independent, Replaceable Tokenizer Services | Two separate services (`TiktokenService`, `CustomTokenizerService`) behind one request/response contract; Tiktoken vocabulary untouched; Custom vocabulary owns its own deterministic IDs | PASS — see Component Design |
| IV. Validated Input Handling | All validation/extraction (TXT/PDF, size, corruption, empty-text) happens in backend services before tokenization | PASS |
| V. Thin API, No Database | Routes only parse/delegate/serialize; no DB dependency anywhere in the stack | PASS |
| VI. Traceable, Tested Simplicity | Every FR maps to a contract endpoint or service behavior with a corresponding pytest/Vitest test; no framework beyond what's listed in Technical Context | PASS |

No violations — Complexity Tracking table is not needed.

*Post-Phase-1 re-check*: data-model.md and contracts/api.md keep tokenization logic entirely server-side, keep the two tokenizer services independent and swappable via the `tokenizer_mode` enum, and introduce no database or extra framework. **Still PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/001-text-tokenization/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                      # FastAPI app creation, router registration, CORS config
│   ├── api/
│   │   └── routes.py                # Thin route handlers for all 5 endpoints (contracts/api.md)
│   ├── schemas/
│   │   ├── tokenize.py               # TokenizeRequest/Response, TokenInfo (Pydantic)
│   │   ├── files.py                  # ExtractedTextResponse (Pydantic)
│   │   ├── vocabulary.py             # VocabularyEntry/Response (Pydantic)
│   │   └── errors.py                 # ErrorResponse + error_code enum (Pydantic)
│   ├── services/
│   │   ├── tiktoken_service.py       # Wraps `tiktoken`; lists encodings; tokenizes; never mutates vocab
│   │   ├── custom_tokenizer_service.py  # Regex splitting + vocabulary read/update orchestration
│   │   ├── vocabulary_store.py       # In-memory global CustomVocabulary + threading.Lock
│   │   ├── file_service.py           # TXT/PDF validation + text extraction (PyMuPDF)
│   │   └── stats_service.py          # character/word/token count + ratios (shared by both modes)
│   └── core/
│       └── config.py                 # Constants: MAX_FILE_SIZE_BYTES, DEFAULT_ENCODING, etc.
└── tests/
    ├── contract/                     # One test module per endpoint in contracts/api.md
    ├── integration/                  # End-to-end scenarios from quickstart.md
    └── unit/                         # Service-level tests (tokenizers, file validation, stats, vocab store)

frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Top-level layout + global state wiring
│   ├── api/
│   │   └── client.ts                 # fetch wrappers matching contracts/api.md 1:1
│   ├── types/
│   │   └── api.ts                    # TypeScript types mirroring the Pydantic schemas
│   ├── state/
│   │   └── useTokenizerState.ts      # Hook holding input/mode/encoding/result/status state machine
│   ├── components/
│   │   ├── InputPanel.tsx            # Text area + file upload control + mode toggle
│   │   ├── EncodingSelector.tsx      # Tiktoken encoding dropdown (from GET /api/encodings)
│   │   ├── TokenizeButton.tsx
│   │   ├── StatsPanel.tsx            # Character/word/token counts + ratios
│   │   ├── TokenVisualization.tsx    # Token chips/table (index, id, text, new-highlight)
│   │   ├── VocabularyPanel.tsx       # Custom vocabulary table + reset button
│   │   ├── ExtractedTextPanel.tsx    # Shows extracted text for uploaded documents
│   │   └── StatusBanner.tsx          # Loading / empty / error / success state display
│   └── styles/
│       ├── tokens.css                # Neon-gradient dark theme CSS custom properties
│       └── *.module.css              # Per-component scoped styles
└── tests/
    └── (component/interaction tests mirroring components/ above)
```

**Structure Decision**: Option 2 (web application). The frontend and backend are
separate top-level projects communicating only over the REST contract in
`contracts/api.md`, matching constitution Principle I (clean separation) and enabling
each side to be tested and deployed independently.

## Architecture Overview

```
┌─────────────────────────┐        HTTP/JSON         ┌──────────────────────────────┐
│  React + TypeScript SPA │ ───────────────────────▶ │        FastAPI backend       │
│                          │ ◀─────────────────────── │                              │
│  - Input/upload UI       │                          │  routes.py (thin)            │
│  - Encoding selector     │                          │    │                         │
│  - Token visualization   │                          │    ▼                         │
│  - Vocabulary table      │                          │  services/                   │
│  - Loading/error/success │                          │   ├─ file_service            │
│    states                │                          │   ├─ tiktoken_service ───────┼──▶ tiktoken (external, read-only)
└─────────────────────────┘                          │   ├─ custom_tokenizer_service │
                                                       │   │     └─ vocabulary_store  │  (global, in-memory, locked)
                                                       │   └─ stats_service           │
                                                       └──────────────────────────────┘
```

Component boundaries:
- **React** never imports a tokenizer or regex-splitting logic; it only knows the wire
  shapes in `contracts/api.md` (mirrored as TypeScript types).
- **`routes.py`** contains no business logic — each handler validates the HTTP-level shape
  (via Pydantic), calls exactly one service function, and returns its result or maps a
  raised service exception to the matching `ErrorResponse`/status code.
- **`tiktoken_service`** and **`custom_tokenizer_service`** share no code path that could
  let one influence the other's output (constitution Principle III); both are called
  through the same `tokenizer_mode` switch in `routes.py`, never directly from each other.

## Component Design

### TiktokenService

- `list_encodings() -> list[EncodingOption]`: wraps `tiktoken.list_encoding_names()`,
  marks `cl100k_base` as `is_default`.
- `tokenize(text, encoding_name) -> list[TokenInfo]`: loads the encoding via
  `tiktoken.get_encoding(encoding_name)`, encodes `text` to token IDs, decodes each ID
  individually for display text; `is_new` is always `False`. Never writes to any shared
  state — pure function of `(text, encoding_name)`.
- Raises a domain error (mapped to `UNSUPPORTED_ENCODING`) if `encoding_name` isn't in
  `list_encoding_names()`.

### CustomTokenizerService + VocabularyStore

- `tokenize(text) -> list[TokenInfo]`:
  1. Split `text` via the fixed regex `\w+|[^\w\s]` (research.md §3) into an ordered list
     of raw token strings.
  2. Under the `VocabularyStore` lock: for each raw token, look it up; if present, reuse
     its `id` and increment `frequency`, `is_new = False`; if absent, assign
     `next_id` (post-increment counter), insert with `frequency = 1`, `is_new = True`.
  3. Before processing a new tokenize call, clear the `is_new` flag on all *previously*
     new entries so `is_new` only ever reflects the current operation (data-model.md §6).
  4. Return `TokenInfo` list built from the per-token lookups, in original order.
- `get_vocabulary() -> VocabularyResponse`: snapshot read of all entries under the lock.
- `reset() -> VocabularyResponse`: clears all entries and resets the ID counter to 0
  under the lock; returns the now-empty state.
- `VocabularyStore` is a single module-level instance (singleton) constructed at app
  startup — no dependency injection complexity needed for this scope.

### FileService

- `extract_txt(bytes) -> str`: decode as UTF-8 (`strict`); raise `INVALID_TEXT_ENCODING`
  on `UnicodeDecodeError`.
- `extract_pdf(bytes) -> str`: open with `fitz.open(stream=bytes, filetype="pdf")` inside
  a try/except mapping open/parse failures to `INVALID_PDF`; concatenate
  `page.get_text()` across all pages; raise `NO_EXTRACTABLE_TEXT` if the concatenated,
  stripped result is empty.
- Both are called only after a shared `validate_upload(filename, content_type, size)`
  check (extension allow-list, `size_bytes <= MAX_FILE_SIZE_BYTES`) that raises
  `UNSUPPORTED_FILE_TYPE` / `FILE_TOO_LARGE` first.

### StatsService

- `compute(text, token_count) -> Stats`: `character_count = len(text)`,
  `word_count = len(text.split())`, `tokens_per_word`/`tokens_per_character` guarded
  against division by zero (return `0` when the denominator is 0). Shared by both
  tokenizer modes so statistics are computed identically regardless of `tokenizer_mode`.

## Custom Vocabulary Lifecycle

1. **Startup**: `VocabularyStore` initializes empty, `next_id = 0`.
2. **Each Custom Tokenizer tokenize call**: entries may be added (new tokens) or updated
   (existing tokens' frequency), and the response's `is_new` flags reflect exactly this
   call's new entries.
3. **Reset**: explicit user action (`POST /api/vocabulary/reset`) empties the store and
   restarts the ID counter at 0; the very next tokenize call behaves as if against a
   fresh application.
4. **Process end**: vocabulary is discarded (never persisted), by design (FR-033).

## TXT/PDF Processing & Validation Flow

```
Upload → validate_upload() → [extension/size check]
       → extract_txt() or extract_pdf() → [encoding/parse/empty-text checks]
       → ExtractedTextResponse{text, ...}
       → (frontend calls) POST /api/tokenize with that text, source_type = txt_file|pdf_file
```

Kept as two calls (extract, then tokenize) rather than one combined upload-and-tokenize
endpoint so the frontend can show extracted text immediately (FR-004) before/independently
of tokenizing it, and so re-tokenizing the same extracted text (e.g., after switching mode
or encoding) doesn't require re-uploading the file.

## Token & Vocabulary Visualization (Frontend)

- **`TokenVisualization`**: renders `tokens[]` as a wrapped sequence of chips, each
  showing `index`/`id` on hover or in a compact label and `text` as the primary label;
  chips for `is_new === true` get the neon "new" accent treatment (see Styling below).
- **`VocabularyPanel`**: renders `entries[]` as a table (ID, token, frequency, status);
  rows with `is_new === true` get the same accent treatment as new-token chips, so the
  visual language for "new" is consistent across both views (FR-018). Only rendered when
  `tokenizer_mode === 'custom'`.
- **`StatsPanel`**: renders the five statistics as a small stat-tile row.

## React State & Component Structure

Single custom hook, `useTokenizerState`, holds a small state machine so `App.tsx` and
children stay declarative:

| State field | Type | Notes |
|---|---|---|
| `inputMode` | `'text' \| 'file'` | Which input control is authoritative |
| `text` | `string` | Direct entry or last-extracted file text |
| `tokenizerMode` | `'tiktoken' \| 'custom'` | |
| `encoding` | `string` | Defaults to `cl100k_base` once `GET /api/encodings` resolves |
| `encodingOptions` | `EncodingOption[]` | Fetched once on mount |
| `status` | `'empty' \| 'loading' \| 'success' \| 'error'` | Drives `StatusBanner` (FR-030) |
| `result` | `TokenizeResponse \| null` | Last successful tokenization |
| `vocabulary` | `VocabularyResponse \| null` | Refetched after every successful custom-mode tokenize and after reset |
| `errorMessage` | `string \| null` | Last error's `message`, shown as-is (FR-029) |

Data flow is one-directional: user action → `client.ts` call → state update → re-render.
No tokenization or splitting logic lives in this hook or any component — it only stores
and displays what the backend returned (constitution Principle II).

## Frontend/Backend Communication

- Plain REST/JSON over `fetch`, one function per endpoint in `client.ts`, typed against
  `types/api.ts` (hand-mirrored from `contracts/api.md` — no code generation needed for
  5 endpoints).
- CORS enabled on the backend for the frontend's dev origin (and configurable for a
  production origin) — the only cross-origin concern, since there is no auth.
- Errors: any non-2xx response body is parsed as `ErrorResponse` and its `message`
  surfaces directly in `StatusBanner`; network failures get a generic client-side
  fallback message.

## Styling: Neon-Gradient / Dark Cyberpunk Aesthetic

- `styles/tokens.css` defines CSS custom properties on `:root`: dark background layers
  (e.g., near-black base, slightly lighter panel surface), a neon accent gradient (cyan →
  magenta → violet) used for primary buttons, focus rings, active tab indicators, and the
  "new token" highlight, plus semantic status colors (loading = cyan pulse, error = hot
  pink/red, success = green/cyan) that stay distinguishable for accessibility (FR-032).
- Components use CSS Modules scoped per component, importing shared tokens — no
  CSS-in-JS runtime, no UI framework dependency (research.md §7).
- Motion is limited to subtle, low-cost affordances (glow on hover/focus, a soft pulse
  for the loading state) — no motion that blocks or delays reading results.

## Testing Strategy

- **Backend contract tests** (`tests/contract/`): one module per endpoint, asserting
  request/response shapes and status codes exactly as specified in `contracts/api.md`,
  including every error case in its table.
- **Backend unit tests** (`tests/unit/`): `TiktokenService` (real Tiktoken output for a
  known string/encoding pair), `CustomTokenizerService` + `VocabularyStore` (new-token
  creation, ID reuse, frequency increments, reset, the "double tokenize same text"
  edge case), `FileService` (valid/invalid TXT and PDF fixtures), `StatsService`
  (zero-length edge cases).
- **Backend integration tests** (`tests/integration/`): the full quickstart.md scenarios
  driven through the real FastAPI app (e.g. via `TestClient`), covering multi-step flows
  like "tokenize twice with custom mode, confirm reuse" and "reset then re-tokenize."
- **Frontend tests** (Vitest + React Testing Library): render each component with mock
  API responses (success, each error, loading) and assert on visible output — token
  chips, stats, vocabulary table, status banner text — never on internal state shape.
- All new/changed backend behavior ships with a pytest test in the same change (per
  constitution Principle VI); all user-visible frontend behavior ships with a Vitest test.

## Security & Configuration

- No authentication/authorization (explicitly out of scope, FR-034) — the app is not
  intended for multi-tenant or sensitive-data use.
- Input hardening: file size cap (10 MB) and extension allow-list enforced before any
  parsing; PDF parsing wrapped so a malformed file can only produce a handled
  `INVALID_PDF` error, never an unhandled crash; uploaded bytes are never written to disk
  or persisted.
- Configuration is a small `core/config.py` module with plain constants (max file size,
  default encoding name) — no external config service, secrets, or environment-specific
  infrastructure needed.
- CORS is the only network-security-relevant backend setting; restrict allowed origins to
  the known frontend origin(s) rather than `*`.

## Implementation Sequence & Dependencies

1. **Backend foundation**: `core/config.py`, Pydantic schemas (`schemas/`), FastAPI app
   skeleton (`main.py`) with empty routes — enables contract tests to be written first.
2. **StatsService** (no dependencies) + unit tests.
3. **TiktokenService** (`list_encodings`, `tokenize`) + unit tests — depends on `tiktoken`
   only.
4. **VocabularyStore + CustomTokenizerService** (regex split, ID/frequency logic, reset)
   + unit tests — depends on nothing else.
5. **FileService** (TXT then PDF extraction, validation) + unit tests — depends on
   `PyMuPDF`.
6. **Wire up `routes.py`**: `/api/encodings`, `/api/files/extract`, `/api/tokenize`,
   `/api/vocabulary`, `/api/vocabulary/reset`, each delegating to the services above +
   contract tests per endpoint.
7. **Backend integration tests** against the assembled app (quickstart.md scenarios).
8. **Frontend foundation**: `types/api.ts`, `api/client.ts`, `styles/tokens.css` (neon
   theme tokens) — depends on the backend contract being stable (step 6).
9. **`useTokenizerState`** hook (state machine, no UI) + its own tests.
10. **Presentational components** (`InputPanel`, `EncodingSelector`, `TokenizeButton`,
    `StatsPanel`, `TokenVisualization`, `VocabularyPanel`, `ExtractedTextPanel`,
    `StatusBanner`) built bottom-up, each with its own test, wired into `App.tsx` last.
11. **Manual end-to-end pass** through `quickstart.md` with both servers running.

Steps 2–5 are independent of each other and of the frontend entirely, so backend service
work can proceed in any order once step 1 lands; the frontend cannot meaningfully start
until step 6 stabilizes the contract.

## Complexity Tracking

*No entries — Constitution Check reported no violations.*
