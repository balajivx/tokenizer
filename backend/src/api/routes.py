from fastapi import APIRouter, File, UploadFile

from src.schemas.bpe import BPETrainingRequest, BPETrainingResult
from src.schemas.errors import ErrorCode, TokenizerError
from src.schemas.files import ExtractedTextResponse
from src.schemas.tokenize import (
    EncodingListResponse,
    TokenizeRequest,
    TokenizeResponse,
    TokenizerMode,
)
from src.schemas.vocabulary import VocabularyResponse
from src.services import custom_tokenizer_service, file_service, stats_service, tiktoken_service
from src.services.bpe_service import bpe_store
from src.services.vocabulary_store import vocabulary_store

router = APIRouter(prefix="/api")


@router.get("/encodings", response_model=EncodingListResponse)
def get_encodings() -> EncodingListResponse:
    return EncodingListResponse(encodings=tiktoken_service.list_encodings())


@router.post("/tokenize", response_model=TokenizeResponse)
def post_tokenize(request: TokenizeRequest) -> TokenizeResponse:
    if not request.text.strip():
        raise TokenizerError(
            ErrorCode.EMPTY_INPUT,
            "Please enter some text or upload a file before tokenizing.",
            status_code=400,
        )

    if request.tokenizer_mode == TokenizerMode.TIKTOKEN:
        if not request.encoding:
            raise TokenizerError(
                ErrorCode.UNSUPPORTED_ENCODING,
                "Please select an encoding for Tiktoken mode.",
                status_code=400,
            )
        tokens = tiktoken_service.tokenize(request.text, request.encoding)
        encoding_used = request.encoding
    elif request.tokenizer_mode == TokenizerMode.BPE:
        tokens = bpe_store.tokenize(request.text)
        encoding_used = None
    else:
        tokens = custom_tokenizer_service.tokenize(request.text, vocabulary_store)
        encoding_used = None

    stats = stats_service.compute(request.text, len(tokens))

    return TokenizeResponse(
        original_text=request.text,
        source_type=request.source_type,
        tokenizer_mode=request.tokenizer_mode,
        encoding=encoding_used,
        tokens=tokens,
        token_count=len(tokens),
        **stats,
    )


@router.post("/bpe/train", response_model=BPETrainingResult)
def post_bpe_train(request: BPETrainingRequest) -> BPETrainingResult:
    return bpe_store.train(request.training_text, request.target_vocab_size)


@router.get("/bpe/model", response_model=BPETrainingResult)
def get_bpe_model() -> BPETrainingResult:
    return bpe_store.get_model()


@router.post("/bpe/reset", response_model=BPETrainingResult)
def post_bpe_reset() -> BPETrainingResult:
    return bpe_store.reset()


@router.get("/vocabulary", response_model=VocabularyResponse)
def get_vocabulary() -> VocabularyResponse:
    return vocabulary_store.snapshot()


@router.post("/vocabulary/reset", response_model=VocabularyResponse)
def post_vocabulary_reset() -> VocabularyResponse:
    return vocabulary_store.reset()


@router.post("/files/extract", response_model=ExtractedTextResponse)
async def post_files_extract(file: UploadFile = File(...)) -> ExtractedTextResponse:
    raw_bytes = await file.read()

    if len(raw_bytes) == 0:
        raise TokenizerError(
            ErrorCode.EMPTY_INPUT,
            "The uploaded file is empty.",
            status_code=400,
        )

    source_type = file_service.validate_upload(file.filename or "", len(raw_bytes))

    if source_type == "txt_file":
        text = file_service.extract_txt(raw_bytes)
    else:
        text = file_service.extract_pdf(raw_bytes)

    return ExtractedTextResponse(
        source_type=source_type,
        filename=file.filename or "",
        text=text,
        character_count=len(text),
    )
