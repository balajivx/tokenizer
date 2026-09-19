def compute(text: str, token_count: int) -> dict:
    """Character/word/token statistics shared by both tokenizer modes (spec FR-022)."""
    character_count = len(text)
    word_count = len(text.split())

    tokens_per_word = token_count / word_count if word_count else 0.0
    tokens_per_character = token_count / character_count if character_count else 0.0

    return {
        "character_count": character_count,
        "word_count": word_count,
        "tokens_per_word": tokens_per_word,
        "tokens_per_character": tokens_per_character,
    }
