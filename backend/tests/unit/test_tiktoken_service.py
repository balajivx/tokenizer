import tiktoken
import pytest

from src.schemas.errors import TokenizerError
from src.services import tiktoken_service


def test_list_encodings_marks_default():
    options = tiktoken_service.list_encodings()
    names = {o.name for o in options}
    assert names == set(tiktoken.list_encoding_names())
    defaults = [o for o in options if o.is_default]
    assert len(defaults) == 1
    assert defaults[0].name == "o200k_base"


def test_tokenize_returns_real_ids_and_text():
    tokens = tiktoken_service.tokenize("Hello world", "cl100k_base")
    encoding = tiktoken.get_encoding("cl100k_base")
    expected_ids = encoding.encode("Hello world")

    assert [t.id for t in tokens] == expected_ids
    assert [t.index for t in tokens] == list(range(len(expected_ids)))
    assert all(t.is_new is False for t in tokens)
    assert "".join(t.text for t in tokens) == "Hello world"


def test_tokenize_matches_openai_tokenizer_benchmarks():
    # Test OpenAI tokenizer default (o200k_base / GPT-4o)
    tokens_o200k = tiktoken_service.tokenize("Hello world!", "o200k_base")
    assert [t.id for t in tokens_o200k] == [13225, 2375, 0]

    # Test OpenAI tokenizer GPT-4 (cl100k_base)
    tokens_cl100k = tiktoken_service.tokenize("Hello world!", "cl100k_base")
    assert [t.id for t in tokens_cl100k] == [9906, 1917, 0]

    # Test OpenAI official tokenizer sample text
    sample = "Tiktoken is a fast BPE tokeniser for use with OpenAI's models."
    sample_tokens = tiktoken_service.tokenize(sample, "o200k_base")
    assert [t.id for t in sample_tokens] == [
        51, 8251, 2488, 382, 261, 5661, 418, 3111, 6602, 7466, 395, 1199, 483, 7788, 17527, 885, 7015, 13
    ]


def test_tokenize_supports_model_name_aliases():
    tokens_gpt4o = tiktoken_service.tokenize("Hello world!", "gpt-4o")
    assert [t.id for t in tokens_gpt4o] == [13225, 2375, 0]

    tokens_gpt4 = tiktoken_service.tokenize("Hello world!", "gpt-4")
    assert [t.id for t in tokens_gpt4] == [9906, 1917, 0]


def test_tokenize_handles_special_tokens_safely():
    # Should not throw ValueError on special token sequences
    tokens = tiktoken_service.tokenize("Text with <|endoftext|> in it", "o200k_base")
    assert len(tokens) > 0


def test_unsupported_encoding_raises_domain_error():
    with pytest.raises(TokenizerError) as exc_info:
        tiktoken_service.tokenize("hi", "not-a-real-encoding")
    assert exc_info.value.error_code.value == "UNSUPPORTED_ENCODING"


def test_tokenize_never_mutates_tiktoken_vocabulary():
    """FR-010 / constitution Principle III: Tiktoken's vocabulary must never
    be modified. Since it's read-only, the strongest observable guarantee is
    that repeated tokenization is perfectly deterministic and the encoding's
    vocabulary size never changes across calls."""
    encoding = tiktoken.get_encoding("o200k_base")
    vocab_size_before = encoding.n_vocab

    first_pass = [t.id for t in tiktoken_service.tokenize("The quick brown fox", "o200k_base")]
    for _ in range(3):
        tiktoken_service.tokenize("some unrelated text to try to perturb state", "o200k_base")
    second_pass = [t.id for t in tiktoken_service.tokenize("The quick brown fox", "o200k_base")]

    assert first_pass == second_pass
    assert tiktoken.get_encoding("o200k_base").n_vocab == vocab_size_before
