##
## Talkup Project, 2026
## TalkUp.AI
## Session context helpers (NestJS fallback + history sync).
##

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from .notifications import Notifications
from .enumMcs import EnumMcs
from .simulation_brief import SimulationBriefStore

NOTIFIER = Notifications()


def _backend_base() -> str:
	base = os.environ.get("BACKEND_URL", "http://127.0.0.1:3000/v1/api").strip()
	return base.rstrip("/")


def _internal_key() -> str:
	return os.environ.get("SIM_INTERNAL_API_KEY", "").strip()


def fetch_session_context(interview_id: str) -> dict[str, Any] | None:
	if not interview_id or interview_id == "unknown":
		return None

	key = _internal_key()
	if not key:
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

	SimulationBriefStore.append_turn(interview_id, user_text, assistant_text)

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


def append_assistant_turn(interview_id: str, assistant_text: str) -> None:
	if not interview_id or interview_id == "unknown":
		return

	SimulationBriefStore.append_assistant(interview_id, assistant_text)

	key = _internal_key()
	if not key:
		return

	url = f"{_backend_base()}/ai/internal/sessions/{interview_id}/assistant-turn"
	payload = json.dumps({"assistantText": assistant_text}).encode("utf-8")
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
			f"Failed to append assistant turn for {interview_id}: {err}",
		)


def fetch_session_history(interview_id: str) -> list[dict[str, str]]:
	from .simulation_brief import SimulationBriefStore

	state = SimulationBriefStore.get(interview_id)
	if state is not None:
		return list(state.history)

	session = fetch_session_context(interview_id)
	if session is not None:
		history = session.get("history")
		if isinstance(history, list):
			return list(history)
	return []


def find_stored_opening_greeting(interview_id: str) -> str | None:
	for turn in fetch_session_history(interview_id):
		if turn.get("role") == "assistant" and isinstance(turn.get("content"), str):
			content = turn["content"].strip()
			if content:
				return content
	return None


def build_messages_from_nest_session(
	default_system_prompt: str,
	session: dict[str, Any],
	user_text: str,
	extra_instruction: str = "",
) -> list[dict[str, str]]:
	system_prompt = session.get("systemPrompt") or default_system_prompt
	if extra_instruction:
		system_prompt = f"{system_prompt}\n\n{extra_instruction}"
	history = session.get("history") or []

	messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
	for turn in history:
		role = turn.get("role")
		content = turn.get("content")
		if role in ("user", "assistant") and isinstance(content, str) and content.strip():
			messages.append({"role": role, "content": content})
	messages.append({"role": "user", "content": user_text})
	return messages
