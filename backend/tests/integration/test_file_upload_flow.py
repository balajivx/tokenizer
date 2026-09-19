"""User Story 3 acceptance scenarios: upload TXT/PDF, extract, then tokenize."""
import io

from tests.conftest import make_pdf_bytes


def test_upload_txt_then_tokenize(client):
    extract = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b"hello there"), "text/plain")},
    ).json()
    assert extract["text"] == "hello there"

    tokenize = client.post(
        "/api/tokenize",
        json={
            "text": extract["text"],
            "source_type": "txt_file",
            "tokenizer_mode": "tiktoken",
            "encoding": "cl100k_base",
        },
    )
    assert tokenize.status_code == 200
    assert tokenize.json()["source_type"] == "txt_file"


def test_upload_pdf_then_tokenize(client):
    extract = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(make_pdf_bytes("Hello PDF world")), "application/pdf")},
    ).json()
    assert "Hello PDF world" in extract["text"]

    tokenize = client.post(
        "/api/tokenize",
        json={
            "text": extract["text"],
            "source_type": "pdf_file",
            "tokenizer_mode": "custom",
            "encoding": None,
        },
    )
    assert tokenize.status_code == 200
    assert tokenize.json()["source_type"] == "pdf_file"
