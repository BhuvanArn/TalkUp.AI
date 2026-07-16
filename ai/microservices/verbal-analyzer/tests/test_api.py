##
## Talkup Project, 2026
## TalkUp.AI
## API tests for Verbal Analyzer.
##

from __future__ import annotations

import os

# Settings are loaded at import time; set the key before importing the app.
os.environ["SIM_INTERNAL_API_KEY"] = "test-internal-key"

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Api-Key": "test-internal-key"}


def test_health() -> None:
	resp = client.get("/health")
	assert resp.status_code == 200
	assert resp.json()["status"] == "ok"


def test_analyze_turn_requires_api_key() -> None:
	resp = client.post(
		"/analyze-turn",
		json={
			"interview_id": "api-test-1",
			"transcription": "Bonjour.",
			"language": "French",
		},
	)
	assert resp.status_code == 401


def test_analyze_turn_endpoint() -> None:
	resp = client.post(
		"/analyze-turn",
		headers=AUTH_HEADERS,
		json={
			"interview_id": "api-test-1",
			"transcription": "Bonjour, merci. J'ai une solide expérience en développement.",
			"language": "French",
		},
	)
	assert resp.status_code == 200
	data = resp.json()
	assert data["interview_id"] == "api-test-1"
	assert "turn" in data
	assert "aggregate" in data
	assert data["turn"]["overall_score"] >= 0


def test_finalize_unknown_session() -> None:
	resp = client.post("/sessions/unknown-session/finalize", headers=AUTH_HEADERS)
	assert resp.status_code == 404


def test_finalize_requires_api_key() -> None:
	resp = client.post("/sessions/unknown-session/finalize")
	assert resp.status_code == 401
