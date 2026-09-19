# Quickstart: Text Tokenization Application with BPE

Validates the feature end-to-end against the acceptance scenarios in `spec.md`. See
`contracts/api.md` for exact request/response shapes and `data-model.md` for entity
details.

## Prerequisites

- Python 3.11+ with backend dependencies (FastAPI, tiktoken, PyMuPDF, Pydantic, pytest, uvicorn).
- Node.js (LTS) with frontend dependencies (React, TypeScript, Vite, Vitest, React Testing Library).
- No database, no external services, no environment secrets required.

## Run it

```bash
# Terminal 1 — backend
cd backend
./.venv/bin/uvicorn src.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in a browser.

---

## Validation scenarios

### 1. Tokenize pasted text with Tiktoken (User Story 1)
1. Select Tiktoken mode (default encoding `o200k_base`).
2. Type `Hello world!` and click Tokenize.
3. **Expect**: Token IDs `[13225, 2375, 0]` matching OpenAI platform tokenizer, with color-coded highlight view, Token IDs view, copy buttons, and statistics.
4. Change encoding to `cl100k_base` (GPT-4) and tokenize again.
5. **Expect**: Token IDs change to `[9906, 1917, 0]`.

### 2. Tokenize with Simple Custom Tokenizer (User Story 2)
1. Switch to Custom Tokenizer (Word/Regex) mode.
2. Tokenize `the quick brown fox`.
3. **Expect**: Each word appears in the vocabulary table with frequency 1 and marked `new`.
4. Tokenize `the lazy dog`.
5. **Expect**: `the` reuses its existing ID and increments frequency to 2; `lazy` and `dog` are marked new.
6. Click "Reset Vocabulary" and confirm the table is cleared.

### 3. Train BPE Model (User Story 3)
1. Switch to Custom BPE Tokenizer mode.
2. In the BPE Training Section, enter training corpus:
   ```
   low low low low low lower lower widest newest
   ```
3. Set Target Vocabulary Size to `16` and click **"Train BPE"**.
4. **Expect**:
   - Initial base characters (e.g. `[' ', 'd', 'e', 'i', 'l', 'n', 'o', 'r', 's', 't', 'w']`) assigned IDs `0..10`.
   - Iterative merges performed (e.g. `('l', 'o') -> 'lo'`, `('lo', 'w') -> 'low'`).
   - UI displays the Learned Vocabulary Table, Ordered Merge Rules Table, and Step-by-Step Merge Details log with pair frequencies.
5. Direct API validation:
   ```bash
   curl -s http://localhost:8000/api/bpe/train \
     -H 'Content-Type: application/json' \
     -d '{"training_text":"low low low lower newest widest","target_vocab_size":14}'
   ```

### 4. Tokenize with Trained BPE Model (User Story 4)
1. After training the BPE model above, enter new text in the BPE Tokenization input, e.g. `lowest width`.
2. Click **"Tokenize with BPE"**.
3. **Expect**: Subwords are segmented using the learned merge rules (e.g. `low`, `est`, ` `, `wid`, `est`) and mapped to deterministic BPE vocabulary IDs.
4. Verify that tokenization did not modify the vocabulary or merge rules.

### 5. Tokenize Uploaded TXT and PDF Files (User Story 5)
1. Upload a valid `.txt` or `.pdf` file.
2. **Expect**: Extracted text is displayed and can be used for tokenization or BPE training.

### 6. Invalid Input and Error Handling (User Story 6)
- Attempting to tokenize empty text -> `EMPTY_INPUT` ("Please enter some text...").
- Setting target vocab size $< |V_{\text{initial}}|$ -> `INVALID_TARGET_VOCAB_SIZE` ("Target vocabulary size must be at least...").
- Attempting BPE tokenization before training -> `BPE_NOT_TRAINED` ("No BPE model has been trained yet...").
- Uploading non-PDF/TXT file or file $> 10$ MB -> clear error message.

---

## Automated Test Entry Points

- Backend: `cd backend && ./.venv/bin/pytest`
- Frontend: `cd frontend && npm test`
