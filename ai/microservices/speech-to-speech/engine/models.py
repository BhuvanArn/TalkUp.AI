##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## Defines the core models and utilities for the Speech-to-Speech processing module
## including model loading and response generation.
##

from __future__ import annotations

import gc
import io
import json
import traceback
import wave
import torch

from dataclasses import dataclass
from pathlib import Path
import re
from faster_whisper import WhisperModel
from piper import PiperVoice
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

try:
	from vllm import LLM, SamplingParams
except Exception:
	LLM = None
	SamplingParams = None

from .enumMcs import EnumMcs
from .notifications import Notifications
from .settings import STSSettings

NOTIFIER = Notifications()

@dataclass
class STSModels:
	"""
	Represents the collection of models used for speech-to-speech processing.
	"""
	settings: STSSettings
	whisper_model: WhisperModel
	piper_voice: PiperVoice
	llm_backend: str
	vllm_engine: object | None
	vllm_sampling_params: object | None
	hf_model: object | None
	hf_tokenizer: object | None


_ROLE_LABEL_PATTERN = re.compile(r"(?im)(?:^|[\n\t])\s*(system|user|assistant)\s*:\s*")


def _sanitize_llm_response(text: str) -> str:
	"""
	Removes accidental role markers and dialogue continuation from the generated text.
	"""
	if not text:
		return ""

	cleaned = text.replace("\r", "\n").strip()
	cleaned = cleaned.replace("\t", " ")
	match = _ROLE_LABEL_PATTERN.search(cleaned)
	if match:
		cleaned = cleaned[: match.start()].strip()

	lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
	filtered_lines: list[str] = []
	for line in lines:
		if line.lower().startswith(("system:", "user:", "assistant:")):
			break
		filtered_lines.append(line)

	cleaned = " ".join(filtered_lines).strip()
	cleaned = re.sub(r"\s{2,}", " ", cleaned)
	return cleaned


def _is_valid_vllm_model_dir(model_path: str) -> tuple[bool, str]:
	"""
	Checks if the given path is a valid vLLM model directory.
	"""
	path = Path(model_path)

	if not path.is_dir():
		return False, f"LLM path does not exist: {model_path}"

	if (path / "config.json").is_file():
		return True, "ok"

	if (path / "adapter_config.json").is_file():
		return False, (
			f"LLM path {model_path} looks like a LoRA adapter only (adapter_config.json found, "
			"config.json missing). Mount a full base model directory for vLLM."
		)

	return False, f"Invalid LLM directory at {model_path}: missing config.json"

