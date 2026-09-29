from src.schemas.tokenize import TokenInfo, TokenizerMode
from src.services import embedding_service
from src.services.bpe_service import bpe_store


def test_create_embeddings_filters_out_whitespaces():
    tokens = [
        TokenInfo(index=0, id=15496, text="Hello", is_new=False),
        TokenInfo(index=1, id=220, text=" ", is_new=False),
        TokenInfo(index=2, id=11, text=",", is_new=False),
        TokenInfo(index=3, id=220, text="   ", is_new=False),
        TokenInfo(index=4, id=995, text="world", is_new=False),
        TokenInfo(index=5, id=198, text="\n\t", is_new=False),
        TokenInfo(index=6, id=0, text="!", is_new=False),
    ]

    result = embedding_service.create_embeddings(
        tokens=tokens,
        tokenizer_mode=TokenizerMode.TIKTOKEN,
        encoding="cl100k_base",
        embedding_dim=4,
    )

    # 4 non-whitespace tokens: "Hello", ",", "world", "!"
    assert len(result.token_embeddings) == 4
    assert len(result.positional_embeddings) == 4
    assert len(result.final_embeddings) == 4

    tokens_extracted = [row.token for row in result.token_embeddings]
    assert tokens_extracted == ["Hello", ",", "world", "!"]

    # Positions should be 0, 1, 2, 3
    positions = [row.position for row in result.positional_embeddings]
    assert positions == [0, 1, 2, 3]


def test_create_embeddings_vectors_shape_and_sum():
    tokens = [
        TokenInfo(index=0, id=10, text="cat", is_new=False),
        TokenInfo(index=1, id=20, text="dog", is_new=False),
    ]

    result = embedding_service.create_embeddings(
        tokens=tokens,
        tokenizer_mode=TokenizerMode.TIKTOKEN,
        encoding="cl100k_base",
        embedding_dim=4,
    )

    for i in range(2):
        t_vec = result.token_embeddings[i].vector
        p_vec = result.positional_embeddings[i].vector
        f_vec = result.final_embeddings[i].vector

        assert len(t_vec) == 4
        assert len(p_vec) == 4
        assert len(f_vec) == 4

        # Final vector = sum of token embedding + positional embedding
        for tv, pv, fv in zip(t_vec, p_vec, f_vec):
            assert abs((tv + pv) - fv) < 1e-4


def test_create_embeddings_bpe_mode():
    bpe_store.reset()
    bpe_store.train("hello world", target_vocab_size=15)
    bpe_tokens = bpe_store.tokenize("hello world")

    result = embedding_service.create_embeddings(
        tokens=bpe_tokens,
        tokenizer_mode=TokenizerMode.BPE,
        embedding_dim=4,
    )

    assert len(result.token_embeddings) > 0
    assert len(result.token_embeddings) == len(result.positional_embeddings)
    assert len(result.positional_embeddings) == len(result.final_embeddings)
    for row in result.token_embeddings:
        assert row.token.strip() != ""


def test_create_embeddings_all_whitespace():
    tokens = [
        TokenInfo(index=0, id=220, text="   ", is_new=False),
        TokenInfo(index=1, id=198, text="\n", is_new=False),
    ]

    result = embedding_service.create_embeddings(
        tokens=tokens,
        tokenizer_mode=TokenizerMode.TIKTOKEN,
        encoding="cl100k_base",
        embedding_dim=4,
    )

    assert result.token_embeddings == []
    assert result.positional_embeddings == []
    assert result.final_embeddings == []
