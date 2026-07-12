"""STT transcription quality checks — subtitle hallucinations and gibberish."""

from __future__ import annotations

import re
import unicodedata

_HALLUCINATION_PHRASES: frozenset[str] = frozenset({
	"merci", "merci a vous", "merci beaucoup", "merci a tous",
	"merci d'avoir regarde", "merci d'avoir regarde cette video",
	"sous-titres realises par la communaute d'amara.org",
	"sous-titres realises par", "sous-titrage realise par",
	"sous-titrage st 501", "sous titrage st 501",
	"abonnez-vous", "n'oubliez pas de vous abonner et de liker",
	"au revoir", "a bientot", "a la prochaine", "a plus",
	"c'est la fin de la video", "merci d'avoir ecoute",
})

_HALLUCINATION_SUBSTRINGS: tuple[str, ...] = (
	"sous-titr",
	"sous titr",
	"amara.org",
	"amara",
	"st 501",
	"st'501",
	"subtitles",
	"subtitle",
	"community d'amara",
	"communaute d'amara",
	"realise par la communaute",
	"realises par la communaute",
)

_HALLUCINATION_RE = re.compile(
	r"sous[- ]?titres?|sous[- ]?titrage|subtitles?|amara\.org|\bst['']?\s*501\b",
	re.IGNORECASE,
)

REPEAT_PROMPT = (
	"Je ne vous ai pas bien compris. "
	"Pourriez-vous reformuler ou répéter, s'il vous plaît ?"
)


def normalize_for_match(text: str) -> str:
	decomposed = unicodedata.normalize("NFKD", text).lower().strip()
	stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
	cleaned = re.sub(r"[^a-z0-9'\- .]", "", stripped)
	return cleaned.strip(" .")


def contains_hallucination_pattern(text: str) -> bool:
	cleaned = normalize_for_match(text)
	if not cleaned:
		return True
	if cleaned in _HALLUCINATION_PHRASES:
		return True
	if _HALLUCINATION_RE.search(cleaned):
		return True
	return any(sub in cleaned for sub in _HALLUCINATION_SUBSTRINGS)


def is_obvious_hallucination(text: str) -> bool:
	return contains_hallucination_pattern(text)


def validate_transcription(text: str) -> tuple[bool, str]:
	cleaned = normalize_for_match(text)
	if len(cleaned) < 2:
		return False, "too_short"

	if is_obvious_hallucination(text):
		return False, "hallucination"

	words = cleaned.split()
	if len(words) >= 3 and len(set(words)) == 1:
		return False, "repetition"

	letters = sum(ch.isalpha() for ch in cleaned)
	non_space = sum(1 for ch in cleaned if not ch.isspace())
	if non_space > 0 and letters / non_space < 0.45:
		return False, "low_quality"

	if cleaned in _HALLUCINATION_PHRASES and len(words) <= 4:
		return False, "hallucination"

	return True, ""


def should_drop_segment_text(
	text: str,
	*,
	no_speech_prob: float = 0.0,
	avg_logprob: float = 0.0,
	no_speech_prob_max: float = 0.6,
	avg_logprob_min: float = -1.0,
) -> bool:
	cleaned = normalize_for_match(text)
	if not cleaned:
		return True

	if is_obvious_hallucination(text):
		return True

	if no_speech_prob >= no_speech_prob_max and avg_logprob <= avg_logprob_min:
		return True

	if cleaned in _HALLUCINATION_PHRASES and no_speech_prob >= 0.5:
		return True

	if contains_hallucination_pattern(text) and no_speech_prob >= 0.35:
		return True

	return False
