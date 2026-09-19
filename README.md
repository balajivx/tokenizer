# Text Tokenization Application

A small tool for understanding how text becomes tokens — tokenize typed text or an
uploaded TXT/PDF file with a real Tiktoken encoding, or with this app's own Custom
Tokenizer and its growing, resettable vocabulary.

See `specs/001-text-tokenization/` for the full spec, plan, and task breakdown.

## Backend (FastAPI, Python 3.11+)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

uvicorn src.main:app --reload --port 8000   # serves the API at http://localhost:8000/api
pytest                                        # run the backend test suite
```

## Frontend (React + TypeScript, via Vite)

```bash
cd frontend
npm install

npm run dev      # dev server at http://localhost:5173, proxies /api to the backend on :8000
npm run build    # production build
npm test         # run the Vitest suite
```

Start the backend first (port 8000), then the frontend — `frontend/vite.config.ts`
proxies `/api/*` requests to `http://localhost:8000`.

## Validating the feature end-to-end

See `specs/001-text-tokenization/quickstart.md` for the full manual validation walkthrough
covering every user story and error condition.
