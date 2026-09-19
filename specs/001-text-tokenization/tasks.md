# Tasks: Text Tokenization Application

**Input**: Design documents from `/specs/001-text-tokenization/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md (all present)

**Tests**: INCLUDED and REQUIRED. The constitution (Principle VI: Traceable, Tested
Simplicity) and the spec's functional requirements mandate pytest for the backend and
automated tests for user-visible frontend behavior — this is not optional for this
feature.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to a user story (US1–US4) from spec.md
- File paths follow the Option-2 web-app layout from plan.md (`backend/`, `frontend/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the project directory structure per plan.md: `backend/src/{api,schemas,services,core}/`, `backend/tests/{contract,integration,unit}/`, `frontend/src/{api,types,state,components,styles}/`, `frontend/tests/`
- [X] T002 Initialize the backend Python project in `backend/pyproject.toml` (or `backend/requirements.txt`) with dependencies: `fastapi`, `uvicorn`, `pydantic`, `tiktoken`, `pymupdf`, `python-multipart`, `pytest`, `httpx`
- [X] T003 [P] Initialize the frontend project via Vite's React+TypeScript template in `frontend/package.json`, adding `vitest`, `@testing-library/react`, `@testing-library/jest-dom` as dev dependencies
- [X] T004 [P] Create `backend/src/core/config.py` with constants `MAX_FILE_SIZE_BYTES` (10 MB) and `DEFAULT_ENCODING` (`"cl100k_base"`)
- [X] T005 [P] Create `frontend/src/styles/tokens.css` defining the neon-gradient dark-cyberpunk design tokens as CSS custom properties: dark background/surface layers, a cyan→magenta→violet accent gradient, and semantic status colors (loading/error/success/new-token)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create `backend/src/schemas/errors.py` with an `ErrorResponse` Pydantic model (`error_code`, `message`) and an `error_code` enum covering `EMPTY_INPUT`, `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE`, `INVALID_PDF`, `NO_EXTRACTABLE_TEXT`, `INVALID_TEXT_ENCODING`, `UNSUPPORTED_ENCODING`
- [X] T007 Create `backend/src/main.py`: FastAPI app instance, CORS middleware configured for the frontend dev origin, and API router registration (routes added in later phases)
- [X] T008 [P] Create `frontend/src/api/client.ts` with a base `request()` fetch wrapper that parses JSON, surfaces `ErrorResponse.message` on non-2xx responses, and handles network failures with a generic fallback message
- [X] T009 [P] Create `frontend/src/components/StatusBanner.tsx` rendering distinct loading / empty / error / success states from `status` and `errorMessage` props

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Tokenize Pasted Text with Tiktoken (Priority: P1) 🎯 MVP

**Goal**: A user types text, picks a Tiktoken encoding, tokenizes it, and sees the full
token breakdown and statistics.

**Independent Test**: Type text into the input, choose a Tiktoken encoding, tokenize, and
verify token index/ID/decoded text plus character/word/token counts and ratios are shown
correctly, with no dependency on file upload or the Custom Tokenizer.

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T010 [P] [US1] Contract test for `GET /api/encodings` in `backend/tests/contract/test_encodings.py`
- [X] T011 [P] [US1] Contract test for `POST /api/tokenize` in Tiktoken mode (success + `UNSUPPORTED_ENCODING`/`EMPTY_INPUT` error cases) in `backend/tests/contract/test_tokenize_tiktoken.py`
- [X] T012 [P] [US1] Unit test for `TiktokenService.list_encodings()` and `tokenize()` (real Tiktoken output for a known string/encoding pair) in `backend/tests/unit/test_tiktoken_service.py`
- [X] T013 [P] [US1] Unit test for `StatsService.compute()` covering character/word/token counts and tokens-per-word/character ratios, including zero-division guards, in `backend/tests/unit/test_stats_service.py`
- [X] T014 [P] [US1] Integration test: tokenize typed text with Tiktoken end-to-end, then re-tokenize after changing encoding (User Story 1 acceptance scenarios 1–3) in `backend/tests/integration/test_tokenize_tiktoken_flow.py`

