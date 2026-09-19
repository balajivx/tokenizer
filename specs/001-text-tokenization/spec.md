# Feature Specification: Text Tokenization Application with Byte Pair Encoding (BPE)

**Feature Branch**: `001-text-tokenization`

**Created**: 2026-09-16
**Updated**: 2026-09-17 (BPE Custom Tokenizer Enhancement)

**Status**: Draft

**Input**: User description: "Update the existing specification to enhance the Custom Tokenizer with Byte Pair Encoding (BPE). Keep all existing functionality unchanged, especially Tiktoken and the current Custom Tokenizer. The Custom Tokenizer should support BPE training using user-provided training text. The user should be able to enter training text, set a target vocabulary size, and start BPE training. After training, the UI should show the learned vocabulary, merge rules, and training details such as the pair selected and merged at each step. The user should then be able to enter new text and tokenize it using the trained BPE tokenizer. Display the resulting tokens and token IDs in the existing tokenization result table. The UI should clearly separate the BPE training flow from the BPE tokenization flow and provide appropriate loading, empty, validation, success, and error states. The BPE algorithm should learn frequent adjacent pairs, merge them repeatedly, create a vocabulary and ordered merge rules, and use those learned rules when tokenizing new text. It must not learn new merge rules during tokenization. BPE vocabulary IDs must be deterministic. Keep all BPE logic in the FastAPI backend. The React frontend should handle user input, API calls, UI state, results, and visualization only. Add the necessary requirements and acceptance criteria for BPE training, tokenization, vocabulary, merge rules, UI flow, validation, and testing. Remove or update any existing requirement that conflicts with adding BPE training. Do not change unrelated requirements and do not write implementation code."

## Clarifications

### Session 2026-09-16
- Q: Should the Custom Tokenizer's vocabulary be shared globally across every user/browser tab hitting the app, or isolated per user session? → A: Global: one shared vocabulary for the whole running app instance, visible to all users.
- Q: What should be the default, preselected Tiktoken encoding when the app first loads, before the user picks one? → A: `o200k_base` (OpenAI GPT-4o default).
- Q: Should the encoding selector offer every encoding Tiktoken supports, or only a curated subset of current-generation encodings? → A: All: expose every encoding the Tiktoken library supports, including legacy ones.

### Session 2026-09-17 (BPE Enhancement)
- Q: How does BPE training initialize its base vocabulary? → A: From all unique initial characters (or bytes) present in the training text, assigned deterministic sequential integer IDs starting from 0 (e.g. sorted by character codepoint).
- Q: How are ties broken when multiple adjacent token pairs have the identical maximum frequency during BPE training? → A: Deterministically by lexicographical order of the token pairs `(token_a, token_b)`.
- Q: What happens if BPE training text exhausts all mergeable pairs before reaching the target vocabulary size? → A: Training stops cleanly when no adjacent pairs with frequency $\ge 1$ remain, returning the learned vocabulary and merge rules without error.
- Q: How does BPE tokenization interact with the learned model state? → A: Tokenization is a read-only pure function: it applies the ordered merge rules learned during training and never creates new merge rules or mutates vocabulary during tokenization.
- Q: How are BPE training and tokenization presented in the UI? → A: As distinct, clearly separated interactive sections: a BPE Training Section (training text, target vocabulary size, Train action, learned vocabulary table, ordered merge rules table, and step-by-step merge inspector) and a BPE Tokenization Section (input text/file, Tokenize action, and standard Token Breakdown / Token IDs results table).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tokenize Pasted Text with Tiktoken (Priority: P1)

A user pastes or types text directly into the application, selects a supported Tiktoken
encoding, and tokenizes it to see exactly how that encoding breaks the text into tokens,
along with summary statistics and matching OpenAI token IDs.

**Why this priority**: Core value of the product — seeing how real text becomes tokens
under a real, industry-standard tokenizer.

**Independent Test**: Can be fully tested by typing text into the input, choosing a
Tiktoken encoding, and tokenizing — delivers a complete, standalone view of token
breakdown, token IDs, and statistics with no dependency on file upload or custom tokenizers.

