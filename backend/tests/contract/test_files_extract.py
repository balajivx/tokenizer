import io

from tests.conftest import make_pdf_bytes


def test_extract_valid_txt(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b"hello there"), "text/plain")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["source_type"] == "txt_file"
    assert body["text"] == "hello there"
    assert body["character_count"] == len("hello there")


def test_extract_valid_pdf(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(make_pdf_bytes("Hello PDF")), "application/pdf")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["source_type"] == "pdf_file"
    assert "Hello PDF" in body["text"]


def test_extract_empty_file_rejected(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "EMPTY_INPUT"


def test_extract_unsupported_type_rejected(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.docx", io.BytesIO(b"content"), "application/octet-stream")},
    )
    assert response.status_code == 415
    assert response.json()["error_code"] == "UNSUPPORTED_FILE_TYPE"


def test_extract_oversized_file_rejected(client):
    big_content = b"a" * (10 * 1024 * 1024 + 1)
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(big_content), "text/plain")},
    )
    assert response.status_code == 413
    assert response.json()["error_code"] == "FILE_TOO_LARGE"


def test_extract_corrupted_pdf_rejected(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(b"not a real pdf"), "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_PDF"


def test_extract_pdf_with_no_text_rejected(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("doc.pdf", io.BytesIO(make_pdf_bytes(text=None)), "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "NO_EXTRACTABLE_TEXT"


def test_extract_non_utf8_txt_rejected(client):
    response = client.post(
        "/api/files/extract",
        files={"file": ("notes.txt", io.BytesIO(b"\xff\xfe\x00\x01"), "text/plain")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_TEXT_ENCODING"
