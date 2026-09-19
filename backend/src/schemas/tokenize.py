from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class SourceType(str, Enum):
    TEXT = "text"
    TXT_FILE = "txt_file"
    PDF_FILE = "pdf_file"


class TokenizerMode(str, Enum):
    TIKTOKEN = "tiktoken"
    CUSTOM = "custom"
    BPE = "bpe"


class EncodingOption(BaseModel):
    name: str
    is_default: bool
    display_name: Optional[str] = None
    models: list[str] = []


class EncodingListResponse(BaseModel):
    encodings: list[EncodingOption]


class TokenizeRequest(BaseModel):
    text: str
    source_type: SourceType
    tokenizer_mode: TokenizerMode
    encoding: Optional[str] = None

    @field_validator("text")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        # Structural validation only; the EMPTY_INPUT domain error (with its
        # user-facing message) is raised by the route handler so every empty
        # input reaches the caller as a normal ErrorResponse, not a 422.
        return value


class TokenInfo(BaseModel):
    index: int
    id: int
    text: str
    is_new: bool
    bytes_repr: Optional[str] = None


class TokenizeResponse(BaseModel):
    original_text: str
    source_type: SourceType
    tokenizer_mode: TokenizerMode
    encoding: Optional[str] = None
    tokens: list[TokenInfo]
    token_count: int
    character_count: int
    word_count: int
    tokens_per_word: float
    tokens_per_character: float
