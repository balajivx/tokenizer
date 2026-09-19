from pydantic import BaseModel


class VocabularyEntry(BaseModel):
    id: int
    token: str
    frequency: int
    is_new: bool


class VocabularyResponse(BaseModel):
    entries: list[VocabularyEntry]
    total_tokens: int
