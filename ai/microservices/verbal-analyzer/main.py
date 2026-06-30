##
## Talkup Project, 2026
## TalkUp.AI
## Verbal Analyzer FastAPI application.
##

from __future__ import annotations

import asyncio
import json
import time
import urllib.error
import urllib.request
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from engine.schemas import AnalyzeTurnRequest, SessionSummary, VerbalAnalysisResult
from engine.session_store import SessionStore
from engine.settings import load_settings

settings = load_settings()
session_store = SessionStore(
	ttl_sec=settings.session_ttl_sec,
	history_max_turns=settings.history_max_turns,
)

_analysis_queue: asyncio.Queue[AnalyzeTurnRequest | None] | None = None
_metrics: dict[str, int] = {
	"analyses_total": 0,
	"analyses_errors": 0,
	"queue_rejected": 0,
}


def _persist_summary_to_backend(summary: SessionSummary) -> None:
	key = settings.internal_api_key
	if not key:
		return

	url = f"{settings.backend_url}/ai/internal/sessions/{summary.interview_id}/verbal-analysis"
	payload = json.dumps(
		{
			"aggregate": summary.aggregate.model_dump(),
			"turns": summary.turns,
		},
	).encode("utf-8")
	req = urllib.request.Request(
		url,
		data=payload,
		headers={
			"X-Internal-Api-Key": key,
			"Content-Type": "application/json",
		},
		method="POST",
	)
	try:
		with urllib.request.urlopen(req, timeout=10) as resp:
			resp.read()
	except urllib.error.HTTPError as err:
		print(f"[VA] Backend persist HTTP {err.code} for {summary.interview_id}")
	except Exception as err:
		print(f"[VA] Backend persist failed for {summary.interview_id}: {err}")


async def _analysis_worker() -> None:
	assert _analysis_queue is not None
	while True:
		item = await _analysis_queue.get()
		try:
			if item is None:
				return
			start = time.perf_counter()
			result = await asyncio.to_thread(session_store.analyze_turn, item)
			_metrics["analyses_total"] += 1
			elapsed_ms = int((time.perf_counter() - start) * 1000)
			if elapsed_ms > 500:
				print(f"[VA] Slow analysis {elapsed_ms}ms interview={item.interview_id}")
		except Exception:
			_metrics["analyses_errors"] += 1
		finally:
			_analysis_queue.task_done()


@asynccontextmanager
async def lifespan(app: FastAPI):
	global _analysis_queue
	_analysis_queue = asyncio.Queue(maxsize=settings.queue_maxsize)
	worker = asyncio.create_task(_analysis_worker())
	yield
	await _analysis_queue.put(None)
	await worker


app = FastAPI(title="TalkUp Verbal Analyzer", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, Any]:
	return {
		"status": "ok",
		"active_sessions": session_store.active_session_count(),
		"metrics": _metrics,
	}


@app.post("/analyze-turn", response_model=VerbalAnalysisResult)
async def analyze_turn_endpoint(request: AnalyzeTurnRequest) -> VerbalAnalysisResult:
	if len(request.transcription) > settings.max_transcription_chars:
		raise HTTPException(
			status_code=413,
			detail=f"transcription exceeds {settings.max_transcription_chars} characters",
		)

	start = time.perf_counter()
	try:
		result = await asyncio.to_thread(session_store.analyze_turn, request)
		_metrics["analyses_total"] += 1
		return result
	except Exception as err:
		_metrics["analyses_errors"] += 1
		raise HTTPException(status_code=500, detail=str(err)) from err
	finally:
		elapsed_ms = int((time.perf_counter() - start) * 1000)
		if elapsed_ms > 500:
			print(f"[VA] Slow /analyze-turn {elapsed_ms}ms interview={request.interview_id}")


@app.post("/sessions/{interview_id}/finalize", response_model=SessionSummary)
async def finalize_session(interview_id: str) -> SessionSummary:
	summary = await asyncio.to_thread(session_store.finalize, interview_id)
	if summary is None:
		raise HTTPException(status_code=404, detail="Session not found")
	await asyncio.to_thread(_persist_summary_to_backend, summary)
	return summary


@app.delete("/sessions/{interview_id}")
async def clear_session(interview_id: str) -> dict[str, bool]:
	cleared = await asyncio.to_thread(session_store.clear, interview_id)
	return {"cleared": cleared}


@app.websocket("/ws/va")
async def websocket_va(websocket: WebSocket) -> None:
	await websocket.accept()
	try:
		while True:
			raw = await websocket.receive_text()
			try:
				payload = json.loads(raw)
			except json.JSONDecodeError:
				await websocket.send_json({"type": "error", "text": "Invalid JSON"})
				continue

			if payload.get("type") == "ping":
				await websocket.send_json({"type": "pong", "status": "active"})
				continue

			if payload.get("type") != "analyze_turn":
				await websocket.send_json({"type": "error", "text": "Unsupported message type"})
				continue

			try:
				request = AnalyzeTurnRequest(**payload.get("data", payload))
			except ValidationError as err:
				await websocket.send_json({"type": "error", "text": str(err)})
				continue

			result = await analyze_turn_endpoint(request)
			await websocket.send_json(
				{
					"type": "va_result",
					"interview_id": result.interview_id,
					"request_id": result.request_id,
					"data": result.model_dump(),
				},
			)
	except WebSocketDisconnect:
		pass


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host=settings.host, port=settings.port)
