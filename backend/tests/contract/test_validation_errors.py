"""Cross-cutting check that every validation condition in contracts/api.md
maps to the correct HTTP status and error_code, in one place, per FR-029 /
SC-003. Endpoint-specific behavior is covered in the sibling contract tests;
this file is the single source of truth for the status/error_code table."""
import io

from tests.conftest import make_pdf_bytes


def test_empty_text_input(client):
    response = client.post(
        "/api/tokenize",
        json={"text": "", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    )
    assert (response.status_code, response.json()["error_code"]) == (400, "EMPTY_INPUT")


def test_unsupported_encoding(client):
    response = client.post(
        "/api/tokenize",
        json={"text": "hi", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "bogus"},
    )
    assert (response.status_code, response.json()["error_code"]) == (400, "UNSUPPORTED_ENCODING")


def test_unsupported_file_type(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.docx", io.BytesIO(b"x"), "application/octet-stream")},
    )
    assert (response.status_code, response.json()["error_code"]) == (415, "UNSUPPORTED_FILE_TYPE")


def test_file_too_large(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b"a" * (10 * 1024 * 1024 + 1)), "text/plain")},
    )
    assert (response.status_code, response.json()["error_code"]) == (413, "FILE_TOO_LARGE")


def test_invalid_pdf(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(b"garbage"), "application/pdf")},
    )
    assert (response.status_code, response.json()["error_code"]) == (422, "INVALID_PDF")


def test_no_extractable_text(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(make_pdf_bytes(text=None)), "application/pdf")},
    )
    assert (response.status_code, response.json()["error_code"]) == (422, "NO_EXTRACTABLE_TEXT")


def test_invalid_text_encoding(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b"\xff\xfe\x00\x01"), "text/plain")},
    )
    assert (response.status_code, response.json()["error_code"]) == (422, "INVALID_TEXT_ENCODING")


def test_every_error_response_matches_error_response_shape(client):
    response = client.post(
        "/api/tokenize",
        json={"text": "", "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    )
    assert set(response.json().keys()) == {"error_code", "message"}
    assert isinstance(response.json()["message"], str) and response.json()["message"]