### Implementation for User Story 1

- [X] T015 [US1] Create Pydantic schemas `EncodingOption`, `EncodingListResponse`, `TokenInfo`, `TokenizeRequest`, `TokenizeResponse` in `backend/src/schemas/tokenize.py`
- [X] T016 [US1] Implement `TiktokenService` (`list_encodings`, `tokenize`) in `backend/src/services/tiktoken_service.py` (depends on T015)
- [X] T017 [US1] Implement `StatsService.compute(text, token_count)` in `backend/src/services/stats_service.py`
- [X] T018 [US1] Implement `GET /api/encodings` and `POST /api/tokenize` (Tiktoken path) route handlers in `backend/src/api/routes.py`, registered on the app from T007 (depends on T015, T016, T017)
- [X] T019 [P] [US1] Add `EncodingOption`, `TokenInfo`, `TokenizeRequest`, `TokenizeResponse` TypeScript types in `frontend/src/types/api.ts`
- [X] T020 [US1] Add `getEncodings()` and `tokenize()` functions to `frontend/src/api/client.ts` (depends on T019, T008)
- [X] T021 [US1] Create the `useTokenizerState` hook (fields: `text`, `tokenizerMode` fixed to `'tiktoken'`, `encoding`, `encodingOptions`, `status`, `result`, `errorMessage`) in `frontend/src/state/useTokenizerState.ts` (depends on T020)
- [X] T022 [P] [US1] Create `InputPanel` component (direct text entry only) in `frontend/src/components/InputPanel.tsx`
- [X] T023 [P] [US1] Create `EncodingSelector` component in `frontend/src/components/EncodingSelector.tsx`
- [X] T024 [P] [US1] Create `TokenizeButton` component in `frontend/src/components/TokenizeButton.tsx`
- [X] T025 [P] [US1] Create `StatsPanel` component (5-stat tile row) in `frontend/src/components/StatsPanel.tsx`
- [X] T026 [P] [US1] Create `TokenVisualization` component (token chips showing index/ID/text) in `frontend/src/components/TokenVisualization.tsx`
- [X] T027 [US1] Wire `InputPanel`, `EncodingSelector`, `TokenizeButton`, `StatsPanel`, `TokenVisualization`, and `StatusBanner` into `frontend/src/App.tsx` using `useTokenizerState` (depends on T021–T026, T009)
- [X] T028 [P] [US1] Frontend component tests for the Tiktoken flow in `frontend/tests/EncodingSelector.test.tsx`, `frontend/tests/TokenizeButton.test.tsx`, `frontend/tests/StatsPanel.test.tsx`, `frontend/tests/TokenVisualization.test.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Tokenize with the Custom Tokenizer and Track Vocabulary (Priority: P2)

**Goal**: A user switches to Custom Tokenizer mode, tokenizes text, watches the global
vocabulary grow (reused IDs, new IDs, frequency), and can reset it.

**Independent Test**: Switch to Custom Tokenizer mode, tokenize a phrase, confirm new
vocabulary entries appear; tokenize a second phrase reusing a word, confirm ID reuse and
frequency increment; reset the vocabulary and confirm it returns to empty.

### Tests for User Story 2 ⚠️

- [X] T029 [P] [US2] Contract test for `POST /api/tokenize` in Custom mode in `backend/tests/contract/test_tokenize_custom.py`
- [X] T030 [P] [US2] Contract test for `GET /api/vocabulary` and `POST /api/vocabulary/reset` in `backend/tests/contract/test_vocabulary.py`
- [X] T031 [P] [US2] Unit test for `CustomTokenizerService` regex splitting and `VocabularyStore` ID reuse, frequency increments, reset, and the "tokenize the same text twice" edge case in `backend/tests/unit/test_custom_tokenizer_service.py`
- [X] T032 [P] [US2] Integration test: vocabulary growth, reuse, and reset end-to-end (User Story 2 acceptance scenarios 1–4) in `backend/tests/integration/test_custom_tokenizer_flow.py`

### Implementation for User Story 2

- [X] T033 [US2] Create `VocabularyEntry`, `VocabularyResponse` Pydantic schemas in `backend/src/schemas/vocabulary.py`
- [X] T034 [US2] Implement `VocabularyStore` — global in-memory store guarded by a `threading.Lock`, with a deterministic first-seen ID counter and `reset()` — in `backend/src/services/vocabulary_store.py`
- [X] T035 [US2] Implement `CustomTokenizerService` (regex split via `\w+|[^\w\s]`, vocabulary lookup/insert/frequency update, per-operation `is_new` tracking) in `backend/src/services/custom_tokenizer_service.py` (depends on T034)
- [X] T036 [US2] Extend the `POST /api/tokenize` handler to dispatch to `CustomTokenizerService` when `tokenizer_mode = custom`, and add `GET /api/vocabulary` + `POST /api/vocabulary/reset` route handlers in `backend/src/api/routes.py` (depends on T035, T033, T018)
- [X] T037 [P] [US2] Add `VocabularyEntry`, `VocabularyResponse` TypeScript types in `frontend/src/types/api.ts`
- [X] T038 [US2] Add `getVocabulary()` and `resetVocabulary()` functions to `frontend/src/api/client.ts` (depends on T037)
- [X] T039 [US2] Extend `useTokenizerState` to add the `tokenizerMode` toggle, `vocabulary` state, and vocabulary refetch after every successful custom-mode tokenize and after reset, in `frontend/src/state/useTokenizerState.ts` (depends on T021, T038)
- [X] T040 [P] [US2] Create `VocabularyPanel` component (ID/token/frequency/status table + reset button, new-entry highlight) in `frontend/src/components/VocabularyPanel.tsx`
- [X] T041 [US2] Add the tokenizer-mode toggle to `InputPanel` and render `VocabularyPanel` plus the new-token highlight in `TokenVisualization` when `tokenizerMode = custom`, in `frontend/src/components/InputPanel.tsx` and `frontend/src/components/TokenVisualization.tsx` (depends on T039, T040)
- [X] T042 [P] [US2] Frontend component tests for the Custom Tokenizer flow in `frontend/tests/VocabularyPanel.test.tsx` and `frontend/tests/TokenVisualization.customMode.test.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Tokenize Uploaded TXT and PDF Files (Priority: P2)

