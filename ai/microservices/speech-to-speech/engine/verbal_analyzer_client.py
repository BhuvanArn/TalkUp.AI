##
## Talkup Project, 2026
## TalkUp.AI
## Non-blocking HTTP client for Verbal Analyzer microservice.
##

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from .enumMcs import EnumMcs
from .notifications import Notifications
from .simulation_brief import SimulationBriefStore

NOTIFIER = Notifications()


def _va_enabled() -> bool:
	raw = os.environ.get("VA_ENABLED", "true").strip().lower()
	return raw not in ("0", "false", "no", "off")


def _va_base_url() -> str:
	return os.environ.get("VA_SERVICE_URL", "http://verbal_analyzer:8006").rstrip("/")


def _va_timeout_sec() -> float:
	try:
		return float(os.environ.get("VA_TIMEOUT_SEC", "3"))
	except ValueError:
		return 3.0


def _internal_api_key() -> str:
	return os.environ.get("SIM_INTERNAL_API_KEY", "").strip()


def _va_auth_headers() -> dict[str, str]:
	headers: dict[str, str] = {}
	key = _internal_api_key()
	if key:
		headers["X-Internal-Api-Key"] = key
	return headers


def _build_job_context(interview_id: str | None) -> dict[str, str] | None:
	if not interview_id:
		return None
	state = SimulationBriefStore.get(interview_id)
	if state is None:
		return None
	brief = state.brief
	ctx: dict[str, str] = {}
	if brief.job_title:
		ctx["title"] = brief.job_title
	if brief.job_description:
		ctx["description"] = brief.job_description
	if brief.job_requirements:
		ctx["requirements"] = brief.job_requirements
	return ctx or None


def analyze_transcription(
	interview_id: str | None,
	transcription: str,
	request_id: int | None = None,
	language: str = "French",
) -> dict[str, Any] | None:
	"""Call VA /analyze-turn. Returns parsed JSON or None on failure."""
	if not _va_enabled():
		return None
	if not interview_id or not transcription.strip():
		return None

	payload: dict[str, Any] = {
		"interview_id": interview_id,
		"transcription": transcription[:4000],
		"language": language,
	}
	if request_id is not None:
		payload["request_id"] = request_id

	job_context = _build_job_context(interview_id)
	if job_context:
		payload["job_context"] = job_context

	url = f"{_va_base_url()}/analyze-turn"
	data = json.dumps(payload).encode("utf-8")
	headers = {"Content-Type": "application/json", **_va_auth_headers()}
	req = urllib.request.Request(
		url,
		data=data,
		headers=headers,
		method="POST",
	)

	try:
		with urllib.request.urlopen(req, timeout=_va_timeout_sec()) as resp:
			body = resp.read().decode("utf-8")
			return json.loads(body)
	except urllib.error.HTTPError as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"VA HTTP {err.code} for interview {interview_id}",
		)
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"VA call failed for interview {interview_id}: {err}",
		)
	return None


def finalize_session(interview_id: str | None) -> None:
	if not _va_enabled() or not interview_id:
		return

	url = f"{_va_base_url()}/sessions/{interview_id}/finalize"
	req = urllib.request.Request(
		url,
		headers=_va_auth_headers(),
		method="POST",
	)
	try:
		with urllib.request.urlopen(req, timeout=_va_timeout_sec()) as resp:
			resp.read()
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"VA finalize failed for {interview_id}: {err}",
		)
