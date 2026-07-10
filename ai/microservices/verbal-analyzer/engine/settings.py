##
## Talkup Project, 2026
## TalkUp.AI
## Verbal Analyzer settings.
##

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class VASettings:
	port: int
	host: str
	nlp_backend: str
	history_max_turns: int
	session_ttl_sec: int
	queue_maxsize: int
	max_transcription_chars: int
	backend_url: str
	internal_api_key: str


def load_settings() -> VASettings:
	return VASettings(
		port=int(os.environ.get("VA_PORT", "8006")),
		host=os.environ.get("VA_HOST", "0.0.0.0"),
		nlp_backend=os.environ.get("VA_NLP_BACKEND", "rules").strip().lower(),
		history_max_turns=int(os.environ.get("VA_HISTORY_MAX_TURNS", "30")),
		session_ttl_sec=int(os.environ.get("VA_SESSION_TTL_SEC", "7200")),
		queue_maxsize=int(os.environ.get("VA_QUEUE_MAXSIZE", os.environ.get("SIM_MAX_CONCURRENT", "2"))),
		max_transcription_chars=int(os.environ.get("VA_MAX_TRANSCRIPTION_CHARS", "4000")),
		backend_url=os.environ.get("BACKEND_URL", "http://127.0.0.1:3000/v1/api").rstrip("/"),
		internal_api_key=os.environ.get("SIM_INTERNAL_API_KEY", "").strip(),
	)
