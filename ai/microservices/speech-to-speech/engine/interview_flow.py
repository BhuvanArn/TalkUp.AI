##
## Talkup Project, 2026
## TalkUp.AI
## Interview flow state and dynamic phase instructions.
##

from __future__ import annotations

import re
from dataclasses import dataclass
from threading import Lock

# ~15-20 min at ~40-50 s per exchange.
CLOSING_TURN_THRESHOLD = 22

MEMORY_INSTRUCTION = (
	"Consigne de coherence : tu as acces a l'historique complet de la conversation. "
	"Utilise-le pour enchainer logiquement : reprends le prenom et les elements deja "
	"mentionnes par le candidat, ne repose pas une question deja posee, "
	"ne contredis pas ce qui a ete dit, et rebondis sur sa derniere reponse "
	"avant de poser la suivante."
)

OPENING_TRIGGER = (
	"L'entretien commence. Le candidat vient de rejoindre la visioconference. "
	"Accueille-le chaleureusement avec un « Bonjour » (sans prenom — interdiction "
	"d'utiliser des crochets ou placeholders). Remercie-le pour sa presence, "
	"presente-toi brievement, presente l'entreprise et le poste, "
	"explique le deroulement (~15-20 minutes). "
	"IMPORTANT : ne pose AUCUNE question sur le parcours professionnel, "
	"l'experience ou les competences techniques. "
	"Ta seule question finale doit inviter le candidat a se presenter "
	"(par exemple : « Pour commencer, pourriez-vous vous presenter ? »)."
)

FAREWELL_ACK_TRIGGER = (
	"Le candidat vient de repondre a tes salutations de fin d'entretien. "
	"Remercie-le une derniere fois brievement et dis-lui au revoir. "
	"L'entretien est termine."
)

_NAME_ONLY_PATTERNS = (
	re.compile(
		r"^(?:bonjour|salut|hello|bonsoir)[,!.]?\s*(?:je\s+(?:m'appelle|m'|me\s+nomme)\s+)?"
		r"([a-zàâäéèêëïîôùûüç\-']+)[.!]?$",
		re.IGNORECASE,
	),
	re.compile(
		r"^(?:je\s+(?:m'appelle|m'|me\s+nomme)\s+)([a-zàâäéèêëïîôùûüç\-']+)[.!]?$",
		re.IGNORECASE,
	),
)

_EXPERIENCE_KEYWORDS = frozenset({
	"experience", "experiences", "travaille", "poste", "entreprise",
	"stage", "alternance", "diplome", "formation", "projet", "developpeur",
	"developpement", "ingenieur", "ans", "annee", "annees", "carriere", "parcours",
	"competence", "competences", "mission", "missions", "cdi", "cdd",
})

# Split on any non-letter so keywords are matched as whole words, not
# substrings. Without this, "ans" would match inside common words like
# "dans"/"sans" and wrongly flag a trivial reply as an experience intro.
_WORD_TOKEN_PATTERN = re.compile(r"[^a-zàâäéèêëïîôùûüç]+")


def _has_experience_keyword(normalized: str) -> bool:
	tokens = {tok for tok in _WORD_TOKEN_PATTERN.split(normalized) if tok}
	return not tokens.isdisjoint(_EXPERIENCE_KEYWORDS)


@dataclass
class InterviewFlowState:
	greeting_sent: bool = False
	farewell_sent: bool = False
	presentation_done: bool = False


class InterviewFlowStore:
	_lock = Lock()
	_sessions: dict[str, InterviewFlowState] = {}

	@classmethod
	def get(cls, interview_id: str) -> InterviewFlowState:
		with cls._lock:
			state = cls._sessions.get(interview_id)
			if state is None:
				state = InterviewFlowState()
				cls._sessions[interview_id] = state
			return state

	@classmethod
	def clear(cls, interview_id: str) -> None:
		with cls._lock:
			cls._sessions.pop(interview_id, None)


