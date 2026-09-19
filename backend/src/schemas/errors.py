from enum import Enum

from pydantic import BaseModel


class ErrorCode(str, Enum):
    EMPTY_INPUT = "EMPTY_INPUT"
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_PDF = "INVALID_PDF"
    NO_EXTRACTABLE_TEXT = "NO_EXTRACTABLE_TEXT"
    INVALID_TEXT_ENCODING = "INVALID_TEXT_ENCODING"
    UNSUPPORTED_ENCODING = "UNSUPPORTED_ENCODING"
    BPE_NOT_TRAINED = "BPE_NOT_TRAINED"
    INVALID_TARGET_VOCAB_SIZE = "INVALID_TARGET_VOCAB_SIZE"


class ErrorResponse(BaseModel):
    error_code: ErrorCode
    message: str


class TokenizerError(Exception):
    """Domain error mapped to an ErrorResponse + HTTP status by the API layer."""

    def __init__(self, error_code: ErrorCode, message: str, status_code: int):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
