##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This module handles the speech-to-text microservice.
##

import queue
import sys
import os
import json
import base64
import subprocess
import engine.enumMcs as enumMcs
import asyncio
import threading

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi import WebSocket
from network.protocol import Message
from network.websockets import WebSocketMicroservice
from .notifications import Notifications
from vosk import Model, KaldiRecognizer
from typing import Optional

class STT():
    def __init__(self, model_type: str, websocket: WebSocket, samplerate: Optional[int] = None) -> None:
        """
        Class constructor
        """
        self.q: queue.Queue = queue.Queue(maxsize=50)
        self.STTWsMicroservice = WebSocketMicroservice("STT", websocket, owner=self)
        self.n: Notifications = Notifications()
        self.running: bool = True
        self._worker_thread: Optional[threading.Thread] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.send_queue: Optional[asyncio.Queue] = None
        self._send_consumer_task: Optional[asyncio.Task] = None

        model_path = os.environ.get("VOSK_MODEL_PATH")
        try:
            if model_path and os.path.isdir(model_path):
                self.model: Model = Model(model_path)
                self.n.send_notification(enumMcs.MicroservicesNames.STT, 0,
                    f"Loaded Vosk model from path: {model_path}")
            else:
                self.model: Model = Model(lang=model_type)
        except Exception as e:
            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2,
                f"Failed to load Vosk model: {e}. Ensure model is pre-downloaded or VOSK_MODEL_PATH is set.")
            raise

        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None

        if self.loop is not None:
            def _setup_send_queue():
                self.send_queue = asyncio.Queue()
                self._send_consumer_task = self.loop.create_task(self.send_consumer())
            self.loop.call_soon_threadsafe(_setup_send_queue)

        env_sr = os.environ.get("STT_SAMPLERATE")
        if samplerate is not None:
            self.samplerate: int = int(samplerate)
        elif env_sr:
            try:
                self.samplerate = int(env_sr)
            except Exception:
                self.samplerate = 16000
                self.n.send_notification(enumMcs.MicroservicesNames.STT, 2,
                    f"Invalid STT_SAMPLERATE env var '{env_sr}', falling back to 16000Hz")
        else:
            self.samplerate: int = 16000

    async def on_stream_chunk(self, ws: WebSocket, msg: Message) -> None:
        """
        This method processes stream chunks received via WebSocket.
        It decodes the base64-encoded audio data, converts it to PCM16 format,
        and puts the resulting bytes into a queue for further processing.
        Args:
            ws: The WebSocket connection.
            msg: The incoming message containing the audio chunk.
        """
        try:
            audio_b64 = None
            if isinstance(msg.data, dict):
                audio_b64 = msg.data.get("chunk") or msg.data.get("audio") or msg.data.get("data")
                eof = msg.data.get("eof", False)
            else:
                audio_b64 = msg.data
                eof = False
            if audio_b64 is None:
                await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": "No audio data in stream_chunk"})
                return
            if isinstance(audio_b64, str):
                container_bytes = base64.b64decode(audio_b64)
            else:
                container_bytes = audio_b64

            probe_sr = self.probe_sample_rate(container_bytes)
            if probe_sr is None:
                self.n.send_notification(enumMcs.MicroservicesNames.STT, 1,
                    f"Could not determine incoming audio sample rate; assuming {self.samplerate}Hz and converting")
            else:
                if probe_sr != self.samplerate:
                    self.n.send_notification(enumMcs.MicroservicesNames.STT, 1,
                        f"Incoming audio sample rate {probe_sr}Hz differs from configured {self.samplerate}Hz; resampling")

            try:
                pcm_bytes = await asyncio.to_thread(self.decode_audio, container_bytes, probe_sr)
            except Exception as err:
                await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": "ffmpeg decode error", "detail": str(err)})
                return

            if not self.enqueue_audio(pcm_bytes):
                await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": "Audio queue full, dropping chunk"})
                return
            if eof:
                self.enqueue_audio(None)

        except Exception as e:
            await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": str(e)})

    def probe_sample_rate(self, data: bytes) -> Optional[int]:
        """
        Probe an audio blob with ffprobe and return the sample_rate in Hz if available.
        Returns none if probing fails or ffprobe is not available.
        Args:
            data: The input audio data in a container format.
        Returns:
            The sample rate in Hz, or None if not found.
        """
        try:
            cmd = [
                "ffprobe", "-v", "error",
                "-select_streams", "a:0",
                "-show_entries", "stream=sample_rate",
                "-of", "json",
                "-i", "pipe:0",
            ]
            proc = subprocess.run(cmd, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if proc.returncode != 0:
                return None
            info = json.loads(proc.stdout.decode(errors="ignore") or "{}")
            streams = info.get("streams", [])
            if not streams:
                return None
            sr = streams[0].get("sample_rate")
            if sr:
                return int(sr)
            return None
        except Exception:
            return None

    async def on_process_request(self, ws: WebSocket, msg: Message) -> None:
        """
        Override for processing requests.
        """
        pass

    async def send_consumer(self) -> None:
        """
        Consume send requests from `self.send_queue` and perform websocket sends on the event loop.
        Each queue item is expected to be a tuple: (services, msg_type, data). A `None` item is
        used as sentinel to stop the consumer.
        """
        if self.send_queue is None:
            return
        while True:
            try:
                item = await self.send_queue.get()
            except asyncio.CancelledError:
                break
            if item is None:
                break
            try:
                services, msg_type, data = item
            except Exception:
                self.n.send_notification(enumMcs.MicroservicesNames.STT, 2,
                    "[STT] invalid send_queue item, skipping")
                continue
            max_retries = 2
            backoff = 0.1
            for attempt in range(1, max_retries + 1):
                try:
                    await self.STTWsMicroservice.send(self.STTWsMicroservice.websocket,
                        services, msg_type, data)
                    break
                except Exception as e:
                    self.n.send_notification(enumMcs.MicroservicesNames.STT, 2,
                        f"Send attempt {attempt} failed: {e}")
                    if attempt < max_retries:
                        await asyncio.sleep(backoff)
                        backoff *= 2
                    else:
                        self.n.send_notification(enumMcs.MicroservicesNames.STT, 2,
                            f"Giving up on send after retries: {e}")

        self.n.send_notification(enumMcs.MicroservicesNames.STT, 0, "Send consumer stopped")

    def callback(self, inData, frames, time, status) -> None:
        """
        This is called (from a separate thread) for each audio block.
        Args:
            inData: The input audio data.
            frames: The number of frames.
            time: The time information.
            status: The status of the audio stream.
        """
        if status:
            print(status, file=sys.stderr)
        self.q.put(bytes(inData))

    def stop_stt_process(self) -> None:
        """
        Stop the speech-to-text process.
        """
        self.running = False
        self.enqueue_audio(None)
        if self.loop and self.send_queue:
            try:
                self.loop.call_soon_threadsafe(self.send_queue.put_nowait, None)
            except Exception:
                pass

        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=1.0)
        if self.loop and self._send_consumer_task:
            if not self._send_consumer_task.done():
                def _cancel_task():
                    self._send_consumer_task.cancel()
                self.loop.call_soon_threadsafe(_cancel_task)
                try:
                    asyncio.run_coroutine_threadsafe(
                        asyncio.shield(self._send_consumer_task),
                        self.loop
                    ).result(timeout=1.0)
                except Exception:
                    pass

        self.n.send_notification(enumMcs.MicroservicesNames.STT, 0,
            "Service stopped successfully!")

    def start_stt_process(self) -> None:
        """
        Start the speech-to-text process in a background thread to avoid blocking.
        """
        if self._worker_thread and self._worker_thread.is_alive():
            return
        self._worker_thread = threading.Thread(target=self.processing_loop, daemon=True)
        self._worker_thread.start()

    def processing_loop(self) -> None:
        """
        The main processing loop that consumes audio data from the queue,
        performs speech-to-text recognition, and sends results back via WebSocket.
        """
        try:
            self.n.send_notification(enumMcs.MicroservicesNames.STT, 0,
                "Service started successfully!")
            rec = KaldiRecognizer(self.model, self.samplerate)

            while self.running:
                data = self.q.get()
                if data is None:
                    break
                if not data:
                    continue
                if rec.AcceptWaveform(data): # expects bytes of PCM16
                    token = json.loads(rec.FinalResult())
                    payload = (
                        [self.STTWsMicroservice.service_name],
                        "stt_result",
                        {"text": token.get('text', '')}
                    )
                    try:
                        self.loop.call_soon_threadsafe(self.send_queue.put_nowait, payload)
                    except Exception as e:
                        self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, f"Failed to push to send_queue: {e}")
                else:
                    pass

        except Exception as e:
            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, {str(e)})

    def decode_audio(self, container_bytes: bytes, probe_sr: Optional[int]) -> bytes:
        """
        Decode input audio container bytes to PCM16 using ffmpeg.
        Args:
            container_bytes: The input audio data in a container format (e.g., webm, mp3).
            probe_sr: The sample rate of the input audio if known, else None.
        Returns:
            PCM16 encoded audio bytes.
        """
        ffmpeg_cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "s16le", "-acodec", "pcm_s16le",
            "-ac", "1",
        ]
        if probe_sr is None or probe_sr != self.samplerate:
            ffmpeg_cmd += ["-ar", str(self.samplerate)]
        ffmpeg_cmd += ["pipe:1"]

        proc = subprocess.run(ffmpeg_cmd, input=container_bytes, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            err = proc.stderr.decode(errors="ignore")
            raise RuntimeError(err)
        return proc.stdout

    def enqueue_audio(self, pcm_bytes: Optional[bytes]) -> bool:
        """
        Enqueue PCM16 audio bytes for processing.
        Args:
            pcm_bytes: The PCM16 audio bytes to enqueue. If None, signals end of stream.
        Returns:
            True if enqueued successfully, False if the queue is full.
        """
        try:
            self.q.put_nowait(pcm_bytes)
            return True
        except queue.Full:
            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, "Audio queue is full; dropping chunk")
            return False
