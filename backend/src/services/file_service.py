import os

import pymupdf

from src.core.config import MAX_FILE_SIZE_BYTES
from src.schemas.errors import ErrorCode, TokenizerError


def validate_upload(filename: str, size_bytes: int) -> str:
    """Validate a candidate upload and return its resolved source_type.

    Raises TokenizerError for unsupported extensions or oversized files
    (FR-024, FR-025), before any parsing is attempted.
    """
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise TokenizerError(
            ErrorCode.FILE_TOO_LARGE,
            "The uploaded file is too large. Please upload a file under 10 MB.",
            status_code=413,
        )

    extension = os.path.splitext(filename)[1].lower()
    if extension == ".txt":
        return "txt_file"
    if extension == ".pdf":
        return "pdf_file"

    raise TokenizerError(
        ErrorCode.UNSUPPORTED_FILE_TYPE,
        "Unsupported file type. Please upload a .txt or .pdf file.",
        status_code=415,
    )


def extract_txt(raw_bytes: bytes) -> str:
    try:
        return raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise TokenizerError(
            ErrorCode.INVALID_TEXT_ENCODING,
            "This file doesn't look like a valid text (UTF-8) file.",
            status_code=422,
        ) from exc


def extract_pdf(raw_bytes: bytes) -> str:
    try:
        document = pymupdf.open(stream=raw_bytes, filetype="pdf")
    except Exception as exc:  # pymupdf raises its own error types on malformed input
        raise TokenizerError(
            ErrorCode.INVALID_PDF,
            "This PDF could not be read. It may be corrupted or invalid.",
            status_code=422,
        ) from exc

    try:
        text = "\n".join(page.get_text() for page in document)
    finally:
        document.close()

    if not text.strip():
        raise TokenizerError(
            ErrorCode.NO_EXTRACTABLE_TEXT,
            "No text could be found in this PDF. Scanned/image-only PDFs are not supported.",
            status_code=422,
        )

    return text
