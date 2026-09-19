import tiktoken

from src.core.config import DEFAULT_ENCODING
from src.schemas.errors import ErrorCode, TokenizerError
from src.schemas.tokenize import EncodingOption, TokenInfo

ENCODING_METADATA: dict[str, dict] = {
    "o200k_base": {
        "display_name": "GPT-4o, GPT-4o mini, o1, o3-mini (o200k_base)",
        "models": ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o1-preview", "o3-mini"],
    },
    "cl100k_base": {
        "display_name": "GPT-4, GPT-4 Turbo, GPT-3.5 Turbo (cl100k_base)",
        "models": [
            "gpt-4",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "text-embedding-3-small",
            "text-embedding-3-large",
            "text-embedding-ada-002",
        ],
    },
    "p50k_base": {
        "display_name": "text-davinci-003, Codex (p50k_base)",
        "models": ["text-davinci-003", "text-davinci-002", "code-davinci-002"],
    },
    "p50k_edit": {
        "display_name": "text-davinci-edit-001, Code Edit (p50k_edit)",
        "models": ["text-davinci-edit-001", "code-davinci-edit-001"],
    },
    "r50k_base": {
        "display_name": "GPT-3 legacy, text-davinci-001 (r50k_base)",
        "models": ["davinci", "curie", "babbage", "ada", "text-davinci-001"],
    },
    "gpt2": {
        "display_name": "GPT-2 (gpt2)",
        "models": ["gpt2"],
    },
    "o200k_harmony": {
        "display_name": "o200k_harmony (o200k_harmony)",
        "models": [],
    },
}


def resolve_encoding_name(encoding_or_model: str) -> str:
    """Resolve an encoding name or an OpenAI model identifier to a valid Tiktoken encoding name."""
    if encoding_or_model in tiktoken.list_encoding_names():
        return encoding_or_model
    try:
        enc = tiktoken.encoding_for_model(encoding_or_model)
        return enc.name
    except KeyError:
        raise TokenizerError(
            ErrorCode.UNSUPPORTED_ENCODING,
            f"The encoding '{encoding_or_model}' is not supported.",
            status_code=400,
        )


def list_encodings() -> list[EncodingOption]:
    """Every encoding the installed Tiktoken library supports (FR-006) with metadata."""
    names = tiktoken.list_encoding_names()
    # Ensure default encoding is first
    ordered_names = [DEFAULT_ENCODING] + [n for n in names if n != DEFAULT_ENCODING]
    options: list[EncodingOption] = []
    for name in ordered_names:
        meta = ENCODING_METADATA.get(name, {})
        options.append(
            EncodingOption(
                name=name,
                is_default=(name == DEFAULT_ENCODING),
                display_name=meta.get("display_name", name),
                models=meta.get("models", []),
            )
        )
    return options


def tokenize(text: str, encoding_name: str) -> list[TokenInfo]:
    """Tokenize `text` with the real Tiktoken encoding named `encoding_name`.

    Pure function of its inputs: it never mutates the shared Tiktoken encoding
    object (constitution Principle III / FR-010) and, for the same
    (text, encoding_name) pair, always returns the same result.
    """
    resolved_name = resolve_encoding_name(encoding_name)
    encoding = tiktoken.get_encoding(resolved_name)
    # Use disallowed_special=() to allow arbitrary text input without crashing on special token sequences
    token_ids = encoding.encode(text, disallowed_special=())

    tokens: list[TokenInfo] = []
    for index, token_id in enumerate(token_ids):
        try:
            raw_bytes = encoding.decode_single_token_bytes(token_id)
            bytes_repr = raw_bytes.hex()
        except Exception:
            bytes_repr = None

        token_text = encoding.decode([token_id], errors="replace")
        tokens.append(
            TokenInfo(
                index=index,
                id=token_id,
                text=token_text,
                is_new=False,
                bytes_repr=bytes_repr,
            )
        )
    return tokens
