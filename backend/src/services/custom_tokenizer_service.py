import re

from src.schemas.tokenize import TokenInfo
from src.services.vocabulary_store import VocabularyStore

# Fixed, deterministic splitting strategy (research.md §3): one token per run
# of word characters, one token per other non-whitespace character; runs of
# whitespace are separators.
_TOKEN_PATTERN = re.compile(r"\w+|[^\w\s]")


def split(text: str) -> list[str]:
    return _TOKEN_PATTERN.findall(text)


def tokenize(text: str, store: VocabularyStore) -> list[TokenInfo]:
    raw_tokens = split(text)
    entries = store.apply_tokens(raw_tokens)
    return [
        TokenInfo(index=index, id=entry.id, text=entry.token, is_new=entry.is_new)
        for index, entry in enumerate(entries)
    ]
