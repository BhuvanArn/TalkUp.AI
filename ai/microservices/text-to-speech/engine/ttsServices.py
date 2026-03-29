##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This module handles the text-to-speech microservice.
##

import asyncio
import base64
import io
import os
import queue
import threading
import wave

import engine.enumMcs as enumMcs

from fastapi import WebSocket
from network.protocol import Message
from network.websockets import WebSocketMicroservice

from TTS.api import TTS as C_TTS
from .notifications import Notifications

class TTS:
    def __init__(self, websocket: WebSocket):
        """
        Class constructor
        """
        self.TTSWsMicroservice = WebSocketMicroservice("TTS", websocket, owner=self)
        self.n: Notifications = Notifications()
        self.language: str = "fr"
        self.tts_model: str = "css10/vits"
        self.tts = None
        self.running: bool = True
        self.loop: asyncio.AbstractEventLoop | None = None
        self.send_queue: asyncio.Queue | None = None
        self._send_consumer_task: asyncio.Task | None = None
        self._worker_thread: threading.Thread | None = None
        self.request_queue: queue.Queue = queue.Queue(
            maxsize=int(os.environ.get("TTS_QUEUE_MAXSIZE", "32"))
        )

        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None

        if self.loop is not None:
            self.send_queue = asyncio.Queue()
            self._send_consumer_task = asyncio.create_task(self.send_consumer())

    def synthesize_input(self, text: str) -> bytes:
        """
        Process:
        This function will synthesize the input text to speech.
        It will use the TTS model to generate speech from text.

        Exeptions:
        If an error occurs, it prints the error message.
        """
        try:
            wav = self.tts.tts(text=text)
            sample_rate = int(getattr(self.tts.synthesizer, "output_sample_rate", 22050))
            return self._wav_f32_to_bytes(wav, sample_rate)
        except Exception as e:
            self.n.send_notification(enumMcs.MicroservicesNames.TTS, 2, str(e))
            raise

    @staticmethod
    def _wav_f32_to_bytes(samples, sample_rate: int) -> bytes:
        """
        Convert float waveform samples in range [-1, 1] into a PCM16 WAV payload.
        """
        with io.BytesIO() as output:
            with wave.open(output, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)

                pcm_frames = bytearray()
                for sample in samples:
                    clipped = max(-1.0, min(1.0, float(sample)))
                    value = int(clipped * 32767.0)
                    pcm_frames.extend(int(value).to_bytes(2, byteorder="little", signed=True))

                wav_file.writeframes(bytes(pcm_frames))

            return output.getvalue()

    def start_tts_process(self) -> None:
        """
        Process:
        Start the text-to-speech process.
        This function initializes the TTS system (tts object).

        Exeptions:
        If an error occurs, it prints the error message.
        """
        try:
            if self.tts is None:
                self.tts = C_TTS(
                    model_name="tts_models/" + self.language + "/" + self.tts_model,
                    progress_bar=False,
                    gpu=False,
                )
            if self._worker_thread and self._worker_thread.is_alive():
                return

            self._worker_thread = threading.Thread(target=self.processing_loop, daemon=True)
            self._worker_thread.start()
            self.n.send_notification(enumMcs.MicroservicesNames.TTS, 0, "Service started successfully!")
        except Exception as e:
            self.n.send_notification(enumMcs.MicroservicesNames.TTS, 2, str(e))

    def stop_tts_process(self) -> None:
        """
        Stop worker and async sender cleanly.
        """
        self.running = False
        try:
            self.request_queue.put_nowait(None)
        except queue.Full:
            pass

        if self.loop and self.send_queue:
            try:
                self.loop.call_soon_threadsafe(self.send_queue.put_nowait, None)
            except Exception:
                pass

        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)

        if self.loop and self._send_consumer_task and not self._send_consumer_task.done():
            def _cancel_task() -> None:
                self._send_consumer_task.cancel()

            self.loop.call_soon_threadsafe(_cancel_task)

        self.n.send_notification(enumMcs.MicroservicesNames.TTS, 0, "Service stopped successfully!")

    async def on_stream_chunk(self, ws: WebSocket, msg: Message) -> None:
        """
        Handle text chunks from server and queue them for synthesis.
        Expected payload shape:
        {"data": {"chunk": "text to synthesize", "eof": true}}
        """
        text = self._extract_text_payload(msg)
        if text is None:
            await self.TTSWsMicroservice.send(
                ws,
                msg.services,
                "error",
                {"message": "No text payload found in stream_chunk"},
            )
            return

        if not self.enqueue_request(msg.services, text):
            await self.TTSWsMicroservice.send(
                ws,
                msg.services,
                "error",
                {"message": "TTS queue is full, request dropped"},
            )

    async def on_process_request(self, ws: WebSocket, msg: Message) -> None:
        """
        Support process_request with same extraction logic for compatibility.
        """
        await self.on_stream_chunk(ws, msg)

    def _extract_text_payload(self, msg: Message) -> str | None:
        if isinstance(msg.data, str):
            return msg.data.strip() or None

        if not isinstance(msg.data, dict):
            return None

        text = msg.data.get("chunk") or msg.data.get("text") or msg.data.get("data")
        if isinstance(text, str):
            text = text.strip()
            return text or None
        return None

    def enqueue_request(self, services: list[str], text: str) -> bool:
        """
        Push request to bounded queue; False when overloaded.
        """
        try:
            self.request_queue.put_nowait((services, text))
            return True
        except queue.Full:
            self.n.send_notification(
                enumMcs.MicroservicesNames.TTS,
                2,
                "Request queue is full; dropping incoming request",
            )
            return False

    def processing_loop(self) -> None:
        """
        Consume text requests and synthesize audio in a dedicated worker thread.
        """
        while self.running:
            item = self.request_queue.get()
            if item is None:
                break

            services, text = item
            try:
                wav_bytes = self.synthesize_input(text)
                audio_b64 = base64.b64encode(wav_bytes).decode("ascii")
                payload = (
                    services,
                    "tts_result",
                    {
                        "chunk": audio_b64,
                        "eof": True,
                        "format": "wav",
                    },
                )

                if self.loop and self.send_queue:
                    self.loop.call_soon_threadsafe(self.send_queue.put_nowait, payload)
            except Exception as e:
                error_payload = (
                    services,
                    "error",
                    {"message": f"TTS synthesis failed: {str(e)}"},
                )
                if self.loop and self.send_queue:
                    self.loop.call_soon_threadsafe(self.send_queue.put_nowait, error_payload)

    async def send_consumer(self) -> None:
        """
        Send websocket responses from event-loop context.
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

            services, msg_type, data = item
            try:
                await self.TTSWsMicroservice.send(
                    self.TTSWsMicroservice.websocket,
                    services,
                    msg_type,
                    data,
                )
            except Exception as e:
                self.n.send_notification(enumMcs.MicroservicesNames.TTS, 2, f"Send failed: {str(e)}")


