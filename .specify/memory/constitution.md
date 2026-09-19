<!--
Sync Impact Report
- Version change: (unratified template) → 1.0.0
- Modified principles: N/A (initial ratification)
- Added principles:
  I. Frontend/Backend Separation of Concerns
  II. Backend-Authoritative Tokenization (NON-NEGOTIABLE)
  III. Independent, Replaceable Tokenizer Services
  IV. Validated Input Handling
  V. Thin API, No Database
  VI. Traceable, Tested Simplicity
- Added sections: Architecture & Technology Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none (previous file was an unfilled placeholder scaffold)
- Templates requiring updates: none found referencing prior principle set (scaffold was never filled in); dependent templates (spec, plan, tasks, checklist) are read at runtime and were not modified per scope guard.
- Follow-up TODOs: none — all placeholders resolved.
-->

# Tokenizer Application Constitution

## Core Principles

### I. Frontend/Backend Separation of Concerns
React owns UI rendering, user interactions, API calls, loading states, error states, and
visualization only. FastAPI owns request validation, file processing, text extraction,
tokenization, statistics, vocabulary management, and API responses. Neither layer MUST
implement logic owned by the other.
Rationale: Keeps responsibilities unambiguous, prevents logic drift between layers, and
makes each layer independently testable and replaceable.

### II. Backend-Authoritative Tokenization (NON-NEGOTIABLE)
All tokenization MUST be performed by the backend. React MUST NOT implement, duplicate, or
approximate tokenizer logic in any form, including client-side token counting or splitting.
The frontend only renders results returned by the backend.
Rationale: A single source of truth for tokenization prevents divergence between what the
UI shows and what the backend actually computes, and avoids maintaining parallel
implementations that can drift apart.

### III. Independent, Replaceable Tokenizer Services
The system MUST maintain two independent tokenizer services: Tiktoken and Custom Tokenizer.
Tiktoken's behavior and vocabulary MUST remain unchanged and treated as externally
authoritative — no local overrides or patches. The Custom Tokenizer MUST maintain its own
in-memory vocabulary with deterministic token IDs and MUST support dynamic token creation.
Each tokenizer implementation MUST be independently replaceable or extendable without
requiring changes to the frontend beyond the existing API contract.
Rationale: Isolating tokenizer implementations behind a stable contract allows either to
evolve, be swapped, or be extended (e.g., adding a third tokenizer) without cascading
changes across the system.

### IV. Validated Input Handling
The backend MUST support TXT and PDF input files. All uploaded files MUST be validated and
have text extracted on the backend before tokenization. The frontend MUST NOT perform text
extraction or content validation beyond basic UX affordances (e.g., file type hints).
Rationale: Centralizing validation and extraction in the backend guarantees consistent
behavior regardless of client and prevents malformed or unsupported input from reaching
tokenizer services.

### V. Thin API, No Database
API routes MUST remain thin and delegate all business logic to backend services. No
database is required or permitted for this application; the Custom Tokenizer's vocabulary
MUST be kept in memory only.
Rationale: Keeps the system simple to run and reason about, and keeps route handlers
focused on request/response concerns rather than business logic.

### VI. Traceable, Tested Simplicity
All requirements and behavior MUST be clear, testable, and traceable to their
implementation and tests. Backend tests MUST use pytest; frontend behavior MUST have
appropriate automated tests. Unnecessary abstractions, dependencies, infrastructure, and
duplicated logic MUST be avoided.
Rationale: Traceability and test coverage keep the system verifiable as it grows, while a
simplicity constraint prevents speculative complexity that isn't justified by an actual
requirement.

## Architecture & Technology Constraints

The stack is fixed to React (frontend) and FastAPI/Python (backend); no additional
framework MUST be introduced to cover responsibilities already assigned to these two.
No persistent storage or database component is part of this system — all custom
vocabulary state is in-memory and MAY reset on backend restart. Tokenizer services MUST
expose a consistent interface to the API layer so routes and the frontend never depend on
either tokenizer's internal implementation details.

## Development Workflow & Quality Gates

Every change to tokenizer behavior, validation rules, or API contracts MUST include or
update corresponding pytest tests before merge. Every frontend change affecting
user-visible behavior MUST include or update automated frontend tests. Code review MUST
verify: routes remain thin, no tokenizer logic exists in the frontend, and no new
abstraction, dependency, or infrastructure was added without a clear justification tied to
a requirement.

## Governance

This constitution supersedes any conflicting practice or prior informal convention for the
Tokenizer application. Amendments are made by editing this file directly, MUST update the
Sync Impact Report and version per the policy below, and MUST be reviewed and approved
before merging. Versioning follows semantic versioning: MAJOR for backward-incompatible
governance or principle removals/redefinitions, MINOR for new principles or materially
expanded guidance, PATCH for clarifications and wording fixes. All pull requests and code
reviews MUST verify compliance with the principles above; any deviation MUST be justified
in the PR description or the change MUST be rejected.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
