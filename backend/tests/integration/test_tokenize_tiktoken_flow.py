"""User Story 1 acceptance scenarios: tokenize typed text with Tiktoken."""


def test_full_tokenize_and_stats_display(client):
    response = client.post(
        "/api/tokenize",
        json={
            "text": "Hello, tokenizer!",
            "source_type": "text",
            "tokenizer_mode": "tiktoken",
            "encoding": "cl100k_base",
        },
    )
    body = response.json()

    assert body["character_count"] == len("Hello, tokenizer!")
    assert body["word_count"] == 2
    assert body["token_count"] == len(body["tokens"])
    for i, token in enumerate(body["tokens"]):
        assert token["index"] == i
        assert isinstance(token["id"], int)
        assert isinstance(token["text"], str)


def test_changing_encoding_changes_results(client):
    text = "Supercalifragilisticexpialidocious"
    first = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    ).json()
    second = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "r50k_base"},
    ).json()

    assert first["encoding"] == "cl100k_base"
    assert second["encoding"] == "r50k_base"
    # Different (generation-apart) encodings should not silently collapse to
    # the same token IDs for a long, uncommon word.
    assert [t["id"] for t in first["tokens"]] != [t["id"] for t in second["tokens"]]
