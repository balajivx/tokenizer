def test_get_vocabulary_starts_empty(client):
    response = client.get("/api/vocabulary")
    assert response.status_code == 200
    assert response.json() == {"entries": [], "total_tokens": 0}


def test_vocabulary_reflects_tokenization_and_reset(client):
    client.post(
        "/api/tokenize",
        json={
            "text": "hello world",
            "source_type": "text",
            "tokenizer_mode": "custom",
            "encoding": None,
        },
    )

    body = client.get("/api/vocabulary").json()
    assert body["total_tokens"] == 2
    assert {e["token"] for e in body["entries"]} == {"hello", "world"}

    reset_body = client.post("/api/vocabulary/reset").json()
    assert reset_body == {"entries": [], "total_tokens": 0}
    assert client.get("/api/vocabulary").json() == {"entries": [], "total_tokens": 0}
