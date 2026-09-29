def test_post_embeddings_tiktoken_success(client):
    payload = {
        "tokens": [
            {"index": 0, "id": 15496, "text": "Hello", "is_new": False},
            {"index": 1, "id": 220, "text": " ", "is_new": False},
            {"index": 2, "id": 995, "text": "world", "is_new": False},
        ],
        "tokenizer_mode": "tiktoken",
        "encoding": "cl100k_base",
        "embedding_dim": 4,
    }

    response = client.post("/api/embeddings", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "token_embeddings" in data
    assert "positional_embeddings" in data
    assert "final_embeddings" in data

    # 2 non-whitespace tokens: "Hello", "world"
    assert len(data["token_embeddings"]) == 2
    assert len(data["positional_embeddings"]) == 2
    assert len(data["final_embeddings"]) == 2

    # Check structure
    assert data["token_embeddings"][0]["token"] == "Hello"
    assert data["token_embeddings"][0]["token_id"] == 15496
    assert len(data["token_embeddings"][0]["vector"]) == 4

    assert data["positional_embeddings"][0]["position"] == 0
    assert len(data["positional_embeddings"][0]["vector"]) == 4

    assert data["final_embeddings"][0]["token"] == "Hello"
    assert data["final_embeddings"][0]["position"] == 0
    assert len(data["final_embeddings"][0]["vector"]) == 4


def test_post_embeddings_bpe_success(client):
    # Train BPE first
    client.post("/api/bpe/train", json={"training_text": "hello bpe", "target_vocab_size": 12})
    tok_res = client.post("/api/tokenize", json={
        "text": "hello bpe",
        "source_type": "text",
        "tokenizer_mode": "bpe",
    })
    assert tok_res.status_code == 200
    tokens = tok_res.json()["tokens"]

    payload = {
        "tokens": tokens,
        "tokenizer_mode": "bpe",
        "embedding_dim": 4,
    }

    response = client.post("/api/embeddings", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert len(data["token_embeddings"]) > 0
    assert len(data["token_embeddings"]) == len(data["positional_embeddings"])
    assert len(data["positional_embeddings"]) == len(data["final_embeddings"])


def test_post_embeddings_empty_tokens(client):
    payload = {
        "tokens": [],
        "tokenizer_mode": "tiktoken",
        "encoding": "cl100k_base",
    }
    response = client.post("/api/embeddings", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["token_embeddings"] == []
    assert data["positional_embeddings"] == []
    assert data["final_embeddings"] == []
