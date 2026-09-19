"""SC-001: A user can go from submitting text to seeing full token-level
results and statistics in under 5 seconds for documents up to 10,000 words.

(Added during /speckit-analyze remediation: E3.)
"""
import time


def _make_words(count: int) -> str:
    vocabulary = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"]
    return " ".join(vocabulary[i % len(vocabulary)] for i in range(count))


def test_tiktoken_tokenize_10k_words_under_5_seconds(client):
    text = _make_words(10_000)

    start = time.monotonic()
    response = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    )
    elapsed = time.monotonic() - start

    assert response.status_code == 200
    assert response.json()["word_count"] == 10_000
    assert elapsed < 5.0


def test_custom_tokenizer_tokenize_10k_words_under_5_seconds(client):
    text = _make_words(10_000)

    start = time.monotonic()
    response = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "custom", "encoding": None},
    )
    elapsed = time.monotonic() - start

    assert response.status_code == 200
    assert response.json()["word_count"] == 10_000
    assert elapsed < 5.0
