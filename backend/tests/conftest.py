import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.vocabulary_store import vocabulary_store


@pytest.fixture(autouse=True)
def _reset_vocabulary():
    """The Custom Tokenizer vocabulary is a global singleton (FR-012); reset
    it before every test so tests never leak state into one another."""
    vocabulary_store.reset()
    yield
    vocabulary_store.reset()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def make_pdf_bytes(text: str | None = "Hello from a real PDF.") -> bytes:
    """Build a minimal, valid PDF in memory via PyMuPDF for test fixtures.

    Passing `text=None` produces a PDF with a blank page (no extractable text).
    """
    import pymupdf

    document = pymupdf.open()
    page = document.new_page()
    if text:
        page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes
