def test_bpe_full_lifecycle(client):
    # 1. Reset BPE state
    reset_res = client.post("/api/bpe/reset")
    assert reset_res.status_code == 200

    # 2. Attempt tokenization before training -> 400 BPE_NOT_TRAINED
    err_res = client.post(
        "/api/tokenize",
        json={"text": "hello", "source_type": "text", "tokenizer_mode": "bpe"},
    )
    assert err_res.status_code == 400
    assert err_res.json()["error_code"] == "BPE_NOT_TRAINED"

    # 3. Train BPE on corpus
    train_res = client.post(
        "/api/bpe/train",
        json={"training_text": "apple banana apricot avocado", "target_vocab_size": 20},
    )
    assert train_res.status_code == 200
    train_body = train_res.json()
    assert train_body["is_trained"] is True
    assert train_body["final_vocab_size"] == 20

    # 4. Query current model
    model_res = client.get("/api/bpe/model")
    assert model_res.status_code == 200
    assert model_res.json()["is_trained"] is True
    assert len(model_res.json()["vocabulary"]) == 20

    # 5. Tokenize text using trained BPE model
    tok_res = client.post(
        "/api/tokenize",
        json={"text": "apple avocado", "source_type": "text", "tokenizer_mode": "bpe"},
    )
    assert tok_res.status_code == 200
    tok_body = tok_res.json()
    assert tok_body["tokenizer_mode"] == "bpe"
    assert tok_body["token_count"] > 0
    assert "".join(t["text"] for t in tok_body["tokens"]) == "apple avocado"

    # 6. Verify BPE model was not mutated during tokenization
    model_res2 = client.get("/api/bpe/model")
    assert len(model_res2.json()["vocabulary"]) == 20
    assert len(model_res2.json()["merge_rules"]) == len(train_body["merge_rules"])
