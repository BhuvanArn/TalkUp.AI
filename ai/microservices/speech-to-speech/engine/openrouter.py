##
## Talkup Project, 2026
## TalkUp.AI
## OpenRouter chat completions (remote LLM).
##

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from .enumMcs import EnumMcs
from .notifications import Notifications

NOTIFIER = Notifications()

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "mistralai/mistral-small-3.2-24b-instruct"


def generate_openrouter_response(
	messages: list[dict[str, str]],
	*,
	api_key: str,
	model: str,
	max_tokens: int,
	base_url: str = DEFAULT_BASE_URL,
) -> str:
	"""
	Calls OpenRouter /chat/completions with the full message list (system + history + user).
	"""
	url = f"{base_url.rstrip('/')}/chat/completions"
	payload = {
		"model": model,
		"messages": messages,
		"max_tokens": max_tokens,
		"temperature": 0.75,
		"top_p": 0.92,
	}

	body = json.dumps(payload).encode("utf-8")
	headers = {
		"Authorization": f"Bearer {api_key}",
		"Content-Type": "application/json",
		"HTTP-Referer": os.environ.get("OPENROUTER_HTTP_REFERER", "https://talkup.ai"),
		"X-Title": os.environ.get("OPENROUTER_APP_TITLE", "TalkUp.AI"),
	}

	req = urllib.request.Request(url, data=body, headers=headers, method="POST")

	try:
		with urllib.request.urlopen(req, timeout=120) as resp:
			raw = json.loads(resp.read().decode("utf-8"))
	except urllib.error.HTTPError as err:
		detail = err.read().decode("utf-8", errors="replace")[:500]
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"OpenRouter HTTP {err.code}: {detail}",
		)
		raise
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"OpenRouter request failed: {err}",
		)
		raise

	choices = raw.get("choices") or []
	if not choices:
		raise ValueError("OpenRouter returned no choices")

	message = choices[0].get("message") or {}
	content = message.get("content", "")
	if isinstance(content, list):
		# Multimodal-style chunks
		parts = [
			p.get("text", "")
			for p in content
			if isinstance(p, dict) and p.get("type") == "text"
		]
		content = "".join(parts)

	if not isinstance(content, str) or not content.strip():
		raise ValueError("OpenRouter returned empty content")

	return content.strip()
