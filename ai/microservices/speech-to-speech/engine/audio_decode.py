##
## Talkup Project, 2026
## TalkUp.AI
## Decode browser MediaRecorder blobs (WebM/Opus, etc.) for the STS pipeline.
##

from __future__ import annotations

from io import BytesIO

import numpy as np
from pydub import AudioSegment

# faster-whisper expects 16 kHz mono float32 in [-1, 1].
TARGET_SAMPLE_RATE = 16000

def _is_likely_container_audio(data: bytes) -> bool:
	if len(data) < 4:
		return True
	if data[:4] == b"\x1aE\xdf\xa3":  # WebM/Matroska
		return True
	if data[:4] == b"OggS":
		return True
	if len(data) >= 8 and data[4:8] == b"ftyp":  #MP4
		return True
	if data[:3] == b"ID3" or data[:2] == b"\xff\xfb":  #MP3
		return True
	if len(data) % 2 != 0:
		return True
	return False

def decode_audio_to_float32(audio_bytes: bytes) -> np.ndarray:
	"""
	Convert uploaded audio to mono 16 kHz float32 samples for Whisper.
	Browser chunks are typically WebM/Opus (MediaRecorder), not raw PCM int16.
	"""
	if not audio_bytes:
		return np.array([], dtype=np.float32)

	if not _is_likely_container_audio(audio_bytes):
		return np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

	segment = AudioSegment.from_file(BytesIO(audio_bytes))
	segment = segment.set_channels(1).set_frame_rate(TARGET_SAMPLE_RATE)

	samples = np.array(segment.get_array_of_samples(), dtype=np.float32)
	max_val = float(1 << (8 * segment.sample_width - 1))
	return samples / max_val
