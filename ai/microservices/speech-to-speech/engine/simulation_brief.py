##
## Talkup Project, 2026
## TalkUp.AI
## Per-session simulation brief (company, job offer) for LLM system prompt.
##

from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Any

from .enumMcs import EnumMcs
from .notifications import Notifications

NOTIFIER = Notifications()

BASE_RECRUITER_PERSONA = (
	"Tu es Sophie Martin, recruteuse senior IT chez une ESN francaise. "
	"Tu es chaleureuse, professionnelle, patiente et humaine. "
	"Tu parles de facon naturelle comme dans une vraie conversation. "
	"Tu dois repondre uniquement a la derniere prise de parole du candidat, "
	"en une seule reponse courte et naturelle. "
	"N'ecris jamais un dialogue multi-tours, n'imite jamais des balises comme system: ou user:, "
	"et ne recopie jamais l'historique de conversation."
)


@dataclass
class SimulationBrief:
	company_name: str | None = None
	company_description: str | None = None
	job_title: str | None = None
	job_description: str | None = None
	job_requirements: str | None = None
	additional_info: str | None = None
	language: str | None = None
	interview_type: str | None = None

	@classmethod
	def from_payload(cls, data: dict[str, Any]) -> SimulationBrief:
		company = data.get("company") if isinstance(data.get("company"), dict) else {}
		job_offer = data.get("jobOffer") if isinstance(data.get("jobOffer"), dict) else {}

		legacy_context = data.get("jobContext")
		additional = data.get("additionalInfo")
		if isinstance(legacy_context, str) and legacy_context.strip():
			additional = (
				f"{additional}\n{legacy_context}".strip()
				if isinstance(additional, str) and additional.strip()
				else legacy_context.strip()
			)

		return cls(
			company_name=_optional_str(company.get("name")),
			company_description=_optional_str(company.get("description")),
			job_title=_optional_str(job_offer.get("title")),
			job_description=_optional_str(job_offer.get("description")),
			job_requirements=_optional_str(job_offer.get("requirements")),
			additional_info=_optional_str(additional),
			language=_optional_str(data.get("language")),
			interview_type=_optional_str(data.get("interviewType") or data.get("type")),
		)

	def is_empty(self) -> bool:
		return not any(
			[
				self.company_name,
				self.company_description,
				self.job_title,
				self.job_description,
				self.job_requirements,
				self.additional_info,
			],
		)


@dataclass
class _SessionState:
	brief: SimulationBrief
	history: list[dict[str, str]] = field(default_factory=list)


class SimulationBriefStore:
	"""In-memory session store (Scenario A — IA stack, one process STS)."""

	_lock = Lock()
	_sessions: dict[str, _SessionState] = {}

	@classmethod
	def register(cls, interview_id: str, brief: SimulationBrief) -> None:
		with cls._lock:
			existing = cls._sessions.get(interview_id)
			history = existing.history if existing else []
			cls._sessions[interview_id] = _SessionState(brief=brief, history=history)
		NOTIFIER.send_notification(
			EnumMcs.MicroservicesNames.STS,
			0,
			f"Simulation brief registered for interview {interview_id}",
		)

	@classmethod
	def get(cls, interview_id: str) -> _SessionState | None:
		with cls._lock:
			return cls._sessions.get(interview_id)

	@classmethod
	def append_turn(cls, interview_id: str, user_text: str, assistant_text: str) -> None:
		with cls._lock:
			state = cls._sessions.get(interview_id)
			if state is None:
				return
			state.history.append({"role": "user", "content": user_text})
			state.history.append({"role": "assistant", "content": assistant_text})
			if len(state.history) > 60:
				state.history = state.history[-60:]

	@classmethod
	def clear(cls, interview_id: str) -> None:
		with cls._lock:
			cls._sessions.pop(interview_id, None)


def _optional_str(value: Any) -> str | None:
	if not isinstance(value, str):
		return None
	stripped = value.strip()
	return stripped if stripped else None


def build_system_prompt_from_brief(brief: SimulationBrief, fallback: str) -> str:
	if brief.is_empty() and not brief.language and not brief.interview_type:
		return fallback

	sections: list[str] = [BASE_RECRUITER_PERSONA]

	if brief.language:
		sections.append(f"\nLangue de l'entretien: {brief.language}.")
	if brief.interview_type:
		sections.append(f"Type de simulation: {brief.interview_type}.")

	if brief.company_name or brief.company_description:
		sections.append("\n## Entreprise")
		if brief.company_name:
			sections.append(f"Nom: {brief.company_name}")
		if brief.company_description:
			sections.append(brief.company_description)

	if brief.job_title or brief.job_description or brief.job_requirements:
		sections.append("\n## Offre d'emploi")
		if brief.job_title:
			sections.append(f"Intitule: {brief.job_title}")
		if brief.job_description:
			sections.append(brief.job_description)
		if brief.job_requirements:
			sections.append(f"Competences / exigences: {brief.job_requirements}")

	if brief.additional_info:
		sections.append(f"\n## Informations complementaires\n{brief.additional_info}")

	sections.append(
		"\nConsigne: utilise ce contexte pour poser des questions pertinentes et realistes. "
		"Ne recite pas l'integralite du CV ou de l'offre d'un seul coup."
	)

	return "\n".join(sections)


def build_messages_for_turn(
	default_system_prompt: str,
	interview_id: str | None,
	user_text: str,
) -> list[dict[str, str]]:
	from .session_context import build_messages_from_nest_session, fetch_session_context

	if interview_id:
		state = SimulationBriefStore.get(interview_id)
		if state is not None:
			system_prompt = build_system_prompt_from_brief(state.brief, default_system_prompt)
			messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
			for turn in state.history:
				role = turn.get("role")
				content = turn.get("content")
				if role in ("user", "assistant") and isinstance(content, str) and content.strip():
					messages.append({"role": role, "content": content})
			messages.append({"role": "user", "content": user_text})
			return messages

		nest_session = fetch_session_context(interview_id)
		if nest_session is not None:
			return build_messages_from_nest_session(default_system_prompt, nest_session, user_text)

	return [
		{"role": "system", "content": default_system_prompt},
		{"role": "user", "content": user_text},
	]
