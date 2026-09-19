import pytest

from src.schemas.errors import ErrorCode, TokenizerError
from src.services.bpe_service import BPEModelStore


def test_bpe_train_empty_text_rejected():
    store = BPEModelStore()
    with pytest.raises(TokenizerError) as exc:
        store.train("   ", 10)
    assert exc.value.error_code == ErrorCode.EMPTY_INPUT


def test_bpe_train_target_size_too_small():
    store = BPEModelStore()
    with pytest.raises(TokenizerError) as exc:
        store.train("abcde", 3)
    assert exc.value.error_code == ErrorCode.INVALID_TARGET_VOCAB_SIZE


def test_bpe_training_and_deterministic_ids():
    store1 = BPEModelStore()
    res1 = store1.train("low low low lower newest widest", 16)

    store2 = BPEModelStore()
    res2 = store2.train("low low low lower newest widest", 16)

    assert res1.is_trained is True
    assert res1.initial_vocab_size == len(set("low low low lower newest widest"))
    assert res1.final_vocab_size == 16
    assert len(res1.merge_rules) > 0

    # Ensure 100% deterministic output across instances
    assert [r.merged_token for r in res1.merge_rules] == [r.merged_token for r in res2.merge_rules]
    assert [v.token for v in res1.vocabulary] == [v.token for v in res2.vocabulary]
    assert [v.id for v in res1.vocabulary] == [v.id for v in res2.vocabulary]


def test_bpe_tokenize_before_training_rejected():
    store = BPEModelStore()
    with pytest.raises(TokenizerError) as exc:
        store.tokenize("test")
    assert exc.value.error_code == ErrorCode.BPE_NOT_TRAINED


def test_bpe_tokenization_pure_and_deterministic():
    store = BPEModelStore()
    store.train("low low low lower newest widest", 16)

    tokens1 = store.tokenize("lowest width")
    tokens2 = store.tokenize("lowest width")

    assert len(tokens1) > 0
    assert [t.id for t in tokens1] == [t.id for t in tokens2]
    assert [t.text for t in tokens1] == [t.text for t in tokens2]
    assert "".join(t.text for t in tokens1) == "lowest width"


def test_bpe_reset():
    store = BPEModelStore()
    store.train("hello world", 15)
    assert store.get_model().is_trained is True

    reset_res = store.reset()
    assert reset_res.is_trained is False
    assert reset_res.vocabulary == []
    assert reset_res.merge_rules == []