def _normalize_vllm_model_config(model_path: str) -> None:
	"""
	Ensures that the vLLM model's config.json has the necessary fields for compatibility with vLLM, adding defaults if needed.
	"""
	config_path = Path(model_path) / "config.json"

	try:
		config = json.loads(config_path.read_text(encoding="utf-8"))
	except Exception as err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"Could not read LLM config for normalization: {err}")
		return

	changed = False
	rope_scaling = config.get("rope_scaling")
	if rope_scaling is None:
		config["rope_scaling"] = {"type": "linear", "factor": 1.0}
		changed = True
	elif isinstance(rope_scaling, dict) and "factor" not in rope_scaling:
		rope_scaling["factor"] = 1.0
		config["rope_scaling"] = rope_scaling
		changed = True

	if changed:
		config_path.write_text(json.dumps(config, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Normalized LLM config.json for vLLM compatibility")

def _free_gpu_memory() -> None:
	"""
	Frees up GPU memory by collecting garbage and emptying the CUDA cache.
	"""
	gc.collect()
	if torch.cuda.is_available():
		torch.cuda.empty_cache()

def _load_whisper_model(model_path: str) -> WhisperModel:
	"""
	Loads the Whisper model from the specified path.
	Tries multiple device and compute type combinations to find a compatible configuration.
	"""
	attempts = [
		("cpu", "int8"),
		("cuda", "int8_float16"),
		("cuda", "float16"),
	]
	last_error = None

	for device, compute_type in attempts:
		try:
			NOTIFIER.send_notification(
				EnumMcs.MicroservicesNames.STS,
				0,
				f"Trying Whisper on {device} with {compute_type}...",
			)
			return WhisperModel(model_path, device=device, compute_type=compute_type)
		except Exception as err:
			last_error = err
			NOTIFIER.send_notification(
				EnumMcs.MicroservicesNames.STS,
				1,
				f"Whisper load failed on {device}/{compute_type}: {err}",
			)
	raise RuntimeError(f"Unable to load Whisper model from {model_path}: {last_error}")

def _init_vllm(settings: STSSettings):
	"""
	Initializes the vLLM engine with the specified settings.
	"""
	if LLM is None or SamplingParams is None:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "vLLM import unavailable, skipping vLLM backend")
		return None, None, "none"

	is_valid_llm_dir, llm_reason = _is_valid_vllm_model_dir(settings.llm_path)
	if not is_valid_llm_dir:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"vLLM initialization skipped: {llm_reason}")
		return None, None, "none"

	_normalize_vllm_model_config(settings.llm_path)

	llm_attempts = [
		{"gpu_memory_utilization": 0.85, "max_model_len": 4096},
		{"gpu_memory_utilization": 0.70, "max_model_len": 2048},
		{"gpu_memory_utilization": 0.50, "max_model_len": 1024},
		{"gpu_memory_utilization": 0.30, "max_model_len": 512},
		{"gpu_memory_utilization": 0.20, "max_model_len": 256},
	]

	for i, cfg in enumerate(llm_attempts, 1):
		try:
			NOTIFIER.send_notification(
				EnumMcs.MicroservicesNames.STS,
				0,
				(
					f"[{i}/{len(llm_attempts)}] Trying vLLM with "
					f"gpu_memory_utilization={cfg['gpu_memory_utilization']} "
					f"max_model_len={cfg['max_model_len']}..."
				),
			)
			vllm_engine = LLM(
				model=settings.llm_path,
				tensor_parallel_size=1,
				gpu_memory_utilization=cfg["gpu_memory_utilization"],
				max_model_len=cfg["max_model_len"],
				dtype="float16",
				trust_remote_code=True,
			)
			max_gen_tokens = min(settings.llm_max_new_tokens, max(cfg["max_model_len"] // 4, 64))
			vllm_sampling_params = SamplingParams(
				temperature=0.75,
				top_p=0.92,
				max_tokens=max_gen_tokens,
				stop=["\nsystem:", "\nuser:", "\nassistant:", "\tsystem:", "\tuser:", "\tassistant:"],
			)
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "vLLM initialized successfully")
			return vllm_engine, vllm_sampling_params, "vllm"
		except Exception as err:
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"vLLM init failed ({type(err).__name__}): {err}")
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, traceback.format_exc().strip())
			_free_gpu_memory()

	return None, None, "none"


def _init_hf_offload(settings: STSSettings):
	is_valid_llm_dir, llm_reason = _is_valid_vllm_model_dir(settings.llm_path)
	if not is_valid_llm_dir:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"Transformers initialization skipped: {llm_reason}")
		return None, None, "none"

	try:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			0,
			"Trying Transformers backend with GPU+CPU offload "
			f"(GPU={settings.llm_gpu_max_memory}, CPU={settings.llm_cpu_max_memory})...",
		)

		hf_tokenizer = AutoTokenizer.from_pretrained(
			settings.llm_path,
			trust_remote_code=True,
			local_files_only=True,
		)

		has_cuda = torch.cuda.is_available()
		quant_cfg = None
		if has_cuda:
			quant_cfg = BitsAndBytesConfig(
				load_in_4bit=True,
				bnb_4bit_quant_type="nf4",
				bnb_4bit_use_double_quant=True,
				bnb_4bit_compute_dtype=torch.float16,
			)

		max_memory = {"cpu": settings.llm_cpu_max_memory}
		if has_cuda:
			max_memory[0] = settings.llm_gpu_max_memory

		hf_model = AutoModelForCausalLM.from_pretrained(
			settings.llm_path,
			trust_remote_code=True,
			local_files_only=True,
			low_cpu_mem_usage=True,
			device_map="auto",
			max_memory=max_memory,
			quantization_config=quant_cfg,
			torch_dtype=torch.float16 if has_cuda else torch.float32,
		)
		hf_model.eval()
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Transformers offload backend initialized successfully")
		return hf_model, hf_tokenizer, "hf"
	except Exception as err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"Transformers offload init failed ({type(err).__name__}): {err}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, traceback.format_exc().strip())
		_free_gpu_memory()
		return None, None, "none"