**Acceptance Scenarios**:
1. **Given** the application is loaded with Tiktoken mode selected and a supported encoding chosen, **When** the user types non-empty text and tokenizes it, **Then** the system displays, for each token, its index, real token ID, and decoded token text, and displays character count, word count, token count, tokens per word, and tokens per character for the input.
2. **Given** the user has already tokenized one piece of text, **When** the user changes the encoding and tokenizes the same text again, **Then** the displayed token IDs, token breakdown, and statistics update to reflect the newly selected encoding.
3. **Given** Tiktoken mode is selected, **When** tokenization completes, **Then** the token IDs and decoded tokens shown match what the selected encoding actually produces, and no part of the encoding's vocabulary is altered.

---

### User Story 2 - Tokenize with Simple Custom Tokenizer and Track Vocabulary (Priority: P2)

A user switches to Simple Custom Tokenizer mode (word/regex-based), tokenizes text, and
observes how the application's vocabulary grows over time with deterministic IDs, frequency
tracking, and reset capabilities.

**Why this priority**: Demonstrates dynamic vocabulary formation with an application-owned
vocabulary store.

**Independent Test**: Can be fully tested by switching to Custom Tokenizer mode,
tokenizing phrases, observing ID reuse and frequency increments, and resetting the vocabulary.

**Acceptance Scenarios**:
1. **Given** the Custom Tokenizer vocabulary is empty, **When** the user tokenizes text containing previously unseen tokens, **Then** each unique token is assigned a new deterministic ID, added to the vocabulary with a frequency of 1, and visually marked as newly created.
2. **Given** the vocabulary already contains a token from a prior tokenization, **When** the user tokenizes new text containing that token, **Then** the system reuses its existing ID and increments frequency.
3. **Given** the user resets the Custom Tokenizer vocabulary, **Then** the vocabulary returns to an empty initial state.

---

### User Story 3 - Train Custom Tokenizer with Byte Pair Encoding (BPE) (Priority: P2)

A user navigates to the BPE Tokenizer section, enters training text, specifies a target
vocabulary size, and starts BPE training. The backend iteratively merges the most frequent
adjacent token pairs, builds a vocabulary and ordered merge rules, and logs step-by-step
training details. After training, the UI displays the learned vocabulary, ordered merge rules,
and step-by-step merge log.

**Why this priority**: Enables users to understand how modern subword tokenizers (like GPT
tokenizers) learn subword vocabularies and merge rules from corpus data.

**Independent Test**: Can be fully tested by providing training text (e.g. `"low low low lower newest widest"`), setting a target vocabulary size (e.g. 12), executing training, and verifying that the resulting base vocabulary, merge rules (e.g. `('l', 'o') -> 'lo'`), and step-by-step logs are displayed deterministically.

**Acceptance Scenarios**:
1. **Given** the user enters training text and a valid target vocabulary size, **When** the user clicks "Train BPE", **Then** the backend initializes the base character vocabulary, iteratively discovers and merges the most frequent adjacent token pairs, assigns sequential deterministic IDs to each new merged token, and records ordered merge rules.
2. **Given** BPE training completes, **Then** the UI displays:
   - The learned vocabulary with deterministic token IDs and token strings.
   - The ordered list of merge rules showing the two constituent tokens, the merged token, and the merge rank.
   - Step-by-step training details displaying the pair selected, occurrence count, resulting merged token, and resulting ID at each step.
3. **Given** identical training text and target vocabulary size are trained multiple times, **Then** the resulting vocabulary, merge rules, and token IDs are 100% identical.
4. **Given** the user clicks "Reset BPE Model", **Then** the learned BPE model, merge rules, and vocabulary are cleared back to an untrained initial state.

---

### User Story 4 - Tokenize Text Using the Trained BPE Tokenizer (Priority: P2)

A user enters new text to tokenize with the trained BPE model. The backend applies the
learned ordered merge rules in priority order to produce tokens and deterministic token IDs,
displaying them in the token visualization and token IDs table without modifying the model.

**Why this priority**: Closes the loop from subword training to inference/tokenization,
showing how learned merge rules are applied to novel text.

