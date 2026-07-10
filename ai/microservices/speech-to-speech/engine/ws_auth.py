##
## Talkup Project, 2026
## TalkUp.AI
## WebSocket JWT validation for STS (simulation_ws tokens from NestJS).
##

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs

import jwt
from fastapi import WebSocket


@dataclass(frozen=True)
class WsSessionClaims:
	interview_id: str
	user_id: str
	purpose: str


def _jwt_secret() -> str | None:
	secret = os.environ.get("JWT_SECRET", "").strip()
	return secret or None


def _auth_required() -> bool:
	raw = os.environ.get("STS_WS_AUTH_REQUIRED", "true").strip().lower()
	return raw not in ("0", "false", "no", "off")


def extract_token_from_scope(scope: dict[str, Any]) -> str | None:
	query_string = scope.get("query_string", b"")
	if isinstance(query_string, bytes):
		query_string = query_string.decode("utf-8", errors="ignore")
	params = parse_qs(query_string)
	tokens = params.get("token")
	if tokens and tokens[0].strip():
		return tokens[0].strip()
	return None


def verify_ws_token(token: str) -> WsSessionClaims | None:
	secret = _jwt_secret()
	if not secret:
		return None

	try:
		payload = jwt.decode(token, secret, algorithms=["HS256"])
	except jwt.PyJWTError:
		return None

	if payload.get("purpose") != "simulation_ws":
		return None

	interview_id = payload.get("interviewId")
	user_id = payload.get("userId")
	if not isinstance(interview_id, str) or not interview_id.strip():
		return None
	if not isinstance(user_id, str) or not user_id.strip():
		return None

	return WsSessionClaims(
		interview_id=interview_id.strip(),
		user_id=user_id.strip(),
		purpose="simulation_ws",
	)


async def authenticate_websocket(
	websocket: WebSocket,
) -> tuple[bool, WsSessionClaims | None]:
	"""
	Returns (should_continue, claims).
	When should_continue is False, the socket was rejected and must not be accepted.
	"""
	if not _auth_required():
		return True, None

	secret = _jwt_secret()
	if not secret:
		# Fail closed: auth is explicitly required but no JWT_SECRET is
		# configured. Accepting here would silently bypass authentication, so
		# reject instead and surface the misconfiguration. To run without auth,
		# set STS_WS_AUTH_REQUIRED=false explicitly.
		print(
			"[ws_auth] STS_WS_AUTH_REQUIRED is on but JWT_SECRET is empty; "
			"rejecting connection. Set JWT_SECRET, or disable auth explicitly "
			"with STS_WS_AUTH_REQUIRED=false.",
			flush=True,
		)
		await websocket.close(code=4401, reason="WebSocket auth misconfigured")
		return False, None

	token = extract_token_from_scope(websocket.scope)
	if not token:
		await websocket.close(code=4401, reason="Missing WebSocket token")
		return False, None

	claims = verify_ws_token(token)
	if claims is None:
		await websocket.close(code=4403, reason="Invalid WebSocket token")
		return False, None

	return True, claims


def interview_id_allowed(claims: WsSessionClaims | None, interview_id: str | None) -> bool:
	if claims is None:
		return True
	if not interview_id:
		return True
	return interview_id.strip() == claims.interview_id
