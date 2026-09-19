import threading

from src.schemas.bpe import (
    BPEMergeRule,
    BPETrainingResult,
    BPETrainingStep,
    BPEVocabularyEntry,
)
from src.schemas.errors import ErrorCode, TokenizerError
from src.schemas.tokenize import TokenInfo


class BPEModelStore:
    """In-memory singleton store for the Byte Pair Encoding (BPE) model.

    Thread-safe via threading.Lock; holds the trained vocabulary, ordered merge
    rules, and training steps history.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._is_trained: bool = False
        self._initial_vocab_size: int = 0
        self._final_vocab_size: int = 0
        self._vocabulary: dict[str, int] = {}
        self._is_base_char: dict[str, bool] = {}
        self._merge_rules: list[BPEMergeRule] = []
        self._training_steps: list[BPETrainingStep] = []

    def train(self, training_text: str, target_vocab_size: int) -> BPETrainingResult:
        """Train a BPE model from user-provided text up to target_vocab_size.

        Deterministic: identical training_text and target_vocab_size will always
        produce the exact same vocabulary, IDs, and ordered merge rules.
        """
        if not training_text or not training_text.strip():
            raise TokenizerError(
                ErrorCode.EMPTY_INPUT,
                "Please enter training text before starting BPE training.",
                status_code=400,
            )

        if target_vocab_size < 1:
            raise TokenizerError(
                ErrorCode.INVALID_TARGET_VOCAB_SIZE,
                "Target vocabulary size must be a positive integer greater than or equal to 1.",
                status_code=400,
            )

        with self._lock:
            # Step 1: Base vocabulary = all unique individual characters in training text
            unique_chars = sorted(list(set(training_text)))
            initial_size = len(unique_chars)

            if target_vocab_size < initial_size:
                raise TokenizerError(
                    ErrorCode.INVALID_TARGET_VOCAB_SIZE,
                    f"Target vocabulary size ({target_vocab_size}) must be at least the number of unique base characters ({initial_size}) in the training text.",
                    status_code=400,
                )

            # Assign sequential deterministic integer IDs to base characters (0 to N-1)
            vocab: dict[str, int] = {char: idx for idx, char in enumerate(unique_chars)}
            is_base_char: dict[str, bool] = {char: True for char in unique_chars}

            # Corpus represented as list of base character tokens
            corpus: list[str] = list(training_text)
            merge_rules: list[BPEMergeRule] = []
            training_steps: list[BPETrainingStep] = []

            step_num = 1
            while len(vocab) < target_vocab_size:
                # Count frequencies of all adjacent pairs
                pair_counts: dict[tuple[str, str], int] = {}
                for i in range(len(corpus) - 1):
                    pair = (corpus[i], corpus[i + 1])
                    pair_counts[pair] = pair_counts.get(pair, 0) + 1

                if not pair_counts:
                    break

                max_freq = max(pair_counts.values())
                if max_freq < 1:
                    break

                # Deterministic tie-breaking: pick lexicographically smallest pair
                candidates = [p for p, freq in pair_counts.items() if freq == max_freq]
                best_pair = min(candidates)

                merged_token = best_pair[0] + best_pair[1]
                new_token_id = len(vocab)
                vocab[merged_token] = new_token_id
                is_base_char[merged_token] = False

                rule = BPEMergeRule(
                    rank=step_num,
                    pair=list(best_pair),
                    merged_token=merged_token,
                    token_id=new_token_id,
                )
                merge_rules.append(rule)

                step = BPETrainingStep(
                    step=step_num,
                    pair=list(best_pair),
                    frequency=max_freq,
                    merged_token=merged_token,
                    token_id=new_token_id,
                )
                training_steps.append(step)

                # Merge all occurrences in the corpus
                new_corpus: list[str] = []
                i = 0
                while i < len(corpus):
                    if (
                        i < len(corpus) - 1
                        and corpus[i] == best_pair[0]
                        and corpus[i + 1] == best_pair[1]
                    ):
                        new_corpus.append(merged_token)
                        i += 2
                    else:
                        new_corpus.append(corpus[i])
                        i += 1
                corpus = new_corpus
                step_num += 1

            # Update store
            self._is_trained = True
            self._initial_vocab_size = initial_size
            self._final_vocab_size = len(vocab)
            self._vocabulary = vocab
            self._is_base_char = is_base_char
            self._merge_rules = merge_rules
            self._training_steps = training_steps

            return self._build_result()

    def tokenize(self, text: str) -> list[TokenInfo]:
        """Tokenize input text using the learned BPE merge rules and vocabulary.

        Pure function of its inputs and current model state: it never modifies
        the learned BPE model, merge rules, or vocabulary during tokenization.
        """
        with self._lock:
            if not self._is_trained:
                raise TokenizerError(
                    ErrorCode.BPE_NOT_TRAINED,
                    "No BPE model has been trained yet. Please train a BPE tokenizer first.",
                    status_code=400,
                )
            vocab = dict(self._vocabulary)
            merge_rules = list(self._merge_rules)

        tokens: list[str] = list(text)

        # Apply merge rules in order of training rank (1 to N)
        for rule in merge_rules:
            pair_a, pair_b = rule.pair[0], rule.pair[1]
            new_tokens: list[str] = []
            i = 0
            while i < len(tokens):
                if (
                    i < len(tokens) - 1
                    and tokens[i] == pair_a
                    and tokens[i + 1] == pair_b
                ):
                    new_tokens.append(rule.merged_token)
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            tokens = new_tokens

        # Map to TokenInfo with deterministic IDs
        result: list[TokenInfo] = []
        for index, tok in enumerate(tokens):
            tok_id = vocab.get(tok)
            if tok_id is None:
                # Deterministic fallback for characters unseen during training
                tok_id = abs(hash(tok)) % 1_000_000 + 100_000

            result.append(
                TokenInfo(
                    index=index,
                    id=tok_id,
                    text=tok,
                    is_new=False,
                    bytes_repr=tok.encode("utf-8").hex(),
                )
            )
        return result

    def get_model(self) -> BPETrainingResult:
        """Return the current BPE model state."""
        with self._lock:
            return self._build_result()

    def reset(self) -> BPETrainingResult:
        """Reset the BPE model to an untrained initial state."""
        with self._lock:
            self._is_trained = False
            self._initial_vocab_size = 0
            self._final_vocab_size = 0
            self._vocabulary = {}
            self._is_base_char = {}
            self._merge_rules = []
            self._training_steps = []
            return self._build_result()

    def _build_result(self) -> BPETrainingResult:
        vocab_entries = [
            BPEVocabularyEntry(
                id=token_id,
                token=token,
                is_base_char=self._is_base_char.get(token, False),
            )
            for token, token_id in self._vocabulary.items()
        ]
        # Sort vocabulary entries by ID
        vocab_entries.sort(key=lambda entry: entry.id)

        return BPETrainingResult(
            is_trained=self._is_trained,
            initial_vocab_size=self._initial_vocab_size,
            final_vocab_size=self._final_vocab_size,
            total_merges=len(self._merge_rules),
            vocabulary=vocab_entries,
            merge_rules=list(self._merge_rules),
            training_steps=list(self._training_steps),
        )


# Global singleton instance
bpe_store = BPEModelStore()