**Independent Test**: Can be fully tested by training a BPE model, entering unseen text,
tokenizing it, and confirming that subwords are merged according to the learned rules and
mapped to the learned vocabulary IDs without changing the vocabulary.

**Acceptance Scenarios**:
1. **Given** a BPE model has been trained, **When** the user enters text in the BPE tokenization input and tokenizes, **Then** the system splits text into base characters, applies learned merge rules in order of training rank, maps final subwords to their deterministic vocabulary IDs, and displays the token breakdown, token IDs, and statistics.
2. **Given** text is tokenized with the BPE model, **When** tokenization finishes, **Then** no new merge rules are added and the BPE vocabulary remains unmodified.
3. **Given** no BPE model has been trained yet, **When** the user attempts to tokenize with BPE, **Then** the system displays a clear validation error indicating that a BPE model must be trained first.

---

### User Story 5 - Tokenize Uploaded TXT and PDF Files (Priority: P2)

A user uploads a TXT or a text-based PDF file, and the application extracts the text and
allows tokenizing it or using it as BPE training text.

**Acceptance Scenarios**:
1. **Given** the user uploads a valid TXT or PDF file, **When** extraction completes, **Then** the system displays the extracted text and allows using it for tokenization or BPE training.

---

### User Story 6 - Clear Feedback for Invalid Input and Errors (Priority: P3)

A user encounters clear, descriptive validation and error messages across all flows: empty
inputs, invalid target vocabulary sizes, untrained BPE tokenization attempts, oversized files,
or unsupported file types.

**Acceptance Scenarios**:
1. **Given** empty training text or direct text, **When** an action is triggered, **Then** an informative error message is displayed.
2. **Given** a target vocabulary size smaller than the number of unique base characters in the training text, **When** BPE training is triggered, **Then** the system shows a validation error explaining that the target vocabulary size must be at least the base character count.
3. **Given** any asynchronous operation (file extraction, BPE training, tokenization), **Then** distinct loading, error, success, and empty states are rendered.

---

## Edge Cases

- **Target vocabulary size equals base character count**: Training completes immediately at 0 merges, returning the base character vocabulary.
- **Target vocabulary size exceeds total possible merges**: When no adjacent token pairs remain to merge, training terminates gracefully without error, returning all merges learned up to that point.
- **Ties in pair frequencies**: When two or more adjacent pairs share the highest frequency, ties are resolved deterministically (lexicographical comparison of pair tuples).
- **Unseen characters during BPE tokenization**: When tokenizing text containing characters not present in the training set, the tokenizer treats each unseen character as an individual character token, assigning a deterministic fallback ID or out-of-vocabulary representation without failing.
- **Independent state isolation**: Training or tokenizing with BPE MUST NOT alter Tiktoken or the Simple Custom Tokenizer's vocabulary.
- **Resetting state**: Resetting BPE model clears the BPE vocabulary, merge rules, and training logs, returning the BPE flow to its untrained empty state.

---

## Requirements *(mandatory)*

### Functional Requirements

**Tokenizer Modes & Architecture**
- **FR-005**: The system MUST allow users to select between three tokenizer modes:
  1. Tiktoken (Pre-trained OpenAI models/encodings)
  2. Custom Tokenizer (Word/Regex dynamic vocabulary)
  3. Custom BPE Tokenizer (Trainable Byte Pair Encoding)
- **FR-006**: The system MUST support all Tiktoken encodings, defaulting to `o200k_base` (OpenAI GPT-4o default).
- **FR-007**: The system MUST keep Tiktoken, Custom Regex Tokenizer, and Custom BPE Tokenizer state and behavior fully independent.
- **FR-008**: All tokenization and BPE training logic MUST reside in the FastAPI backend service; the React frontend MUST handle user interaction, API requests, state management, and visualizations only.

**Tiktoken Mode (Unchanged)**
- **FR-009**: Tiktoken mode MUST use the selected encoding to produce real token IDs and tokens matching OpenAI platform tokenizer.
- **FR-010**: Tiktoken mode MUST NOT mutate the Tiktoken vocabulary under any circumstances.

