##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module pipeline for handling
## the core logic of transcribing audio, generating AI responses, and synthesizing speech.
##

from __future__ import annotations

import re
import unicodedata

import numpy as np

from dataclasses import dataclass
from .audio_decode import decode_audio_to_float32
from .models import STSModels, generate_ai_response, synthesize_tts_chunks
from .simulation_brief import build_messages_for_turn
from .session_context import append_session_history

# Canned phrases faster-whisper frequently hallucinates on silence/noise (FR).
# These are only discarded when the model is also unsure speech was present, so
# a genuine "merci" or "au revoir" spoken with confidence is preserved.
_HALLUCINATION_PHRASES: frozenset[str] = frozenset({
	"merci", "merci a vous", "merci beaucoup", "merci a tous",
	"merci d'avoir regarde", "merci d'avoir regarde cette video",
	"sous-titres realises par la communaute d'amara.org",
	"sous-titres realises par", "sous-titrage realise par",
	"abonnez-vous", "n'oubliez pas de vous abonner et de liker",
	"au revoir", "a bientot", "a la prochaine", "a plus",
	"c'est la fin de la video", "merci d'avoir ecoute",
})

# A segment is treated as noise/hallucination when Whisper is fairly sure there
# was no speech and the decoding confidence is poor.
_NO_SPEECH_PROB_MAX = 0.6
_AVG_LOGPROB_MIN = -1.0
# Whisper is biased toward an interview context to reduce off-domain guesses.
_INITIAL_PROMPT = (
	"Transcription d'un entretien d'embauche professionnel en francais."
)


def _normalize_for_match(text: str) -> str:
	decomposed = unicodedata.normalize("NFKD", text).lower().strip()
	stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
	cleaned = re.sub(r"[^a-z0-9'\- .]", "", stripped)
	return cleaned.strip(" .")


def _segment_no_speech_prob(segment) -> float:
	return float(getattr(segment, "no_speech_prob", 0.0) or 0.0)


def _segment_avg_logprob(segment) -> float:
	return float(getattr(segment, "avg_logprob", 0.0) or 0.0)


def _should_drop_segment(segment) -> bool:
	cleaned = _normalize_for_match(segment.text)
	if not cleaned:
		return True

	no_speech = _segment_no_speech_prob(segment)
	avg_logprob = _segment_avg_logprob(segment)

	if no_speech >= _NO_SPEECH_PROB_MAX and avg_logprob <= _AVG_LOGPROB_MIN:
		return True

	if cleaned in _HALLUCINATION_PHRASES and no_speech >= 0.5:
		return True

	return False


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
		return STSResult(transcription="", ai_response="", audio_chunks=[])

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
