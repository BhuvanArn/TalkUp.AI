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
        self.q: queue = queue.Queue()
        self.STTWsMicroservice = WebSocketMicroservice("STT", websocket, owner=self)
        self.n: Notifications = Notifications()
        self.model: str = Model(lang=model_type)
        self.running: bool = True

        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None
        self.send_queue: Optional[asyncio.Queue] = None
        self._send_consumer_task: Optional[asyncio.Task] = None
        if self.loop is not None:
            def _setup_send_queue():
                self.send_queue = asyncio.Queue()
                self._send_consumer_task = self.loop.create_task(self._send_consumer())
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

    async def on_stream_chunk(self, ws: WebSocket, msg: Message):
        """
        This method processes stream chunks received via WebSocket.
        It decodes the base64-encoded audio data, converts it to PCM16 format,
        and puts the resulting bytes into a queue for further processing.
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
                await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": "ffmpeg decode error", "detail": err})
                return
            pcm_bytes = proc.stdout
            self.q.put(pcm_bytes)
            if eof:
                self.q.put(None)

        except Exception as e:
            await self.STTWsMicroservice.send(ws, msg.services, "error", {"message": str(e)})

    def probe_sample_rate(self, data: bytes) -> Optional[int]:
        """
        Probe an audio blob with ffprobe and return the sample_rate in Hz if available.
        Returns none if probing fails or ffprobe is not available.
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

    async def on_process_request(self, ws: WebSocket, msg: Message):
        """Override for processing requests."""
        pass

    async def _send_consumer(self) -> None:
        """Consume send requests from `self.send_queue` and perform websocket sends on the event loop.

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

    def callback(self, indata, frames, time, status) -> None:
        """
        This is called (from a separate thread) for each audio block.
        """
        if status:
            print(status, file=sys.stderr)
        self.q.put(bytes(indata))

    def stop_stt_process(self) -> None:
        """
        Stop the speech-to-text process.
        """
        self.running = False
        self.q.put(None)
        if self.loop and self.send_queue:
            try:
                self.loop.call_soon_threadsafe(self.send_queue.put_nowait, None)
            except Exception:
                pass
        self.n.send_notification(enumMcs.MicroservicesNames.STT, 0,
            "Service stopped successfully!")

    def start_stt_process(self) -> None:
        """
        Process:
        Start the speech-to-text process.
        This function initializes the audio input stream and processes the audio data
        using the Vosk speech recognition model.
        It listens for audio input, converts it to text, and sends the recognized text
        back to the client (the AI server) via WebSocket.

        Exeptions:
        If an error occurs, it prints the error message.
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
                    if self.loop and self.send_queue:
                        try:
                            self.loop.call_soon_threadsafe(self.send_queue.put_nowait, payload)
                        except Exception as e:
                            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, f"Failed to push to send_queue: {e}")
                    else:
                        try:
                            asyncio.run(self.STTWsMicroservice.send(
                                self.STTWsMicroservice.websocket,
                                [self.STTWsMicroservice.service_name],
                                "stt_result", {"text": token.get('text', '')}
                            ))
                        except Exception as e:
                            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, f"Failed to send stt_result: {e}")
                else:
                    pass

        except Exception as e:
            self.n.send_notification(enumMcs.MicroservicesNames.STT, 2, {str(e)})