**Simple Custom Tokenizer Mode (Unchanged)**
- **FR-011**: Simple Custom Tokenizer mode MUST use a deterministic regex-based token-splitting strategy (`\w+|[^\w\s]`).
- **FR-012**: Simple Custom Tokenizer MUST maintain a global in-memory vocabulary with frequency tracking and deterministic IDs.
- **FR-013**: Simple Custom Tokenizer MUST distinguish newly created tokens from existing tokens.
- **FR-014**: Simple Custom Tokenizer MUST provide a vocabulary reset capability.

**Custom BPE Tokenizer: Training**
- **FR-BPE-001**: The system MUST allow users to input training text (directly typed or extracted from an uploaded TXT/PDF file) and set a target vocabulary size integer ($V \ge 1$).
- **FR-BPE-002**: The BPE training algorithm MUST initialize the base vocabulary with all unique characters present in the training text, assigning deterministic sequential integer IDs starting at 0.
- **FR-BPE-003**: The BPE training algorithm MUST iteratively count the frequency of all adjacent token pairs in the tokenized training corpus.
- **FR-BPE-004**: At each training iteration, the system MUST select the adjacent token pair with the highest occurrence frequency. If multiple pairs share the maximum frequency, ties MUST be resolved deterministically using lexicographical comparison.
- **FR-BPE-005**: The system MUST merge the selected pair into a new composite token string and assign it the next sequential deterministic integer ID ($|V_{\text{current}}|$).
- **FR-BPE-006**: The system MUST record each merge as an ordered merge rule containing: merge rank (1-indexed), the first token, the second token, the merged token result, and the assigned token ID.
- **FR-BPE-007**: The system MUST record step-by-step training details for each merge step: step index, pair selected `(token_a, token_b)`, pair frequency in the corpus at that step, resulting merged token text, and resulting token ID.
- **FR-BPE-008**: BPE training MUST continue iteratively until the vocabulary size reaches the target vocabulary size OR no adjacent pairs with frequency $\ge 1$ remain to merge.
- **FR-BPE-009**: The system MUST store the trained BPE model (vocabulary, ordered merge rules, and training steps log) in memory in the backend.
- **FR-BPE-010**: The system MUST allow users to reset the trained BPE model back to an untrained initial state on demand.

**Custom BPE Tokenizer: Tokenization**
- **FR-BPE-011**: The system MUST allow users to tokenize arbitrary input text using the currently trained BPE model.
- **FR-BPE-012**: BPE tokenization MUST split input text into initial base character tokens, then iteratively apply the learned ordered merge rules in the exact sequence/priority learned during training.
- **FR-BPE-013**: BPE tokenization MUST NOT learn new merge rules, mutate the learned vocabulary, or modify merge rule order during tokenization.
- **FR-BPE-014**: The system MUST map each resulting subword token to its deterministic BPE vocabulary ID.
- **FR-BPE-015**: The system MUST display the resulting BPE tokens, indices, token IDs, and decoded text in the token visualization and token IDs table.

