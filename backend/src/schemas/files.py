from pydantic import BaseModel

from src.schemas.tokenize import SourceType


class ExtractedTextResponse(BaseModel):
    source_type: SourceType
    filename: str
    text: str
    character_count: int
