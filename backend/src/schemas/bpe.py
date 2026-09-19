from pydantic import BaseModel, Field


class BPETrainingRequest(BaseModel):
    training_text: str
    target_vocab_size: int = Field(..., ge=1)


class BPEMergeRule(BaseModel):
    rank: int
    pair: list[str]
    merged_token: str
    token_id: int


class BPETrainingStep(BaseModel):
    step: int
    pair: list[str]
    frequency: int
    merged_token: str
    token_id: int


class BPEVocabularyEntry(BaseModel):
    id: int
    token: str
    is_base_char: bool


class BPETrainingResult(BaseModel):
    is_trained: bool
    initial_vocab_size: int
    final_vocab_size: int
    total_merges: int
    vocabulary: list[BPEVocabularyEntry]
    merge_rules: list[BPEMergeRule]
    training_steps: list[BPETrainingStep]
