"""FR-007: Tiktoken and Custom Tokenizer MUST remain fully independent —
using one MUST NOT alter the state or output of the other.

(Added during /speckit-analyze remediation: E4.)
"""


def test_tiktoken_output_is_unaffected_by_interleaved_custom_calls(client):
    text = "The quick brown fox jumps over the lazy dog"

    baseline = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    ).json()

    # Drive the Custom Tokenizer hard in between.
    client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "custom", "encoding": None},
    )
    client.post(
        "/api/tokenize",
        json={"text": "completely different custom content", "source_type": "text", "tokenizer_mode": "custom", "encoding": None},
    )

    repeat = client.post(
        "/api/tokenize",
        json={"text": text, "source_type": "text", "tokenizer_mode": "tiktoken", "encoding": "cl100k_base"},
    ).json()

    assert repeat["tokens"] == baseline["tokens"]


def test_custom_vocabulary_only_reflects_custom_mode_calls(client):
    client.post(
        "/api/tokenize",
        json={
            "text": "hello world",
            "source_type": "text",
            "tokenizer_mode": "tiktoken",
            "encoding": "cl100k_base",
        },
    )
    vocab = client.get("/api/vocabulary").json()
    assert vocab == {"entries": [], "total_tokens": 0}
