from typing import Optional
import tiktoken
import torch
import torch.nn as nn

from src.schemas.embeddings import (
    EmbeddingResponse,
    FinalEmbeddingRow,
    PositionalEmbeddingRow,
    TokenEmbeddingRow,
)
from src.schemas.tokenize import TokenInfo, TokenizerMode
from src.services.bpe_service import bpe_store
from src.services.tiktoken_service import resolve_encoding_name
from src.services.vocabulary_store import vocabulary_store


def get_vocab_size(tokenizer_mode: TokenizerMode, encoding: Optional[str], token_ids: list[int]) -> int:
    """Determine vocab_size for nn.Embedding layer based on tokenizer mode."""
    max_id = max(token_ids) if token_ids else 0

    if tokenizer_mode == TokenizerMode.TIKTOKEN:
        if encoding:
            resolved_name = resolve_encoding_name(encoding)
            enc = tiktoken.get_encoding(resolved_name)
            return max(enc.n_vocab, max_id + 1)
        return max(100277, max_id + 1)

    if tokenizer_mode == TokenizerMode.BPE:
        bpe_model = bpe_store.get_model()
        return max(bpe_model.final_vocab_size, max_id + 1, 1)

    # Custom mode
    custom_snap = vocabulary_store.snapshot()
    return max(custom_snap.total_tokens, max_id + 1, 1)


def create_embeddings(
    tokens: list[TokenInfo],
    tokenizer_mode: TokenizerMode,
    encoding: Optional[str] = None,
    embedding_dim: int = 4,
) -> EmbeddingResponse:
    """Statelessly generate token embeddings, positional embeddings, and final summed embeddings.

    Whitespace tokens are filtered out before generating embeddings.
    Weights are randomly initialized via PyTorch nn.Embedding layers per request.
    """
    # Filter out whitespace tokens
    valid_tokens = [t for t in tokens if t.text and t.text.strip() != ""]

    if not valid_tokens:
        return EmbeddingResponse(
            token_embeddings=[],
            positional_embeddings=[],
            final_embeddings=[],
        )

    token_ids = [t.id for t in valid_tokens]
    seq_len = len(valid_tokens)
    vocab_size = get_vocab_size(tokenizer_mode, encoding, token_ids)

    # Stateless untrained PyTorch embedding layers
    token_embed_layer = nn.Embedding(num_embeddings=vocab_size, embedding_dim=embedding_dim)
    pos_embed_layer = nn.Embedding(num_embeddings=max(seq_len, 1), embedding_dim=embedding_dim)

    with torch.no_grad():
        token_tensor = torch.tensor(token_ids, dtype=torch.long)
        pos_tensor = torch.arange(seq_len, dtype=torch.long)

        token_vecs = token_embed_layer(token_tensor)
        pos_vecs = pos_embed_layer(pos_tensor)
        final_vecs = token_vecs + pos_vecs

    token_rows: list[TokenEmbeddingRow] = []
    pos_rows: list[PositionalEmbeddingRow] = []
    final_rows: list[FinalEmbeddingRow] = []

    for pos, (tok, t_v, p_v) in enumerate(zip(valid_tokens, token_vecs, pos_vecs)):
        t_list = [round(float(x), 4) for x in t_v.tolist()]
        p_list = [round(float(x), 4) for x in p_v.tolist()]
        f_list = [round(tv + pv, 4) for tv, pv in zip(t_list, p_list)]

        token_rows.append(
            TokenEmbeddingRow(
                token=tok.text,
                token_id=tok.id,
                vector=t_list,
            )
        )
        pos_rows.append(
            PositionalEmbeddingRow(
                position=pos,
                vector=p_list,
            )
        )
        final_rows.append(
            FinalEmbeddingRow(
                token=tok.text,
                position=pos,
                vector=f_list,
            )
        )

    return EmbeddingResponse(
        token_embeddings=token_rows,
        positional_embeddings=pos_rows,
        final_embeddings=final_rows,
    )
