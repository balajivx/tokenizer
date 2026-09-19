# Phase 0 Research: Text Tokenization Application with BPE

## 1. PDF text extraction library

- **Decision**: `PyMuPDF` (imported as `fitz`) — fixed by project constraints.
- **Rationale**: `PyMuPDF` is fast, actively maintained, and its per-page `get_text()` API cleanly supports both required failure modes: raising on malformed/corrupted files when opening the document (FR-026), and returning empty text per page so the service can detect "no extractable text" documents (FR-027) without additional dependencies (no OCR is invoked, consistent with FR-034).
- **Alternatives considered**: Not evaluated further — `PyMuPDF` is a fixed constraint for this plan.

## 2. Tiktoken encoding enumeration

- **Decision**: Enumerate the selectable encodings from `tiktoken.list_encoding_names()` at backend startup and expose them via a dedicated `GET /api/encodings` endpoint; the frontend renders whatever the backend returns rather than hard-coding a list.
- **Rationale**: Exposes every encoding the installed Tiktoken library supports (including legacy ones) and maps them to OpenAI model names, defaulting to `o200k_base` to match OpenAI platform tokenizer.

## 3. Simple Custom Tokenizer deterministic splitting strategy

- **Decision**: Regex-based splitting using the pattern `\w+|[^\w\s]` applied left-to-right over the input with Python's built-in `re` module (`re.findall`), so runs of alphanumeric/underscore characters form one token each and every other non-whitespace character (punctuation/symbols) forms its own token.

## 4. Deterministic custom vocabulary ID assignment

- **Decision**: IDs are assigned as a strictly increasing integer counter starting at 0 in the order tokens are first seen.

## 5. Concurrency safety for in-memory stores

- **Decision**: Guard all reads/mutations of the in-memory Custom Tokenizer vocabulary and BPE model state with process-local locks (Python `threading.Lock`), and run the backend as a single Uvicorn worker process.

## 6. Frontend automated testing framework

- **Decision**: Vitest + React Testing Library.

## 7. UI visual system (neon-gradient / dark cyberpunk aesthetic)

- **Decision**: A hand-written CSS design system using native CSS custom properties (`:root` tokens) for a dark background with neon cyan/magenta/violet gradient accents.

## 8. Byte Pair Encoding (BPE) training and tokenization algorithm

- **Decision**: Pure Python, zero-external-dependency BPE implementation in the FastAPI backend:
  1. **Base Vocabulary Initialization**:
     - Scans `training_text` for all distinct individual characters.
     - Sorts the initial characters deterministically (e.g. by Unicode codepoint) and assigns initial sequential IDs: `0, 1, ..., |V_0|-1`.
  2. **Corpus Token Sequence Representation**:
     - Represents the training corpus as a sequence of list of character tokens (or list of words split into characters).
  3. **Iterative Pair Counting & Merging**:
     - At each step $k$, counts the frequencies of all adjacent pairs $(t_i, t_{i+1})$.
     - Selects the pair with maximum frequency.
     - **Deterministic Tie-Breaking**: When multiple pairs share the same highest frequency, selects the pair with the smallest tuple lexicographically (e.g. `('a', 'b') < ('a', 'c')`).
     - Replaces all occurrences of the selected pair in the corpus with the concatenated token string $t_{\text{merged}} = t_i + t_{i+1}$.
     - Assigns the merged token the next sequential deterministic ID: $|V_0| + k - 1$.
     - Records the merge rule: `{ rank: k, pair: [t_i, t_{i+1}], merged_token: t_merged, token_id: ID }`.
     - Logs step details: `{ step: k, pair: [t_i, t_{i+1}], frequency: freq, merged_token: t_merged, token_id: ID }`.
     - Stops when vocabulary size reaches `target_vocab_size` or no pairs with frequency $\ge 1$ remain.
  4. **BPE Tokenization (Inference)**:
     - Splits input text into individual characters.
     - Iterates through the learned ordered merge rules in ascending rank order (1 to $N$), merging matching adjacent token pairs throughout the sequence.
     - Maps resulting tokens to their deterministic vocabulary IDs. Unseen characters receive a deterministic fallback ID or base character representation.
     - Does NOT mutate merge rules or vocabulary during tokenization (pure inference).
- **Rationale**: Delivers transparent, step-by-step subword learning and deterministic tokenization without external tokenization training libraries, completely adhering to the architecture where FastAPI owns all algorithmic tokenization logic.
