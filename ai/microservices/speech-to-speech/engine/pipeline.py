##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module pipeline for handling
## the core logic of transcribing audio, generating AI responses, and synthesizing speech.
##

from __future__ import annotations

import re

import numpy as np

from dataclasses import dataclass
from .audio_decode import decode_audio_to_float32
from .models import STSModels, generate_ai_response, synthesize_tts_chunks
from .simulation_brief import build_messages_for_turn
from .session_context import append_session_history
from .transcription_validation import (
	REPEAT_PROMPT,
	should_drop_segment_text,
	validate_transcription,
)

# A segment is treated as noise/hallucination when Whisper is fairly sure there
# was no speech and the decoding confidence is poor.
_NO_SPEECH_PROB_MAX = 0.6
_AVG_LOGPROB_MIN = -1.0
# Whisper is biased toward an interview context to reduce off-domain guesses.
_INITIAL_PROMPT = (
	"Transcription d'un entretien d'embauche professionnel en francais."
)


def _segment_no_speech_prob(segment) -> float:
	return float(getattr(segment, "no_speech_prob", 0.0) or 0.0)


def _segment_avg_logprob(segment) -> float:
	return float(getattr(segment, "avg_logprob", 0.0) or 0.0)


def _should_drop_segment(segment) -> bool:
	return should_drop_segment_text(
		segment.text,
		no_speech_prob=_segment_no_speech_prob(segment),
		avg_logprob=_segment_avg_logprob(segment),
		no_speech_prob_max=_NO_SPEECH_PROB_MAX,
		avg_logprob_min=_AVG_LOGPROB_MIN,
	)


def _build_repeat_result(models: STSModels) -> STSResult:
	audio_chunks = list(synthesize_tts_chunks(models, REPEAT_PROMPT))
	return STSResult(
		transcription="",
		ai_response=REPEAT_PROMPT,
		audio_chunks=audio_chunks,
	)


@dataclass
class STSResult:
	"""
	Represents the result of a Speech-to-Speech processing request.
	"""
	transcription: str
	ai_response: str
	audio_chunks: list[bytes]

def process_sts_request(
	models: STSModels,
	audio_bytes: bytes,
	interview_id: str | None = None,
) -> STSResult:
	"""
	Processes a Speech-to-Speech request by transcribing the input audio, generating an AI response, and synthesizing the response into audio chunks.
	"""
	audio_np = decode_audio_to_float32(audio_bytes)
	segments, _info = models.whisper_model.transcribe(
		audio_np,
		beam_size=5,
		language="fr",
		task="transcribe",
		# VAD trims silence/noise before decoding, the single biggest lever
		# against background-noise hallucinations.
		vad_filter=True,
		vad_parameters={
			"min_silence_duration_ms": 500,
			"speech_pad_ms": 200,
			"threshold": 0.5,
		},
		# Temperature fallback retries decoding when a hypothesis looks
		# degenerate (repetition / low confidence) instead of emitting garbage.
		temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
		compression_ratio_threshold=2.4,
		log_prob_threshold=-1.0,
		no_speech_threshold=0.6,
		# Each utterance is independent, so we never carry previous text as a
		# prompt; this prevents runaway hallucination loops across chunks.
		condition_on_previous_text=False,
		initial_prompt=_INITIAL_PROMPT,
		word_timestamps=False,
	)

	kept = [
		segment.text.strip()
		for segment in segments
		if not _should_drop_segment(segment)
	]
	user_text = re.sub(r"\s+", " ", " ".join(kept)).strip()

	if not user_text or len(user_text) < 2:
		return _build_repeat_result(models)

	is_valid, _reason = validate_transcription(user_text)
	if not is_valid:
		return _build_repeat_result(models)

	messages = build_messages_for_turn(
		models.settings.system_prompt,
		interview_id,
		user_text,
	)

	ai_response = generate_ai_response(models, messages)
	audio_chunks = list(synthesize_tts_chunks(models, ai_response))

	if interview_id and ai_response:
		append_session_history(interview_id, user_text, ai_response)

	return STSResult(transcription=user_text, ai_response=ai_response, audio_chunks=audio_chunks)
