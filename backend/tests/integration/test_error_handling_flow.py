"""User Story 4 acceptance scenarios: every invalid-input condition produces
a distinct, user-friendly error with no partial results."""
import io

from tests.conftest import make_pdf_bytes

CASES = [
    (
        "empty input",
        lambda c: c.post(
            "/api/tokenize",
            json={"text": "", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
        ),
        400,
        "EMPTY_INPUT",
    ),
    (
        "unsupported file type",
        lambda c: c.post(
            "/api/files/extract",
            files={"file": ("notes.docx", io.BytesIO(b"x"), "application/octet-stream")},
        ),
        415,
        "UNSUPPORTED_FILE_TYPE",
    ),
    (
        "oversized file",
        lambda c: c.post(
            "/api/files/extract",
            files={"file": ("notes.txt", io.BytesIO(b"a" * (10 * 1024 * 1024 + 1)), "text/plain")},
        ),
        413,
        "FILE_TOO_LARGE",
    ),
    (
        "corrupted PDF",
        lambda c: c.post(
            "/api/files/extract",
            files={"file": ("doc.pdf", io.BytesIO(b"garbage"), "application/pdf")},
        ),
        422,
        "INVALID_PDF",
    ),
    (
        "PDF with no extractable text",
        lambda c: c.post(
            "/api/files/extract",
            files={"file": ("doc.pdf", io.BytesIO(make_pdf_bytes(text=None)), "application/pdf")},
        ),
        422,
        "NO_EXTRACTABLE_TEXT",
    ),
    (
        "unsupported encoding",
        lambda c: c.post(
            "/api/tokenize",
            json={"text": "hi", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "bogus"},
        ),
        400,
        "UNSUPPORTED_ENCODING",
    ),
]


def test_all_six_invalid_conditions_produce_distinct_errors(client):
    seen_messages = set()
    for name, make_request, expected_status, expected_code in CASES:
        response = make_request(client)
        assert response.status_code == expected_status, name
        body = response.json()
        assert body["error_code"] == expected_code, name
        assert body["message"] and isinstance(body["message"], str), name
        assert "tokens" not in body and "entries" not in body, f"{name} leaked partial results"
        seen_messages.add(body["message"])

    # Every condition gets its own distinct message (SC-003).
    assert len(seen_messages) == len(CASES)


def test_successful_tokenize_after_a_prior_error_is_unaffected(client):
    client.post(
        "/api/tokenize",
        json={"text": "", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    )
    response = client.post(
        "/api/tokenize",
        json={"text": "hello", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    )
    assert response.status_code == 200