**Goal**: A user uploads a TXT or text-based PDF file; the app extracts and displays the
text, then tokenizes it the same way as typed input.

**Independent Test**: Upload a valid TXT file and a valid text-based PDF file (independent
of typed input) and confirm extracted text and tokenization results are displayed for
each.

### Tests for User Story 3 ⚠️

- [X] T043 [P] [US3] Contract test for `POST /api/files/extract` — valid TXT, valid PDF, and all file-error cases — in `backend/tests/contract/test_files_extract.py`
- [X] T044 [P] [US3] Unit test for `FileService` validation and extraction (valid TXT/PDF, oversized, wrong type, corrupted PDF, no-extractable-text PDF, non-UTF-8 TXT) in `backend/tests/unit/test_file_service.py`
- [X] T045 [P] [US3] Integration test: upload TXT then PDF, extract, and tokenize each (User Story 3 acceptance scenarios 1–3) in `backend/tests/integration/test_file_upload_flow.py`

### Implementation for User Story 3

- [X] T046 [US3] Create `ExtractedTextResponse` Pydantic schema in `backend/src/schemas/files.py`
- [X] T047 [US3] Implement `FileService` (`validate_upload`, `extract_txt`, `extract_pdf` using PyMuPDF) in `backend/src/services/file_service.py`
- [X] T048 [US3] Implement `POST /api/files/extract` route handler in `backend/src/api/routes.py` (depends on T047, T046)
- [X] T049 [P] [US3] Add `ExtractedTextResponse` TypeScript type in `frontend/src/types/api.ts`
- [X] T050 [US3] Add `extractFile()` function to `frontend/src/api/client.ts` (depends on T049)
- [X] T051 [US3] Extend `useTokenizerState` to add `inputMode` (`'text' | 'file'`) and extracted-file-text handling in `frontend/src/state/useTokenizerState.ts` (depends on T050)
- [X] T052 [P] [US3] Create `ExtractedTextPanel` component in `frontend/src/components/ExtractedTextPanel.tsx`
- [X] T053 [US3] Add the file-upload control and text/file mode toggle to `InputPanel`, and wire `ExtractedTextPanel` into `App.tsx` in `frontend/src/components/InputPanel.tsx` and `frontend/src/App.tsx` (depends on T051, T052)
- [X] T054 [P] [US3] Frontend component tests for the upload control and `ExtractedTextPanel` in `frontend/tests/InputPanel.fileUpload.test.tsx` and `frontend/tests/ExtractedTextPanel.test.tsx`

