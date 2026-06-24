##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module pipeline for handling
## the core logic of transcribing audio, generating AI responses, and synthesizing speech.
##

from __future__ import annotations

import numpy as np

from dataclasses import dataclass
from .audio_decode import decode_audio_to_float32
from .models import STSModels, generate_ai_response, synthesize_tts_chunks
from .simulation_brief import build_messages_for_turn
from .session_context import append_session_history

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
	segments, _ = models.whisper_model.transcribe(
		audio_np,
		beam_size=5,
		language="fr",
		vad_filter=True,
		word_timestamps=False,
	)
	user_text = " ".join(segment.text for segment in segments).strip()

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
