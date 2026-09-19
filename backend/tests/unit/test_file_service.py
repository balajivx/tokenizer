import pytest

from src.schemas.errors import TokenizerError
from src.services import file_service
from tests.conftest import make_pdf_bytes


def test_validate_upload_accepts_txt():
    assert file_service.validate_upload("notes.txt", 100) == "txt_file"


def test_validate_upload_accepts_pdf():
    assert file_service.validate_upload("doc.pdf", 100) == "pdf_file"


def test_validate_upload_rejects_unsupported_type():
    with pytest.raises(TokenizerError) as exc_info:
        file_service.validate_upload("doc.docx", 100)
    assert exc_info.value.error_code.value == "UNSUPPORTED_FILE_TYPE"


def test_validate_upload_rejects_oversized_file():
    with pytest.raises(TokenizerError) as exc_info:
        file_service.validate_upload("notes.txt", 11 * 1024 * 1024)
    assert exc_info.value.error_code.value == "FILE_TOO_LARGE"


def test_extract_txt_valid_utf8():
    assert file_service.extract_txt("hello there".encode("utf-8")) == "hello there"


def test_extract_txt_rejects_non_utf8_bytes():
    with pytest.raises(TokenizerError) as exc_info:
        file_service.extract_txt(b"\xff\xfe\x00\x01not utf-8")
    assert exc_info.value.error_code.value == "INVALID_TEXT_ENCODING"


def test_extract_pdf_valid_text_pdf():
    text = file_service.extract_pdf(make_pdf_bytes("Hello from a real PDF."))
    assert "Hello from a real PDF." in text


def test_extract_pdf_rejects_corrupted_bytes():
    with pytest.raises(TokenizerError) as exc_info:
        file_service.extract_pdf(b"this is not a pdf at all")
    assert exc_info.value.error_code.value == "INVALID_PDF"


def test_extract_pdf_rejects_no_extractable_text():
    with pytest.raises(TokenizerError) as exc_info:
        file_service.extract_pdf(make_pdf_bytes(text=None))
    assert exc_info.value.error_code.value == "NO_EXTRACTABLE_TEXT"


def test_extract_pdf_mixed_text_and_image_extracts_only_text():
    import pymupdf

    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((72, 72), "Visible text next to an image.")
    pixmap = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 8, 8), False)
    pixmap.set_rect(pixmap.irect, (255, 0, 0))
    page.insert_image(pymupdf.Rect(200, 200, 250, 250), pixmap=pixmap)
    pdf_bytes = document.tobytes()
    document.close()

    text = file_service.extract_pdf(pdf_bytes)
    assert "Visible text next to an image." in text
