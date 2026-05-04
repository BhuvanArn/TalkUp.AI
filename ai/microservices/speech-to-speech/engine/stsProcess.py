##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module.
##

from __future__ import annotations

import base64
import binascii
import json
import traceback

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed
from .enumMcs import EnumMcs
from .models import STSModels, load_models
from .notifications import Notifications
from .queueService import StsQueueService
from .settings import load_settings

app = FastAPI(title="TalkUp STS Service")

NOTIFIER = Notifications()

settings = load_settings()
models: STSModels = load_models(settings)
queue_service = StsQueueService(models=models, maxsize=settings.queue_maxsize)


@app.get("/health")
async def health() -> dict[str, str]:
	return {"status": "ok"}

@app.on_event("startup")
async def startup_queue_worker() -> None:
	"""
	Starts the STS queue worker when the application starts.
	"""
	queue_service.start()
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"STS queue initialized with maxsize={settings.queue_maxsize}")

@app.on_event("shutdown")
async def shutdown_queue_worker() -> None:
	"""
	Stops the STS queue worker when the application shuts down.
	"""
	await queue_service.stop()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
	"""
	Handles WebSocket connections for the STS service. Receives audio data, processes it through the pipeline,
	and sends back transcriptions, AI responses, and synthesized audio chunks.
	"""
	await websocket.accept()
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Client connected to the STS service")

	try:
		while True:
			try:
				message = await websocket.receive()
			except (WebSocketDisconnect, ConnectionClosed, RuntimeError):
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected")
				return
			audio_bytes = b""

			if message.get("type") == "websocket.receive" and message.get("text") is not None:
				try:
					payload = json.loads(message["text"])
				except Exception:
					await websocket.send_text(json.dumps({"type": "error", "text": "Invalid JSON payload"}))
					continue

				if payload.get("type") == "ping":
					pong = {
						"type": "pong",
						"key": payload.get("key", ""),
						"data": payload.get("data", {}),
					}
					await websocket.send_text(json.dumps(pong))
					continue

				if payload.get("type") == "stream_chunk":
					chunk_data = payload.get("data", {})
					if isinstance(chunk_data, dict):
						audio_b64 = chunk_data.get("chunk", "")
					else:
						audio_b64 = chunk_data

					if not isinstance(audio_b64, str):
						await websocket.send_text(json.dumps({"type": "error", "text": "Missing audio payload"}))
						continue

					try:
						audio_bytes = base64.b64decode(audio_b64, validate=True)
					except (binascii.Error, ValueError):
						await websocket.send_text(json.dumps({"type": "error", "text": "Invalid base64 audio payload"}))
						continue
				else:
					await websocket.send_text(json.dumps({"type": "error", "text": "Unsupported message type"}))
					continue
			elif message.get("type") == "websocket.receive" and message.get("bytes") is not None:
				audio_bytes = message["bytes"]
			else:
				continue

			result = await queue_service.submit(audio_bytes)

			if not result.transcription:
				continue

			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"User: {result.transcription}")
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"AI: {result.ai_response[:100]}...")
			try:
				encoded_chunks = [base64.b64encode(chunk).decode("ascii") for chunk in result.audio_chunks]
				await websocket.send_text(
					json.dumps(
						{
							"type": "sts_result",
							"transcription": result.transcription,
							"response": result.ai_response,
							"audio_chunks": encoded_chunks,
						}
					)
				)
			except (WebSocketDisconnect, ConnectionClosed):
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending STS result")
				return
			except Exception as tts_err:
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"STS response error: {tts_err}")
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, traceback.format_exc().strip())
				try:
					await websocket.send_text(
						json.dumps(
							{
								"type": "warning",
								"text": "Erreur temporaire de synthese vocale. Reessayez.",
							}
						)
					)
				except (WebSocketDisconnect, ConnectionClosed):
					NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending STS warning")
					return

	except WebSocketDisconnect:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected")
	except Exception as err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"WebSocket error: {err}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, traceback.format_exc().strip())
		try:
			await websocket.close()
		except RuntimeError:
			pass