**BPE User Interface & Flow Separation**
- **FR-BPE-016**: The UI MUST provide a clear visual and functional separation between the BPE Training Flow and the BPE Tokenization Flow.
- **FR-BPE-017**: The BPE Training Flow UI MUST provide:
  - Training text input area with sample preset buttons.
  - Target vocabulary size numeric input with validation bounds.
  - "Train BPE" action button with loading indicator.
  - Learned Vocabulary Table (displaying Token ID, Token String, and Token Origin/Type).
  - Ordered Merge Rules Table (displaying Merge Rank, Pair `(A, B)`, and Resulting Token).
  - Step-by-Step Training Log (displaying Step #, Selected Pair, Frequency, Merged Token, and New ID).
  - "Reset BPE Model" action button.
- **FR-BPE-018**: The BPE Tokenization Flow UI MUST provide:
  - Text input area / file upload for inference text.
  - "Tokenize with BPE" action button.
  - Token Breakdown and Token IDs multi-view display (Highlight view, Token IDs array view, Chips view, Copy IDs buttons).
  - Summary statistics panel (characters, words, tokens, tokens/word, tokens/char).

**Validation & Error Handling**
- **FR-023**: The system MUST prevent tokenization when input text is empty.
- **FR-023b**: The system MUST reject BPE training if training text is empty or whitespace-only, showing a clear validation error.
- **FR-023c**: The system MUST validate that the target vocabulary size is a positive integer and is $\ge$ the number of unique base characters in the training text, displaying a clear error if invalid.
- **FR-023d**: The system MUST reject BPE tokenization requests if no BPE model has been trained yet, informing the user to train a model first.
- **FR-024**: The system MUST validate and reject unsupported file types for upload.
- **FR-025**: The system MUST reject files exceeding the 10 MB limit.
- **FR-026**: The system MUST handle invalid or unreadable PDF files gracefully.
- **FR-027**: The system MUST handle PDFs with no extractable text cleanly.
- **FR-028**: The system MUST reject invalid Tiktoken encoding options.
- **FR-029**: All validation and error messages MUST be presented in clear, user-friendly language.

**Application States & Accessibility**
- **FR-030**: The system MUST provide distinct empty, loading, success, and error states for BPE training, BPE tokenization, Tiktoken tokenization, and file extraction.
- **FR-031**: The system MUST maintain a responsive layout supporting desktop and mobile viewports.
- **FR-032**: The system MUST adhere to web accessibility standards (keyboard navigation, visible focus indicators, labeled forms).

**Data Handling & Exclusions**
- **FR-033**: The system MUST maintain all state (Tiktoken encodings, Custom vocabulary, BPE models) in memory for the lifetime of the application instance; no database is used.
- **FR-034**: The system MUST NOT include authentication, user accounts, OCR, cloud storage, LLM inference, or billing functionality.

---

## Key Entities

- **BPETrainingRequest**: Wire inbound entity containing `training_text` (string) and `target_vocab_size` (integer).
- **BPEMergeRule**: Represents one learned merge rule: `rank` (integer), `pair` (tuple of 2 strings), `merged_token` (string), and `token_id` (integer).
- **BPETrainingStep**: Represents one step in the training process: `step` (integer), `pair` (tuple of 2 strings), `frequency` (integer), `merged_token` (string), and `token_id` (integer).
- **BPEVocabularyEntry**: Represents an entry in the learned BPE vocabulary: `id` (integer), `token` (string), and `is_base_char` (boolean).
- **BPETrainingResult**: Wire outbound entity returned upon training completion: `initial_vocab_size` (integer), `final_vocab_size` (integer), `vocabulary` (array of BPEVocabularyEntry), `merge_rules` (array of BPEMergeRule), `training_steps` (array of BPETrainingStep), and `is_trained` (boolean).
- **BPEModel**: Backend in-memory singleton representing the trained BPE model state (vocabulary dict, ordered merge rules list, training steps log, lock).
- **TokenizationRequest**: Enhanced wire inbound entity supporting `tokenizer_mode: "tiktoken" | "custom" | "bpe"`.
- **TokenizationResult**: Standardized outbound entity containing token sequence (`TokenInfo[]`), token count, character count, word count, tokens/word, and tokens/char.

---

## Success Criteria *(mandatory)*

- **SC-001**: A user can train a BPE model on a 5,000-word training text with a target vocabulary size of 300 in under 3 seconds.
- **SC-002**: 100% deterministic BPE training: given identical training text and target vocabulary size, the learned vocabulary, merge rules, and IDs match across runs with zero variation.
- **SC-003**: 100% deterministic BPE tokenization: tokenizing input text with a trained BPE model produces the exact expected subword sequence and token IDs without modifying the vocabulary or merge rules.
- **SC-004**: 100% of BPE training sessions provide an inspectable learned vocabulary table, ordered merge rules table, and step-by-step training details log in the UI.
- **SC-005**: 100% of invalid BPE training or tokenization attempts (empty training text, target vocab size $< |V_{\text{initial}}|$, tokenizing before training) produce clear, user-friendly error messages.
- **SC-006**: The BPE Training Flow and BPE Tokenization Flow are clearly separated in the UI, enabling users to train, inspect rules, and tokenize without ambiguity.
- **SC-007**: Existing Tiktoken tokenization (with OpenAI token ID parity) and Simple Custom Tokenizer functionality remain 100% operational and regression-free.
