def _tokenize_custom(client, text):
    return client.post(
        "/api/tokenize",
        json={
            "text": text,
            "source_type": "text",
            "tokenizer_mode": "custom",
            "encoding": None,
        },
    )


def test_tokenize_custom_success_shape(client):
    response = _tokenize_custom(client, "the quick brown fox")
    assert response.status_code == 200

    body = response.json()
    assert body["tokenizer_mode"] == "custom"
    assert body["encoding"] is None
    assert body["token_count"] == len(body["tokens"])
    assert all(token["is_new"] for token in body["tokens"])


def test_tokenize_custom_reuses_ids_across_calls(client):
    first = _tokenize_custom(client, "the quick brown fox").json()
    second = _tokenize_custom(client, "the lazy dog").json()

    first_ids = {t["text"]: t["id"] for t in first["tokens"]}
    second_ids = {t["text"]: t["id"] for t in second["tokens"]}
    assert second_ids["the"] == first_ids["the"]

    new_flags = {t["text"]: t["is_new"] for t in second["tokens"]}
    assert new_flags["the"] is False
    assert new_flags["lazy"] is True
