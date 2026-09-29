from typing import Optional
from pydantic import BaseModel

from src.schemas.tokenize import TokenInfo, TokenizerMode


class EmbeddingRequest(BaseModel):
    tokens: list[TokenInfo]
    tokenizer_mode: TokenizerMode
    encoding: Optional[str] = None
    embedding_dim: int = 4


class TokenEmbeddingRow(BaseModel):
    token: str
    token_id: int
    vector: list[float]


class PositionalEmbeddingRow(BaseModel):
    position: int
    vector: list[float]


class FinalEmbeddingRow(BaseModel):
    token: str
    position: int
    vector: list[float]


class EmbeddingResponse(BaseModel):
    token_embeddings: list[TokenEmbeddingRow]
    positional_embeddings: list[PositionalEmbeddingRow]
    final_embeddings: list[FinalEmbeddingRow]
