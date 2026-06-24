##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module settings and configuration loader.
##

from __future__ import annotations

import json
import os

from dataclasses import dataclass
from pathlib import Path

from .enumMcs import EnumMcs
from .notifications import Notifications

NOTIFIER = Notifications()

@dataclass(frozen=True)
class STSSettings:
	"""
	Settings for the Speech-to-Speech processing module.
	"""
	llm_path: str
	system_prompt: str
	piper_voice_path: str
	whisper_model_path: str
	llm_backend: str
	llm_gpu_max_memory: str
	llm_cpu_max_memory: str
	llm_max_new_tokens: int
	queue_maxsize: int
	openrouter_api_key: str
	openrouter_model: str
	openrouter_base_url: str

DEFAULT_SETTINGS = STSSettings(
	llm_path="/app/llm/sup-it-v3-merged",
	system_prompt="Tu es Sophie Martin, recruteuse senior IT chez une ESN francaise. Tu es chaleureuse, professionnelle, patiente et humaine. Tu parles de facon naturelle comme dans une vraie conversation. Tu dois repondre uniquement a la derniere prise de parole du candidat, en une seule reponse courte et naturelle. N'ecris jamais un dialogue multi-tours, n'imite jamais des balises comme system: ou user:, et ne recopie jamais l'historique de conversation.",
	piper_voice_path="/app/models/piper/fr_FR-siwis-medium.onnx",
	whisper_model_path="/app/models/whisper/faster-whisper-large-v3",
	llm_backend="auto",
	llm_gpu_max_memory="2GiB",
	llm_cpu_max_memory="16GiB",
	llm_max_new_tokens=160,
	queue_maxsize=32,
	openrouter_api_key="",
	openrouter_model="mistralai/mistral-small-3.2-24b-instruct",
	openrouter_base_url="https://openrouter.ai/api/v1",
)

def _normalize_llm_backend(raw: str) -> str:
	"""local = on-pod HF/vLLM; openrouter = remote API."""
	value = (raw or "auto").strip().lower()
	if value == "local":
		return "auto"
	return value


def _env_override(key: str, defaults: dict[str, object]) -> None:
	value = os.environ.get(key)
	if value is not None and str(value).strip() != "":
		defaults[key] = value


def load_settings(config_path: Path | None = None) -> STSSettings:
	"""
	Loads the settings for the Speech-to-Speech processing module.
	"""
	resolved_config_path = config_path or Path(__file__).resolve().parent.parent / "config.json"
	# config.json (and the reads below) use UPPERCASE keys; map the lowercase
	# dataclass fields so the defaults survive a missing/empty/invalid config.
	defaults = {
		"LLM_PATH": DEFAULT_SETTINGS.llm_path,
		"SYSTEM_PROMPT": DEFAULT_SETTINGS.system_prompt,
		"PIPER_VOICE_PATH": DEFAULT_SETTINGS.piper_voice_path,
		"WHISPER_MODEL_PATH": DEFAULT_SETTINGS.whisper_model_path,
		"LLM_BACKEND": DEFAULT_SETTINGS.llm_backend,
		"LLM_GPU_MAX_MEMORY": DEFAULT_SETTINGS.llm_gpu_max_memory,
		"LLM_CPU_MAX_MEMORY": DEFAULT_SETTINGS.llm_cpu_max_memory,
		"LLM_MAX_NEW_TOKENS": DEFAULT_SETTINGS.llm_max_new_tokens,
		"QUEUE_MAXSIZE": DEFAULT_SETTINGS.queue_maxsize,
		"OPENROUTER_API_KEY": DEFAULT_SETTINGS.openrouter_api_key,
		"OPENROUTER_MODEL": DEFAULT_SETTINGS.openrouter_model,
		"OPENROUTER_BASE_URL": DEFAULT_SETTINGS.openrouter_base_url,
	}

	try:
		raw_config = resolved_config_path.read_text(encoding="utf-8")
		if raw_config.strip():
			loaded_config = json.loads(raw_config)
			if isinstance(loaded_config, dict):
				defaults.update(loaded_config)
			else:
				NOTIFIER.send_notification(
					EnumMcs.MicroservicesNames.STS,
					1,
					f"Invalid config format in {resolved_config_path}, expected JSON object",
				)
		else:
			NOTIFIER.send_notification(
				EnumMcs.MicroservicesNames.STS,
				1,
				f"Config file is empty ({resolved_config_path}), using default values",
			)
	except FileNotFoundError:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"Config file not found ({resolved_config_path}), using default values",
		)
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"Unable to load config file {resolved_config_path}: {err}. Using default values",
		)

	# Environment / .env wins over config.json (e.g. LLM_BACKEND=openrouter).
	for env_key in (
		"LLM_PATH",
		"SYSTEM_PROMPT",
		"PIPER_VOICE_PATH",
		"WHISPER_MODEL_PATH",
		"LLM_BACKEND",
		"LLM_GPU_MAX_MEMORY",
		"LLM_CPU_MAX_MEMORY",
		"LLM_MAX_NEW_TOKENS",
		"QUEUE_MAXSIZE",
		"OPENROUTER_API_KEY",
		"OPENROUTER_MODEL",
		"OPENROUTER_BASE_URL",
	):
		_env_override(env_key, defaults)

	backend = _normalize_llm_backend(str(defaults["LLM_BACKEND"]))
	key_set = bool(str(defaults["OPENROUTER_API_KEY"]).strip())
	NOTIFIER.send_notification(
		EnumMcs.MicroservicesNames.STS,
		0,
		f"STS config: LLM_BACKEND={backend}, OPENROUTER_API_KEY={'set' if key_set else 'MISSING'}",
	)

	return STSSettings(
		llm_path=str(defaults["LLM_PATH"]),
		system_prompt=str(defaults["SYSTEM_PROMPT"]),
		piper_voice_path=str(defaults["PIPER_VOICE_PATH"]),
		whisper_model_path=str(defaults["WHISPER_MODEL_PATH"]),
		llm_backend=_normalize_llm_backend(str(defaults["LLM_BACKEND"])),
		llm_gpu_max_memory=str(defaults["LLM_GPU_MAX_MEMORY"]),
		llm_cpu_max_memory=str(defaults["LLM_CPU_MAX_MEMORY"]),
		llm_max_new_tokens=int(defaults["LLM_MAX_NEW_TOKENS"]),
		queue_maxsize=int(defaults["QUEUE_MAXSIZE"]),
		openrouter_api_key=str(defaults["OPENROUTER_API_KEY"]).strip(),
		openrouter_model=str(defaults["OPENROUTER_MODEL"]).strip(),
		openrouter_base_url=str(defaults["OPENROUTER_BASE_URL"]).strip(),
	)
