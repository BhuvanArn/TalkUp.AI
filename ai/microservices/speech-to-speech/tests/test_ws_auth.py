##
## Talkup Project, 2026
## TalkUp.AI
## STS WebSocket auth tests.
##

from __future__ import annotations

import os
import time

import jwt
import pytest

from engine.ws_auth import (
	interview_id_allowed,
	verify_ws_token,
)


@pytest.fixture
def jwt_secret(monkeypatch: pytest.MonkeyPatch) -> str:
	secret = "test-secret-key"
	monkeypatch.setenv("JWT_SECRET", secret)
	return secret


def test_verify_ws_token_valid(jwt_secret: str) -> None:
	token = jwt.encode(
		{
			"purpose": "simulation_ws",
			"interviewId": "int-abc",
			"userId": "user-1",
			"exp": int(time.time()) + 3600,
		},
		jwt_secret,
		algorithm="HS256",
	)
	claims = verify_ws_token(token)
	assert claims is not None
	assert claims.interview_id == "int-abc"
	assert claims.user_id == "user-1"


def test_verify_ws_token_wrong_purpose(jwt_secret: str) -> None:
	token = jwt.encode(
		{"purpose": "other", "interviewId": "x", "userId": "y"},
		jwt_secret,
		algorithm="HS256",
	)
	assert verify_ws_token(token) is None


def test_interview_id_allowed() -> None:
	from engine.ws_auth import WsSessionClaims

	claims = WsSessionClaims("int-1", "user-1", "simulation_ws")
	assert interview_id_allowed(claims, "int-1") is True
	assert interview_id_allowed(claims, "int-2") is False
	assert interview_id_allowed(None, "int-2") is True
