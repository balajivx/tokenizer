"""User Story 2 acceptance scenarios: Custom Tokenizer vocabulary growth,
reuse, and reset."""


def _tokenize(client, text):
    return client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "custom", "encoding": None},
    ).json()


def test_new_tokens_created_and_marked(client):
    result = _tokenize(client, "the quick brown fox")
    assert all(t["is_new"] for t in result["tokens"])

    vocab = client.get("/api/vocabulary").json()
    assert vocab["total_tokens"] == 4
    assert all(e["frequency"] == 1 for e in vocab["entries"])
    assert all(e["is_new"] for e in vocab["entries"])


def test_reused_token_keeps_id_and_increments_frequency(client):
    _tokenize(client, "the quick brown fox")
    result = _tokenize(client, "the lazy dog")

    by_text = {t["text"]: t for t in result["tokens"]}
    assert by_text["the"]["is_new"] is False
    assert by_text["lazy"]["is_new"] is True

    vocab = client.get("/api/vocabulary").json()
    the_entry = next(e for e in vocab["entries"] if e["token"] == "the")
    assert the_entry["frequency"] == 2
    # Only this operation's new tokens are flagged now.
    lazy_entry = next(e for e in vocab["entries"] if e["token"] == "lazy")
    assert lazy_entry["is_new"] is True
    fox_entry = next(e for e in vocab["entries"] if e["token"] == "fox")
    assert fox_entry["is_new"] is False


def test_reset_returns_vocabulary_to_empty(client):
    _tokenize(client, "the quick brown fox")
    reset_body = client.post("/api/vocabulary/reset").json()
    assert reset_body == {"entries": [], "total_tokens": 0}

    result = _tokenize(client, "the")
    assert result["tokens"][0]["id"] == 0
    assert result["tokens"][0]["is_new"] is True


def test_switching_modes_does_not_cross_contaminate(client):
    """Custom-mode vocabulary state must be independent of Tiktoken mode."""
    _tokenize(client, "hello world")
    tiktoken_result = client.post(
        "/api/tokenize",
        json={
            "text": "hello world",
            "source_type": "text",
            "tokenizer_mode": "tiktoken",
            "encoding": "cl100k_base",
        },
    ).json()
    assert all(t["is_new"] is False for t in tiktoken_result["tokens"])

    vocab = client.get("/api/vocabulary").json()
    assert vocab["total_tokens"] == 2  # unaffected by the Tiktoken call
