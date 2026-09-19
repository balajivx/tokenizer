def test_get_bpe_model_untrained_shape(client):
    # Ensure reset first
    client.post("/api/bpe/reset")
    response = client.get("/api/bpe/model")
    assert response.status_code == 200
    body = response.json()
    assert body["is_trained"] is False
    assert body["vocabulary"] == []
    assert body["merge_rules"] == []


def test_post_bpe_train_success_shape(client):
    payload = {
        "training_text": "low low low lower newest widest",
        "target_vocab_size": 16,
    }
    response = client.post("/api/bpe/train", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["is_trained"] is True
    assert body["final_vocab_size"] == 16
    assert len(body["vocabulary"]) == 16
    assert len(body["merge_rules"]) > 0
    assert len(body["training_steps"]) > 0

    rule = body["merge_rules"][0]
    assert set(rule.keys()) == {"rank", "pair", "merged_token", "token_id"}


def test_post_tokenize_bpe_success_shape(client):
    # Train first
    client.post(
        "/api/bpe/train",
        json={"training_text": "low low low lower newest widest", "target_vocab_size": 16},
    )

    response = client.post(
        "/api/tokenize",
        json={
            "text": "lowest width",
            "source_type": "text",
            "tokenizer_mode": "bpe",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["tokenizer_mode"] == "bpe"
    assert body["encoding"] is None
    assert len(body["tokens"]) > 0
    for token in body["tokens"]:
        assert {"index", "id", "text", "is_new"}.issubset(set(token.keys()))


def test_tokenize_bpe_untrained_rejected(client):
    client.post("/api/bpe/reset")
    response = client.post(
        "/api/tokenize",
        json={
            "text": "lowest width",
            "source_type": "text",
            "tokenizer_mode": "bpe",
        },
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "BPE_NOT_TRAINED"
