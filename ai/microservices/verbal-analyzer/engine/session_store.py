##
## Talkup Project, 2026
## TalkUp.AI
## In-memory per-session store for Verbal Analyzer.
##

from __future__ import annotations

import time
from dataclasses import dataclass, field
from threading import Lock

from .analyzer import analyze_turn, build_session_aggregate
from .schemas import (
	AnalyzeTurnRequest,
	SessionAggregate,
	SessionSummary,
	TurnAnalysis,
	VerbalAnalysisResult,
)


@dataclass
class _SessionState:
	interview_id: str
	user_id: str | None = None
	turn_analyses: list[TurnAnalysis] = field(default_factory=list)
	transcriptions: list[str] = field(default_factory=list)
	last_access: float = field(default_factory=time.time)


class SessionStore:
	"""Thread-safe in-memory store isolated by interview_id."""

	def __init__(self, ttl_sec: int = 7200, history_max_turns: int = 30) -> None:
		self._ttl_sec = ttl_sec
		self._history_max_turns = history_max_turns
		self._lock = Lock()
		self._sessions: dict[str, _SessionState] = {}

	def _purge_expired(self) -> None:
		now = time.time()
		expired = [
			sid
			for sid, state in self._sessions.items()
			if now - state.last_access > self._ttl_sec
		]
		for sid in expired:
			self._sessions.pop(sid, None)

	def clear(self, interview_id: str) -> bool:
		with self._lock:
			return self._sessions.pop(interview_id, None) is not None

	def active_session_count(self) -> int:
		with self._lock:
			self._purge_expired()
			return len(self._sessions)

	def analyze_turn(self, request: AnalyzeTurnRequest) -> VerbalAnalysisResult:
		with self._lock:
			self._purge_expired()
			state = self._sessions.get(request.interview_id)
			if state is None:
				state = _SessionState(
					interview_id=request.interview_id,
					user_id=request.user_id,
				)
				self._sessions[request.interview_id] = state

			state.last_access = time.time()
			if request.user_id:
				state.user_id = request.user_id

			turn_analysis = analyze_turn(request.transcription, request.job_context)
			state.turn_analyses.append(turn_analysis)
			state.transcriptions.append(request.transcription)

			if len(state.turn_analyses) > self._history_max_turns:
				state.turn_analyses = state.turn_analyses[-self._history_max_turns :]
				state.transcriptions = state.transcriptions[-self._history_max_turns :]

			turn_index = (
				request.turn_index
				if request.turn_index is not None
				else len(state.turn_analyses)
			)
			aggregate = build_session_aggregate(state.turn_analyses)

		return VerbalAnalysisResult(
			interview_id=request.interview_id,
			request_id=request.request_id,
			turn_index=turn_index,
			turn=turn_analysis,
			aggregate=aggregate,
		)

	def finalize(self, interview_id: str) -> SessionSummary | None:
		with self._lock:
			state = self._sessions.pop(interview_id, None)
			if state is None:
				return None

			aggregate = build_session_aggregate(state.turn_analyses)
			turns = [
				{
					"transcription": text,
					"analysis": analysis.model_dump(),
				}
				for text, analysis in zip(state.transcriptions, state.turn_analyses)
			]

		return SessionSummary(
			interview_id=interview_id,
			aggregate=aggregate,
			turns=turns,
		)

	def get_aggregate(self, interview_id: str) -> SessionAggregate | None:
		with self._lock:
			state = self._sessions.get(interview_id)
			if state is None:
				return None
			state.last_access = time.time()
			return build_session_aggregate(state.turn_analyses)