def load_models(settings: STSSettings) -> STSModels:
	"""
	Loads all required models for the Speech-to-Speech processing module.
	"""
	whisper_model = _load_whisper_model(settings.whisper_model_path)

	llm_engine = None
	llm_sampling_params = None
	hf_model = None
	hf_tokenizer = None
	llm_backend = "none"

	if settings.llm_backend in {"auto", "vllm"}:
		llm_engine, llm_sampling_params, llm_backend = _init_vllm(settings)

	if llm_backend == "none" and settings.llm_backend in {"auto", "hf"}:
		hf_model, hf_tokenizer, llm_backend = _init_hf_offload(settings)

	if llm_backend == "none":
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			"LLM initialization failed for all backends, STS will use fallback text responses",
		)

	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Loading Piper TTS model...")
	piper_voice = PiperVoice.load(settings.piper_voice_path)
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Piper TTS model loaded")

	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "============================================================")
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "All models loaded successfully!")
	if llm_backend == "vllm":
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "LLM: ACTIVE (vLLM)")
	elif llm_backend == "hf":
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "LLM: ACTIVE (Transformers offload)")
	else:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, "LLM: DISABLED (fallback mode)")
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "STT: ACTIVE")
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "TTS: ACTIVE")
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "============================================================")

	return STSModels(
		settings=settings,
		whisper_model=whisper_model,
		piper_voice=piper_voice,
		llm_backend=llm_backend,
		vllm_engine=llm_engine,
		vllm_sampling_params=llm_sampling_params,
		hf_model=hf_model,
		hf_tokenizer=hf_tokenizer,
	)

def generate_ai_response(models: STSModels, messages: list[dict[str, str]]) -> str:
	"""
	Generates an AI response based on the provided messages and models.
	"""
	if models.llm_backend == "vllm" and models.vllm_engine is not None and models.vllm_sampling_params is not None:
		response = models.vllm_engine.chat(messages=messages, sampling_params=models.vllm_sampling_params)
		return _sanitize_llm_response(response.outputs[0].text)

	if models.llm_backend == "hf" and models.hf_model is not None and models.hf_tokenizer is not None:
		try:
			if hasattr(models.hf_tokenizer, "apply_chat_template") and getattr(models.hf_tokenizer, "chat_template", None):
				prompt = models.hf_tokenizer.apply_chat_template(
					messages,
					tokenize=False,
					add_generation_prompt=True,
				)
			else:
				prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages]) + "\nassistant:"

			inputs = models.hf_tokenizer(prompt, return_tensors="pt")
			target_device = models.hf_model.device
			if hasattr(target_device, "type") and target_device.type != "meta":
				inputs = {k: v.to(target_device) for k, v in inputs.items()}

			with torch.inference_mode():
				output = models.hf_model.generate(
					**inputs,
					do_sample=True,
					temperature=0.75,
					top_p=0.92,
					max_new_tokens=models.settings.llm_max_new_tokens,
					pad_token_id=models.hf_tokenizer.eos_token_id,
				)

			prompt_tokens = inputs["input_ids"].shape[1]
			generated_tokens = output[0][prompt_tokens:]
			text = models.hf_tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
			if text:
				return _sanitize_llm_response(text)
		except Exception as err:
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, f"Transformers generation failed ({type(err).__name__}): {err}")
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, traceback.format_exc().strip())
			_free_gpu_memory()

	return "Je rencontre une indisponibilite temporaire du modele de reponse. Peux-tu reformuler ta phrase ?"

def synthesize_tts_chunks(models: STSModels, text: str):
	"""
	Synthesizes TTS chunks from the given text using the specified models.
	"""
	if hasattr(models.piper_voice, "synthesize_stream"):
		for chunk in models.piper_voice.synthesize_stream(text):
			yield chunk
		return

	if hasattr(models.piper_voice, "synthesize"):
		wav_buffer = io.BytesIO()
		with wave.open(wav_buffer, "wb") as wav_file:
			try:
				models.piper_voice.synthesize(text, wav_file)
			except TypeError:
				models.piper_voice.synthesize(text=text, wav_file=wav_file)
		wav_bytes = wav_buffer.getvalue()
		if wav_bytes:
			yield wav_bytes
		return

	raise RuntimeError("No compatible Piper synthesis method found")
