from src.services import stats_service


def test_basic_counts():
    stats = stats_service.compute("hello world", token_count=4)
    assert stats["character_count"] == 11
    assert stats["word_count"] == 2
    assert stats["tokens_per_word"] == 2.0
    assert stats["tokens_per_character"] == 4 / 11


def test_zero_division_guards():
    stats = stats_service.compute("", token_count=0)
    assert stats["character_count"] == 0
    assert stats["word_count"] == 0
    assert stats["tokens_per_word"] == 0
    assert stats["tokens_per_character"] == 0
