##
## Talkup Project, 2026
## TalkUp.AI
## Rules-based verbal analysis engine (offline, free).
##

from __future__ import annotations

import re
import unicodedata
from collections import Counter

from .schemas import (
	JobContext,
	SessionAggregate,
	TurnAnalysis,
	TurnMetrics,
)
from .word_lists import (
	FILLER_WORDS,
	IMPOLITE_WORDS,
	INFORMAL_WORDS,
	IT_JOB_KEYWORDS,
	OVERLY_FORMAL_WORDS,
	POLITENESS_MARKERS,
	PROFESSIONAL_WORDS,
	TIC_EXPRESSIONS,
)

_WORD_RE = re.compile(r"[a-zàâäéèêëïîôùûüçœæ0-9'-]+", re.IGNORECASE)
_SENTENCE_SPLIT_RE = re.compile(r"[.!?…]+")


def _normalize(text: str) -> str:
	return unicodedata.normalize("NFKC", text).lower().strip()


def _tokenize(text: str) -> list[str]:
	return _WORD_RE.findall(_normalize(text))


def _count_phrase_occurrences(text: str, phrases: frozenset[str]) -> tuple[int, list[str]]:
	normalized = _normalize(text)
	found: list[str] = []
	count = 0
	for phrase in sorted(phrases, key=len, reverse=True):
		pattern = re.escape(phrase)
		matches = re.findall(pattern, normalized)
		if matches:
			count += len(matches)
			found.append(phrase)
	return count, found


def _count_word_occurrences(tokens: list[str], words: frozenset[str]) -> int:
	return sum(1 for token in tokens if token in words)


def _detect_repeated_phrases(tokens: list[str], min_len: int = 3) -> int:
	if len(tokens) < min_len * 2:
		return 0
	grams = [" ".join(tokens[i : i + min_len]) for i in range(len(tokens) - min_len + 1)]
	counts = Counter(grams)
	return sum(c - 1 for c in counts.values() if c > 1)


def _sentence_count(text: str) -> int:
	parts = [p.strip() for p in _SENTENCE_SPLIT_RE.split(text) if p.strip()]
	return max(1, len(parts))


# A non-professional register should visibly drag the overall score down so it
# reflects how appropriate the answer is for a job interview, not only fluency.
_REGISTER_OVERALL_PENALTY: dict[str, int] = {
	"inappropriate": 35,
	"informal": 18,
	"mixed": 8,
	"professional": 0,
	"neutral": 0,
}


def _classify_register(
	informal: int,
	impolite: int,
	overly_formal: int,
	professional: int,
) -> str:
	if impolite > 0:
		return "inappropriate"
	if informal >= 1 and professional == 0:
		return "informal"
	if informal > 0 and (professional > 0 or overly_formal > 0):
		return "mixed"
	if overly_formal >= 2 and informal == 0:
		return "professional"
	if professional >= 1:
		return "professional"
	return "neutral"


def _score_clarity(word_count: int, sentence_count: int, filler_count: int, repeated: int) -> int:
	if word_count == 0:
		return 0
	avg_len = word_count / sentence_count
	length_penalty = 0
	if avg_len > 35:
		length_penalty = min(25, int((avg_len - 35) * 1.5))
	elif avg_len < 4:
		length_penalty = 15
	filler_penalty = min(30, filler_count * 8)
	repeat_penalty = min(20, repeated * 10)
	return max(0, min(100, 100 - length_penalty - filler_penalty - repeat_penalty))


def _score_politeness(politeness: int, impolite: int, informal: int) -> int:
	base = 70 + politeness * 10 - impolite * 25 - informal * 5
	return max(0, min(100, base))


def _score_vocabulary(
	professional: int,
	job_keywords: int,
	lexical_richness: float,
	overly_formal: int,
	informal: int,
) -> int:
	base = 50 + professional * 6 + job_keywords * 5 + int(lexical_richness * 30)
	base -= overly_formal * 4
	base -= informal * 6
	return max(0, min(100, base))


def _build_advice(
	register: str,
	metrics: TurnMetrics,
	detected_tics: list[str],
	detected_fillers: list[str],
) -> tuple[list[str], list[str]]:
	warnings: list[str] = []
	advice: list[str] = []

	if metrics.impolite_count > 0:
		warnings.append("Expressions inadaptées détectées pour un entretien professionnel.")
		advice.append("Évitez tout langage grossier ou dévalorisant.")

	if metrics.informal_count >= 1:
		warnings.append("Registre trop familier pour un entretien d'embauche.")
		advice.append("Privilégiez un ton professionnel sans être pompeux.")

	if metrics.overly_formal_count >= 2:
		warnings.append("Vocabulaire parfois trop soutenu ou distant.")
		advice.append("Simplifiez vos formulations pour paraître plus naturel.")

	if metrics.filler_word_count >= 2:
		warnings.append("Nombreux mots de remplissage détectés.")
		advice.append("Faites une courte pause plutôt que d'utiliser « euh », « genre », etc.")

	if detected_tics:
		warnings.append(f"Tics de langage: {', '.join(detected_tics[:3])}.")
		advice.append("Variez vos tournures pour limiter les expressions répétitives.")

	if metrics.repeated_phrase_count > 0:
		warnings.append("Répétitions de formulations détectées.")
		advice.append("Reformulez pour éviter de répéter les mêmes groupes de mots.")

	if metrics.professional_word_count == 0 and metrics.word_count >= 8:
		advice.append("Intégrez davantage de vocabulaire lié à vos compétences et expériences.")

	if register == "professional" and not warnings:
		advice.append("Bon registre professionnel, continuez ainsi.")

	if not advice:
		advice.append("Réponse claire et adaptée au contexte d'entretien.")

	return warnings, advice