**Checkpoint**: User Stories 1, 2, and 3 are all independently functional.

---

## Phase 6: User Story 4 - Clear Feedback for Invalid Input and Errors (Priority: P3)

**Goal**: Every invalid-input condition produces a clear, specific, user-friendly error
instead of a broken or silent result.

**Independent Test**: Trigger each invalid condition (empty input, unsupported file type,
oversized file, corrupted PDF, image-only PDF, unsupported encoding) in isolation and
confirm a distinct error appears each time with no partial/misleading results.

### Tests for User Story 4 ⚠️

- [X] T055 [P] [US4] Contract tests for every validation error response (`EMPTY_INPUT`, `UNSUPPORTED_ENCODING`, `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE`, `INVALID_PDF`, `NO_EXTRACTABLE_TEXT`, `INVALID_TEXT_ENCODING`) in `backend/tests/contract/test_validation_errors.py`
- [X] T056 [P] [US4] Integration test covering all 6 invalid-input conditions end-to-end plus loading/error/success state transitions (User Story 4 acceptance scenarios 1–7) in `backend/tests/integration/test_error_handling_flow.py`

### Implementation for User Story 4

- [X] T057 [US4] Add empty-input and unsupported-encoding validation (raising the mapped domain errors) to the `POST /api/tokenize` path in `backend/src/api/routes.py` and `backend/src/services/tiktoken_service.py`
- [X] T058 [US4] Ensure `FileService` raises the correct mapped error with a user-friendly message for each invalid condition in `backend/src/services/file_service.py`
- [X] T059 [US4] Add a global FastAPI exception handler in `backend/src/main.py` mapping each domain error to its `ErrorResponse` body and HTTP status code from `contracts/api.md`
- [X] T060 [US4] Ensure `useTokenizerState` transitions consistently through loading/error/success for every action (tokenize, extract, reset), never leaving an ambiguous state, in `frontend/src/state/useTokenizerState.ts`
- [X] T061 [P] [US4] Disable the Tokenize action on empty input and surface every error message via `StatusBanner` in `frontend/src/components/StatusBanner.tsx` and `frontend/src/components/InputPanel.tsx`
- [X] T062 [P] [US4] Frontend component tests asserting each error condition renders its distinct message with no partial results in `frontend/tests/errorHandling.test.tsx`

**Checkpoint**: All four user stories are independently functional; error handling is complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T063 [P] Add responsive layout rules (common desktop/mobile breakpoints) across the component CSS Modules in `frontend/src/styles/`
- [X] T064 [P] Accessibility pass — keyboard operability, ARIA labels/roles, visible focus states — across all components in `frontend/src/components/`
- [X] T065 Run the full `quickstart.md` validation with both servers running and confirm all scenarios pass
- [X] T066 [P] Add a root `README.md` with backend and frontend setup/run instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; extends US1's `routes.py`, `types/api.ts`, and `useTokenizerState.ts` (T018, T019/T037 same file at different times, T021/T039), but is independently testable once its own tasks land
- **User Story 3 (Phase 5)**: Depends on Foundational; extends the same shared files as US2 for its own additions, independently testable on its own
- **User Story 4 (Phase 6)**: Depends on Foundational, and touches error paths introduced by US1–US3's services, so it is implemented last even though it could theoretically start once T006/T007 exist
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- Tests are written first and MUST fail before implementation begins
- Schemas before services; services before route handlers; backend contract stable before frontend API client/types; hook state before components; components before `App.tsx` wiring

