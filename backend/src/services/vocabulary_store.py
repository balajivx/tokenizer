import threading

from src.schemas.vocabulary import VocabularyEntry, VocabularyResponse


class _Entry:
    __slots__ = ("id", "token", "frequency", "is_new")

    def __init__(self, id_: int, token: str):
        self.id = id_
        self.token = token
        self.frequency = 0
        self.is_new = False


class VocabularyStore:
    """Single, global, in-memory Custom Tokenizer vocabulary (FR-012).

    Guarded by one process-local lock so concurrent tokenize requests cannot
    race on ID assignment or frequency counts (research.md §5). Requires the
    backend to run as a single worker process for "global" to mean singular.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: dict[str, _Entry] = {}
        self._next_id = 0

    def apply_tokens(self, raw_tokens: list[str]) -> list[_Entry]:
        """Look up/create an entry for each raw token, in order, atomically.

        Clears every previous entry's `is_new` flag first so it only ever
        reflects *this* operation (FR-016), then reuses or creates entries.
        """
        with self._lock:
            for entry in self._entries.values():
                entry.is_new = False

            results: list[_Entry] = []
            for token in raw_tokens:
                entry = self._entries.get(token)
                if entry is None:
                    entry = _Entry(self._next_id, token)
                    self._next_id += 1
                    entry.is_new = True
                    self._entries[token] = entry
                entry.frequency += 1
                results.append(entry)
            return list(results)

    def snapshot(self) -> VocabularyResponse:
        with self._lock:
            entries = [
                VocabularyEntry(
                    id=entry.id,
                    token=entry.token,
                    frequency=entry.frequency,
                    is_new=entry.is_new,
                )
                for entry in sorted(self._entries.values(), key=lambda e: e.id)
            ]
            return VocabularyResponse(entries=entries, total_tokens=len(entries))

    def reset(self) -> VocabularyResponse:
        with self._lock:
            self._entries.clear()
            self._next_id = 0
            return VocabularyResponse(entries=[], total_tokens=0)


# Module-level singleton: the one global vocabulary for the running instance.
vocabulary_store = VocabularyStore()
