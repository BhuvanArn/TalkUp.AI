##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module.
##

from __future__ import annotations

import asyncio
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
from .simulation_brief import SimulationBrief, SimulationBriefStore
from .verbal_analyzer_client import analyze_transcription, finalize_session
from .ws_auth import WsSessionClaims, authenticate_websocket, interview_id_allowed

app = FastAPI(title="TalkUp STS Service")

NOTIFIER = Notifications()

settings = load_settings()
models: STSModels = load_models(settings)
queue_service = StsQueueService(models=models, maxsize=settings.queue_maxsize)

# Ignore accidental double-fire from VAD (very small WebM blobs).
MIN_AUDIO_BYTES = 2048

async def _ws_send_json(websocket: WebSocket, send_lock: asyncio.Lock, payload: dict) -> None:
	async with send_lock:
		await websocket.send_text(json.dumps(payload))


async def _handle_simulation_context(
	websocket: WebSocket,
	send_lock: asyncio.Lock,
	payload: dict,
) -> None:
	interview_id = payload.get("interview_id") or payload.get("stream_id")
	context_data = payload.get("data")

	if not isinstance(interview_id, str) or not interview_id.strip():
		await _ws_send_json(
			websocket,
			send_lock,
			{"type": "error", "text": "simulation_context requires interview_id"},
		)
		return

	if not isinstance(context_data, dict):
		await _ws_send_json(
			websocket,
			send_lock,
			{
				"type": "error",
				"text": "simulation_context requires data object",
				"interview_id": interview_id,
			},
		)
		return

	brief = SimulationBrief.from_payload(context_data)
	SimulationBriefStore.register(interview_id.strip(), brief)

	ack: dict = {
		"type": "simulation_context_ack",
		"interview_id": interview_id.strip(),
		"status": "registered",
	}
	request_id = payload.get("request_id")
	if request_id is not None:
		ack["request_id"] = request_id

	await _ws_send_json(websocket, send_lock, ack)


async def _send_va_result_followup(
	websocket: WebSocket,
	send_lock: asyncio.Lock,
	interview_id: str,
	transcription: str,
	request_id: int | None,
) -> None:
	"""Run VA off the STS reply path; failures are logged and never propagated."""
	try:
		va_payload = await asyncio.to_thread(
			analyze_transcription,
			interview_id,
			transcription,
			request_id,
		)
		if va_payload is None:
			return

		va_message: dict = {
			"type": "va_result",
			"interview_id": interview_id,
			"data": va_payload,
		}
		if request_id is not None:
			va_message["request_id"] = request_id
		await _ws_send_json(websocket, send_lock, va_message)
	except (WebSocketDisconnect, ConnectionClosed):
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			"Client disconnected before VA follow-up could be sent",
		)
	except Exception as err:
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			1,
			f"VA follow-up failed for interview {interview_id}: {err}",
		)


