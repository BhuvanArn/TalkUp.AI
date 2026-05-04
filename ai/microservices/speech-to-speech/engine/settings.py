##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module settings and configuration loader.
##

from __future__ import annotations

import json

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
)

def load_settings(config_path: Path | None = None) -> STSSettings:
	"""
	Loads the settings for the Speech-to-Speech processing module.
	"""
	resolved_config_path = config_path or Path(__file__).resolve().parent.parent / "config.json"
	defaults = DEFAULT_SETTINGS.__dict__.copy()

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

	return STSSettings(
		llm_path=str(defaults["LLM_PATH"]),
		system_prompt=str(defaults["SYSTEM_PROMPT"]),
		piper_voice_path=str(defaults["PIPER_VOICE_PATH"]),
		whisper_model_path=str(defaults["WHISPER_MODEL_PATH"]),
		llm_backend=str(defaults["LLM_BACKEND"]).lower(),
		llm_gpu_max_memory=str(defaults["LLM_GPU_MAX_MEMORY"]),
		llm_cpu_max_memory=str(defaults["LLM_CPU_MAX_MEMORY"]),
		llm_max_new_tokens=int(defaults["LLM_MAX_NEW_TOKENS"]),
		queue_maxsize=int(defaults["QUEUE_MAXSIZE"]),
	)