def count_user_turns(history: list[dict[str, str]]) -> int:
	return sum(
		1
		for turn in history
		if turn.get("role") == "user" and isinstance(turn.get("content"), str)
	)


def _normalize_text(text: str) -> str:
	decomposed = text.lower().strip()
	return re.sub(r"\s+", " ", decomposed)


def looks_like_name_only(text: str) -> bool:
	return _looks_like_name_only(text)


def _looks_like_name_only(text: str) -> bool:
	normalized = _normalize_text(text)
	if len(normalized.split()) > 12:
		return False

	for pattern in _NAME_ONLY_PATTERNS:
		if pattern.match(normalized):
			return True

	if len(normalized.split()) <= 6 and not _has_experience_keyword(normalized):
		return True

	return False


def _user_has_substantial_intro(text: str) -> bool:
	normalized = _normalize_text(text)
	if len(normalized.split()) >= 20:
		return True
	return _has_experience_keyword(normalized)


def mark_presentation_done(interview_id: str, user_text: str) -> None:
	if _user_has_substantial_intro(user_text) or (
		not _looks_like_name_only(user_text) and len(_normalize_text(user_text).split()) >= 10
	):
		state = InterviewFlowStore.get(interview_id)
		state.presentation_done = True


def get_phase_instruction(
	user_turn_count: int,
	presentation_done: bool,
	latest_user_text: str = "",
) -> str:
	if user_turn_count <= 0:
		return ""

	if not presentation_done:
		if _looks_like_name_only(latest_user_text):
			return (
				"Phase actuelle : PRESENTATION. Le candidat vient de donner son prenom "
				"ou une presentation tres breve. Remercie-le chaleureusement, "
				"utilise son prenom, et invite-le a se presenter un peu plus "
				"(qui il est, sa formation, sa situation actuelle en quelques phrases). "
				"Ne pose pas encore de questions sur le detail de ses experiences professionnelles."
			)
		return (
			"Phase actuelle : PRESENTATION. Le candidat est en train de se presenter. "
			"Rebondis sur ce qu'il vient de dire. Si sa presentation est incomplete, "
			"pose une question de relance douce pour en savoir plus sur lui. "
			"N'abord pas encore les experiences professionnelles en detail."
		)

	if user_turn_count <= 6:
		return (
			"Phase actuelle : PARCOURS. Le candidat s'est presente. "
			"Explore maintenant ses experiences passees, formations et evolutions de carriere. "
			"Pose des questions de suivi sur ses reponses."
		)
	if user_turn_count <= 12:
		return (
			"Phase actuelle : COMPETENCES. Pose des questions techniques ou metier "
			"adaptees au poste. Challenge gentiment avec des cas concrets."
		)
	if user_turn_count <= 16:
		return (
			"Phase actuelle : MOTIVATION. Explore les motivations du candidat, "
			"son projet professionnel et ses soft skills."
		)
	if user_turn_count <= 20:
		return (
			"Phase actuelle : ECHANGE. Propose au candidat de poser ses questions "
			"sur le poste, l'equipe ou l'entreprise."
		)
	return (
		"Phase actuelle : CONCLUSION. Prepare la fin de l'entretien : "
		"resume brievement, remercie le candidat et annonce les prochaines etapes."
	)


def get_turn_instruction(
	history: list[dict[str, str]],
	user_turn_count: int,
	latest_user_text: str,
	farewell_sent: bool,
	presentation_done: bool,
) -> str:
	if farewell_sent:
		return f"{MEMORY_INSTRUCTION}\n\n{FAREWELL_ACK_TRIGGER}"
	if user_turn_count >= CLOSING_TURN_THRESHOLD:
		return (
			f"{MEMORY_INSTRUCTION}\n\n"
			"C'est le moment de conclure l'entretien. Remercie le candidat pour son temps, "
			"resume brievement les prochaines etapes du processus de recrutement "
			"et dis-lui au revoir chaleureusement."
		)
	phase = get_phase_instruction(user_turn_count, presentation_done, latest_user_text)
	return f"{MEMORY_INSTRUCTION}\n\n{phase}"
