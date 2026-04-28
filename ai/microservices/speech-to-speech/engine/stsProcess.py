##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module.
##

from __future__ import annotations

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
			audio_bytes = await websocket.receive_bytes()
			result = await queue_service.submit(audio_bytes)

			if not result.transcription:
				continue

			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"User: {result.transcription}")
			try:
				await websocket.send_text(json.dumps({"type": "transcription", "text": result.transcription}))
			except (WebSocketDisconnect, ConnectionClosed):
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending transcription")
				return

			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"AI: {result.ai_response[:100]}...")
			try:
				await websocket.send_text(json.dumps({"type": "response", "text": result.ai_response}))
			except (WebSocketDisconnect, ConnectionClosed):
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending LLM response")
				return

			try:
				for chunk in result.audio_chunks:
					try:
						await websocket.send_bytes(chunk)
					except (WebSocketDisconnect, ConnectionClosed):
						NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending TTS stream")
						return
			except Exception as tts_err:
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"TTS error: {tts_err}")
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
					NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending TTS warning")
					return

	except WebSocketDisconnect:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected")
	except Exception as err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"WebSocket error: {err}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, traceback.format_exc().strip())
		await websocket.close()
