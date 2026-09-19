def _tokenize(client, **overrides):
    payload = {
        "text": "Hello, tokenizer!",
        "source_type": "text",
        "tokenizer_mode": "tiktoken",
        "encoding": "cl100k_base",
    }
    payload.update(overrides)
    return client.post("/api/tokenize", json=payload)


def test_tokenize_tiktoken_success_shape(client):
    response = _tokenize(client)
    assert response.status_code == 200

    body = response.json()
    assert set(body.keys()) == {
        "original_text",
        "source_type",
        "tokenizer_mode",
        "encoding",
        "tokens",
        "token_count",
        "character_count",
        "word_count",
        "tokens_per_word",
        "tokens_per_character",
    }
    assert body["tokenizer_mode"] == "tiktoken"
    assert body["encoding"] == "cl100k_base"
    assert body["token_count"] == len(body["tokens"])
    for token in body["tokens"]:
        assert {"index", "id", "text", "is_new"}.issubset(set(token.keys()))
        assert token["is_new"] is False


def test_tokenize_empty_input_rejected(client):
    response = _tokenize(client, text="   ")
    assert response.status_code == 400
    assert response.json()["error_code"] == "EMPTY_INPUT"


def test_tokenize_missing_encoding_rejected(client):
    response = _tokenize(client, encoding=None)
    assert response.status_code == 400
    assert response.json()["error_code"] == "UNSUPPORTED_ENCODING"


def test_tokenize_unsupported_encoding_rejected(client):
    response = _tokenize(client, encoding="not-a-real-encoding")
    assert response.status_code == 400
    assert response.json()["error_code"] == "UNSUPPORTED_ENCODING"
