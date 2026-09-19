from src.services import custom_tokenizer_service
from src.services.vocabulary_store import VocabularyStore


def test_split_separates_words_and_punctuation():
    assert custom_tokenizer_service.split("Hello, world!") == ["Hello", ",", "world", "!"]


def test_split_is_deterministic():
    text = "The quick-brown fox jumps."
    assert custom_tokenizer_service.split(text) == custom_tokenizer_service.split(text)


def test_new_tokens_get_deterministic_ids_and_frequency_one():
    store = VocabularyStore()
    tokens = custom_tokenizer_service.tokenize("the quick brown fox", store)

    assert [t.text for t in tokens] == ["the", "quick", "brown", "fox"]
    assert [t.id for t in tokens] == [0, 1, 2, 3]
    assert all(t.is_new for t in tokens)

    snapshot = store.snapshot()
    assert snapshot.total_tokens == 4
    assert all(entry.frequency == 1 for entry in snapshot.entries)


def test_reused_tokens_keep_id_and_increment_frequency_without_new_flag():
    store = VocabularyStore()
    custom_tokenizer_service.tokenize("the quick brown fox", store)
    tokens = custom_tokenizer_service.tokenize("the lazy dog", store)

    by_text = {t.text: t for t in tokens}
    assert by_text["the"].id == 0
    assert by_text["the"].is_new is False
    assert by_text["lazy"].is_new is True
    assert by_text["dog"].is_new is True

    snapshot = store.snapshot()
    the_entry = next(e for e in snapshot.entries if e.token == "the")
    assert the_entry.frequency == 2


def test_reset_clears_vocabulary_and_id_counter():
    store = VocabularyStore()
    custom_tokenizer_service.tokenize("the quick brown fox", store)
    store.reset()

    snapshot = store.snapshot()
    assert snapshot.entries == []
    assert snapshot.total_tokens == 0

    tokens = custom_tokenizer_service.tokenize("the", store)
    assert tokens[0].id == 0
    assert tokens[0].is_new is True


def test_double_tokenize_same_text_marks_nothing_new_second_time():
    store = VocabularyStore()
    custom_tokenizer_service.tokenize("the quick brown fox", store)
    second = custom_tokenizer_service.tokenize("the quick brown fox", store)

    assert all(t.is_new is False for t in second)
    snapshot = store.snapshot()
    assert all(entry.frequency == 2 for entry in snapshot.entries)
