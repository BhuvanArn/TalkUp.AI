##
## Talkup Project, 2026
## TalkUp.AI
## Fetches per-interview LLM context from NestJS (Scenario A).
##

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from .notifications import Notifications
from .enumMcs import EnumMcs

NOTIFIER = Notifications()


def _backend_base() -> str:
	base = os.environ.get("BACKEND_URL", "http://127.0.0.1:3000/v1/api").strip()
	return base.rstrip("/")


def _internal_key() -> str:
	return os.environ.get("SIM_INTERNAL_API_KEY", "").strip()


def fetch_session_context(interview_id: str) -> dict[str, Any] | None:
	"""
	Loads system prompt and conversation history for one interview.
	Returns None if unavailable (caller should fall back to global prompt).
	"""
	if not interview_id or interview_id == "unknown":
		return None

	key = _internal_key()
	if not key:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			"SIM_INTERNAL_API_KEY not set; using default system prompt",
		)
		return None

	url = f"{_backend_base()}/ai/internal/sessions/{interview_id}/context"
	req = urllib.request.Request(
		url,
		headers={"X-Internal-Api-Key": key, "Accept": "application/json"},
		method="GET",
	)

	try:
		with urllib.request.urlopen(req, timeout=10) as resp:
			body = resp.read().decode("utf-8")
			return json.loads(body)
	except urllib.error.HTTPError as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"Session context HTTP {err.code} for {interview_id}",
		)
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"Session context fetch failed for {interview_id}: {err}",
		)
	return None


def append_session_history(
	interview_id: str,
	user_text: str,
	assistant_text: str,
) -> None:
	if not interview_id or interview_id == "unknown":
		return

	key = _internal_key()
	if not key:
		return

	url = f"{_backend_base()}/ai/internal/sessions/{interview_id}/history"
	payload = json.dumps(
		{"userText": user_text, "assistantText": assistant_text},
	).encode("utf-8")
	req = urllib.request.Request(
		url,
		data=payload,
		headers={
			"X-Internal-Api-Key": key,
			"Content-Type": "application/json",
		},
		method="POST",
	)

	try:
		with urllib.request.urlopen(req, timeout=10) as resp:
			resp.read()
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"Failed to append session history for {interview_id}: {err}",
		)


def build_messages_from_context(
	default_system_prompt: str,
	session: dict[str, Any] | None,
	user_text: str,
) -> list[dict[str, str]]:
	if not session:
		return [
			{"role": "system", "content": default_system_prompt},
			{"role": "user", "content": user_text},
		]

	system_prompt = session.get("systemPrompt") or default_system_prompt
	history = session.get("history") or []

	messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
	for turn in history:
		role = turn.get("role")
		content = turn.get("content")
		if role in ("user", "assistant") and isinstance(content, str) and content.strip():
			messages.append({"role": role, "content": content})
	messages.append({"role": "user", "content": user_text})
	return messages