async def _process_stream_and_reply(
	websocket: WebSocket,
	send_lock: asyncio.Lock,
	audio_bytes: bytes,
	request_id: int | None = None,
	interview_id: str | None = None,
) -> None:
	"""Process one utterance and reply (responses stay in FIFO order per connection)."""
	try:
		if len(audio_bytes) < MIN_AUDIO_BYTES:
			NOTIFIER.send_notification(
				EnumMcs.MicroservicesNames.STS,
				1,
				f"Skipping short audio payload ({len(audio_bytes)} bytes)",
			)
			if request_id is not None:
				await _ws_send_json(
					websocket,
					send_lock,
					{
						"type": "error",
						"text": "Audio trop court. Parlez un peu plus longtemps.",
						"request_id": request_id,
					},
				)
			return

		result = await queue_service.submit(audio_bytes, interview_id=interview_id)

		if not result.transcription:
			payload: dict = {
				"type": "error",
				"text": "Aucune parole detectee dans l'audio. Reessayez.",
			}
			if request_id is not None:
				payload["request_id"] = request_id
			await _ws_send_json(websocket, send_lock, payload)
			return

		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"User: {result.transcription}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, f"AI: {result.ai_response[:100]}...")
		encoded_chunks = [base64.b64encode(chunk).decode("ascii") for chunk in result.audio_chunks]
		payload = {
			"type": "sts_result",
			"transcription": result.transcription,
			"response": result.ai_response,
			"audio_chunks": encoded_chunks,
		}
		if request_id is not None:
			payload["request_id"] = request_id

		# Send audio/transcription immediately. VA runs in the background and
		# arrives as a separate va_result frame; the C++ proxy forwards it when
		# the next STS read picks it up. VA failures never block the reply.
		await _ws_send_json(websocket, send_lock, payload)

		if interview_id and result.transcription:
			asyncio.create_task(
				_send_va_result_followup(
					websocket,
					send_lock,
					interview_id,
					result.transcription,
					request_id,
				),
			)
	except (WebSocketDisconnect, ConnectionClosed):
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending STS result")
	except Exception as tts_err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"STS response error: {tts_err}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, traceback.format_exc().strip())
		try:
			await _ws_send_json(
				websocket,
				send_lock,
				{
					"type": "warning",
					"text": "Erreur temporaire de synthese vocale. Reessayez.",
				},
			)
		except (WebSocketDisconnect, ConnectionClosed):
			NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected while sending STS warning")


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
	claims: WsSessionClaims | None = None
	should_continue, claims = await authenticate_websocket(websocket)
	if not should_continue:
		return

	await websocket.accept()
	NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "Client connected to the STS service")
	send_lock = asyncio.Lock()
	audio_queue: asyncio.Queue[tuple[int | None, str | None, bytes] | None] = asyncio.Queue()

	async def audio_worker() -> None:
		while True:
			item = await audio_queue.get()
			try:
				if item is None:
					return
				request_id, interview_id, audio_bytes = item
				await _process_stream_and_reply(
					websocket,
					send_lock,
					audio_bytes,
					request_id,
					interview_id,
				)
			finally:
				audio_queue.task_done()

	worker_task = asyncio.create_task(audio_worker())

	try:
		while True:
			try:
				message = await websocket.receive()
			except (WebSocketDisconnect, ConnectionClosed, RuntimeError):
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected")
				return
			audio_bytes = b""
			request_id: int | None = None
			interview_id: str | None = None

			if message.get("type") == "websocket.receive" and message.get("text") is not None:
				try:
					payload = json.loads(message["text"])
				except Exception:
					await _ws_send_json(websocket, send_lock, {"type": "error", "text": "Invalid JSON payload"})
					continue

				if payload.get("type") == "session_end":
					end_interview_id = payload.get("interview_id") or payload.get("stream_id")
					if isinstance(end_interview_id, str) and end_interview_id.strip():
						asyncio.create_task(
							asyncio.to_thread(finalize_session, end_interview_id.strip()),
						)
					await _ws_send_json(
						websocket,
						send_lock,
						{"type": "session_end_ack", "interview_id": end_interview_id},
					)
					continue

				if payload.get("type") == "ping":
					await _ws_send_json(
						websocket,
						send_lock,
						{
							"type": "pong",
							"key": payload.get("key", ""),
							"data": payload.get("data", {}),
						},
					)
					continue

				if payload.get("type") == "simulation_context":
					await _handle_simulation_context(websocket, send_lock, payload)
					continue

				if payload.get("type") == "stream_chunk":
					request_id = payload.get("request_id")
					interview_id = payload.get("interview_id")
					if isinstance(interview_id, str):
						interview_id = interview_id.strip() or None
					else:
						interview_id = None

					if not interview_id_allowed(claims, interview_id):
						await _ws_send_json(
							websocket,
							send_lock,
							{"type": "error", "text": "interview_id does not match session token"},
						)
						continue

					if request_id is not None and not isinstance(request_id, int):
						try:
							request_id = int(request_id)
						except (TypeError, ValueError):
							request_id = None

					chunk_data = payload.get("data", {})
					if isinstance(chunk_data, dict):
						audio_b64 = chunk_data.get("chunk", "")
					else:
						audio_b64 = chunk_data

					if not isinstance(audio_b64, str):
						err = {"type": "error", "text": "Missing audio payload"}
						if request_id is not None:
							err["request_id"] = request_id
						await _ws_send_json(websocket, send_lock, err)
						continue

					try:
						audio_bytes = base64.b64decode(audio_b64, validate=True)
					except (binascii.Error, ValueError):
						err = {"type": "error", "text": "Invalid base64 audio payload"}
						if request_id is not None:
							err["request_id"] = request_id
						await _ws_send_json(websocket, send_lock, err)
						continue
				else:
					await _ws_send_json(websocket, send_lock, {"type": "error", "text": "Unsupported message type"})
					continue
			elif message.get("type") == "websocket.receive" and message.get("bytes") is not None:
				audio_bytes = message["bytes"]
			else:
				continue

			if not audio_bytes:
				continue

			await audio_queue.put((request_id, interview_id, audio_bytes))

	except WebSocketDisconnect:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "Client disconnected")
	except Exception as err:
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, f"WebSocket error: {err}")
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 2, traceback.format_exc().strip())
		try:
			await websocket.close()
		except RuntimeError:
			pass
	finally:
		await audio_queue.put(None)
		await worker_task