def analyze_turn(
	transcription: str,
	job_context: JobContext | None = None,
) -> TurnAnalysis:
	tokens = _tokenize(transcription)
	word_count = len(tokens)
	unique_words = len(set(tokens))
	sentence_count = _sentence_count(transcription)
	lexical_richness = unique_words / word_count if word_count else 0.0

	filler_count, detected_fillers = _count_phrase_occurrences(transcription, FILLER_WORDS)
	tic_count, detected_tics = _count_phrase_occurrences(transcription, TIC_EXPRESSIONS)
	informal_count = _count_word_occurrences(tokens, INFORMAL_WORDS)
	impolite_count = _count_word_occurrences(tokens, IMPOLITE_WORDS)
	overly_formal_count, _ = _count_phrase_occurrences(transcription, OVERLY_FORMAL_WORDS)
	politeness_count, _ = _count_phrase_occurrences(transcription, POLITENESS_MARKERS)
	professional_count = _count_word_occurrences(tokens, PROFESSIONAL_WORDS)
	job_keyword_count = _count_word_occurrences(tokens, IT_JOB_KEYWORDS)

	if job_context and job_context.requirements:
		req_tokens = set(_tokenize(job_context.requirements))
		job_keyword_count += sum(1 for t in tokens if t in req_tokens and len(t) > 3)

	repeated_phrase_count = _detect_repeated_phrases(tokens)

	metrics = TurnMetrics(
		filler_word_count=filler_count,
		tic_count=tic_count,
		informal_count=informal_count,
		impolite_count=impolite_count,
		overly_formal_count=overly_formal_count,
		politeness_count=politeness_count,
		professional_word_count=professional_count,
		job_keyword_count=job_keyword_count,
		repeated_phrase_count=repeated_phrase_count,
		word_count=word_count,
		sentence_count=sentence_count,
		avg_sentence_length=round(word_count / sentence_count, 1) if sentence_count else 0.0,
		lexical_richness=round(lexical_richness, 2),
	)

	register = _classify_register(
		informal_count,
		impolite_count,
		overly_formal_count,
		professional_count,
	)

	clarity = _score_clarity(word_count, sentence_count, filler_count, repeated_phrase_count)
	politeness = _score_politeness(politeness_count, impolite_count, informal_count)
	vocabulary = _score_vocabulary(
		professional_count,
		job_keyword_count,
		lexical_richness,
		overly_formal_count,
		informal_count,
	)
	overall = int(round((clarity + politeness + vocabulary) / 3))
	overall = max(0, overall - _REGISTER_OVERALL_PENALTY.get(register, 0))

	warnings, advice = _build_advice(register, metrics, detected_tics, detected_fillers)

	return TurnAnalysis(
		speech_register=register,  # type: ignore[arg-type]
		clarity_score=clarity,
		politeness_score=politeness,
		vocabulary_score=vocabulary,
		overall_score=overall,
		metrics=metrics,
		detected_tics=detected_tics,
		detected_fillers=detected_fillers,
		warnings=warnings,
		advice=advice,
	)


def build_session_aggregate(
	turn_analyses: list[TurnAnalysis],
) -> SessionAggregate:
	if not turn_analyses:
		return SessionAggregate()

	turn_count = len(turn_analyses)
	avg_overall = sum(t.overall_score for t in turn_analyses) / turn_count
	avg_clarity = sum(t.clarity_score for t in turn_analyses) / turn_count
	avg_politeness = sum(t.politeness_score for t in turn_analyses) / turn_count
	avg_vocabulary = sum(t.vocabulary_score for t in turn_analyses) / turn_count

	total_fillers = sum(t.metrics.filler_word_count for t in turn_analyses)
	total_tics = sum(t.metrics.tic_count for t in turn_analyses)
	total_informal = sum(t.metrics.informal_count for t in turn_analyses)
	total_impolite = sum(t.metrics.impolite_count for t in turn_analyses)

	register_counts = Counter(t.speech_register for t in turn_analyses)
	dominant_register = register_counts.most_common(1)[0][0] if register_counts else "neutral"

	tic_counter: Counter[str] = Counter()
	for turn in turn_analyses:
		tic_counter.update(turn.detected_tics)
	top_tics = [tic for tic, _ in tic_counter.most_common(5)]

	summary_advice: list[str] = []
	if total_fillers >= 4:
		summary_advice.append("Réduisez les mots de remplissage sur l'ensemble de l'entretien.")
	if total_tics >= 4:
		summary_advice.append("Variez vos tournures pour limiter les tics de langage.")
	if total_informal >= 3:
		summary_advice.append("Adoptez un registre plus professionnel tout au long de la session.")
	if total_impolite > 0:
		summary_advice.append("Éliminez toute expression inadaptée à un contexte professionnel.")
	if avg_overall >= 75 and not summary_advice:
		summary_advice.append("Bonne communication verbale globale pendant cette simulation.")
	elif avg_overall < 55:
		summary_advice.append("Travaillez la clarté, le registre et la structuration de vos réponses.")

	return SessionAggregate(
		turn_count=turn_count,
		avg_overall_score=round(avg_overall, 1),
		avg_clarity_score=round(avg_clarity, 1),
		avg_politeness_score=round(avg_politeness, 1),
		avg_vocabulary_score=round(avg_vocabulary, 1),
		total_filler_words=total_fillers,
		total_tics=total_tics,
		total_informal=total_informal,
		total_impolite=total_impolite,
		dominant_register=dominant_register,
		top_tics=top_tics,
		summary_advice=summary_advice,
	)
