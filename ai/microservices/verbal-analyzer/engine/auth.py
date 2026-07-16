##
## Talkup Project, 2026
## TalkUp.AI
## Internal API key guard for Verbal Analyzer HTTP routes.
##

from __future__ import annotations

from fastapi import Header, HTTPException, WebSocket, status

from .settings import VASettings


def build_internal_api_key_checker(settings: VASettings):
	"""Return a FastAPI dependency that validates X-Internal-Api-Key."""

	async def require_internal_api_key(
		x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
	) -> None:
		expected = settings.internal_api_key
		if not expected:
			raise HTTPException(
				status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
				detail="Internal API is not configured.",
			)
		provided = (x_internal_api_key or "").strip()
		if not provided or provided != expected:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid internal API key.",
			)

	return require_internal_api_key


def websocket_has_valid_internal_api_key(
	websocket: WebSocket,
	settings: VASettings,
) -> bool:
	expected = settings.internal_api_key
	if not expected:
		return False
	provided = websocket.headers.get("x-internal-api-key", "").strip()
	return provided == expected