### Parallel Opportunities

- Setup: T003, T004, T005 in parallel (T002 first, distinct files)
- Foundational: T008, T009 in parallel once T006/T007 land
- All `[P]`-marked tests within a story's "Tests" subsection run in parallel
- All `[P]`-marked component-creation tasks within a story run in parallel
- US1, US2, and US3 could be staffed to different developers in parallel after Foundational, provided US2/US3 developers coordinate on the shared files noted above (`routes.py`, `types/api.ts`, `useTokenizerState.ts`)

---

## Parallel Example: User Story 1

```bash
# Tests for User Story 1 together:
Task: "Contract test for GET /api/encodings in backend/tests/contract/test_encodings.py"
Task: "Contract test for POST /api/tokenize (Tiktoken) in backend/tests/contract/test_tokenize_tiktoken.py"
Task: "Unit test for TiktokenService in backend/tests/unit/test_tiktoken_service.py"
Task: "Unit test for StatsService in backend/tests/unit/test_stats_service.py"

# Presentational components for User Story 1 together:
Task: "Create InputPanel component in frontend/src/components/InputPanel.tsx"
Task: "Create EncodingSelector component in frontend/src/components/EncodingSelector.tsx"
Task: "Create TokenizeButton component in frontend/src/components/TokenizeButton.tsx"
Task: "Create StatsPanel component in frontend/src/components/StatsPanel.tsx"
Task: "Create TokenVisualization component in frontend/src/components/TokenVisualization.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` scenario 1 independently
5. Demo the Tiktoken tokenize-and-display loop

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate → demo (MVP!)
3. Add User Story 2 → validate → demo (Custom Tokenizer + vocabulary)
4. Add User Story 3 → validate → demo (file upload)
5. Add User Story 4 → validate → demo (hardened error handling)
6. Finish with Phase 7 polish

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels trace every task back to spec.md's user stories
- Verify each new test fails before writing the implementation that makes it pass
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
- Avoid: vague tasks, two `[P]` tasks touching the same file, and cross-story edits that break a story's independent testability

---

## Phase 8: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between the shipped implementation and spec.md/plan.md/tasks.md.

- [X] T067 Add automated tests for `useTokenizerState` (request-id/`AbortController` stale-response guarding, mode/encoding switching, and vocabulary refetch after custom-mode tokenize and after reset) and for `client.ts`'s error handling, using mocked `fetch`, in `frontend/tests/useTokenizerState.test.ts` and `frontend/tests/client.test.ts` per Constitution VI / plan.md Implementation Sequence step 9 / SC-006 (missing)
- [X] T068 Render each token's index visibly (not only via the `title` tooltip) in `frontend/src/components/TokenVisualization.tsx` per FR-021 (partial)
- [X] T069 Add a non-color "new" indicator (text/icon) alongside the existing color highlight for newly created tokens in `frontend/src/components/TokenVisualization.tsx`, matching the textual status `VocabularyPanel.tsx` already shows, per FR-018, FR-032 (partial)
- [X] T070 Add horizontal-scroll/overflow handling to the vocabulary table in `frontend/src/components/VocabularyPanel.module.css` so it stays usable at common mobile widths per FR-031 (partial)
- [X] T071 Remove the unused `oxlint` dev dependency and `lint` script from `frontend/package.json` (Vite scaffold leftover, never configured or run) per Constitution VI (unrequested)
