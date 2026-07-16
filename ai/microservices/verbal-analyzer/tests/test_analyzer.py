##
## Talkup Project, 2026
## TalkUp.AI
## Verbal Analyzer unit tests.
##

from __future__ import annotations

import pytest

from engine.analyzer import analyze_turn, build_session_aggregate
from engine.schemas import AnalyzeTurnRequest, JobContext
from engine.session_store import SessionStore


class TestAnalyzer:
	def test_detects_fillers_and_tics(self) -> None:
		text = "Euh, en fait, du coup, genre, j'ai travaillé sur un projet Python."
		result = analyze_turn(text)
		assert result.metrics.filler_word_count >= 2
		assert result.metrics.tic_count >= 1
		assert len(result.detected_fillers) >= 1 or len(result.detected_tics) >= 1

	def test_informal_register(self) -> None:
		text = "Ouais bon, c'était un truc relou mais j'ai géré."
		result = analyze_turn(text)
		assert result.speech_register in ("informal", "mixed", "inappropriate")
		assert result.metrics.informal_count >= 1

	def test_professional_register(self) -> None:
		text = (
			"J'ai piloté un projet en équipe avec une méthodologie agile, "
			"en veillant à la qualité et à la collaboration avec le client."
		)
		result = analyze_turn(text)
		assert result.metrics.professional_word_count >= 2
		assert result.overall_score >= 50

	def test_impolite_warning(self) -> None:
		text = "C'était nul comme expérience, franchement."
		result = analyze_turn(text)
		assert result.metrics.impolite_count >= 1 or result.metrics.informal_count >= 1
		assert len(result.warnings) >= 1

	def test_lexical_metrics(self) -> None:
		text = "Bonjour. Je développe des API REST. Merci."
		result = analyze_turn(text)
		assert result.metrics.word_count >= 5
		assert result.metrics.sentence_count >= 1
		assert 0 <= result.metrics.lexical_richness <= 1

	def test_inappropriate_content_scores_low(self) -> None:
		text = "Moi et mon pote, on aime le caca."
		result = analyze_turn(text)
		assert result.speech_register == "inappropriate"
		assert result.overall_score < 50
		assert len(result.warnings) >= 1

	def test_professional_answer_outranks_casual(self) -> None:
		pro = analyze_turn(
			"J'ai dirigé une équipe agile et livré plusieurs projets de qualité."
		)
		casual = analyze_turn("Ouais c'était un truc de ouf, j'ai grave kiffé.")
		assert pro.overall_score > casual.overall_score

	def test_job_context_keywords(self) -> None:
		ctx = JobContext(requirements="python docker kubernetes")
		text = "J'utilise python et docker au quotidien."
		result = analyze_turn(text, ctx)
		assert result.metrics.job_keyword_count >= 2


class TestSessionStore:
	def test_session_isolation(self) -> None:
		store = SessionStore(ttl_sec=60, history_max_turns=10)

		req_a = AnalyzeTurnRequest(
			interview_id="session-a",
			transcription="Euh, j'ai travaillé sur un projet.",
		)
		req_b = AnalyzeTurnRequest(
			interview_id="session-b",
			transcription="Bonjour, merci pour cette opportunité professionnelle.",
		)

		res_a = store.analyze_turn(req_a)
		res_b = store.analyze_turn(req_b)

		assert res_a.interview_id == "session-a"
		assert res_b.interview_id == "session-b"
		assert res_a.aggregate.turn_count == 1
		assert res_b.aggregate.turn_count == 1

		req_a2 = AnalyzeTurnRequest(
			interview_id="session-a",
			transcription="En fait, du coup, encore un tic.",
		)
		res_a2 = store.analyze_turn(req_a2)
		assert res_a2.aggregate.turn_count == 2
		assert res_b.aggregate.turn_count == 1

	def test_finalize_clears_session(self) -> None:
		store = SessionStore(ttl_sec=60, history_max_turns=10)
		req = AnalyzeTurnRequest(
			interview_id="finalize-test",
			transcription="Réponse professionnelle structurée.",
		)
		store.analyze_turn(req)
		summary = store.finalize("finalize-test")
		assert summary is not None
		assert summary.aggregate.turn_count == 1
		assert store.get_aggregate("finalize-test") is None

	def test_aggregate_building(self) -> None:
		turns = [
			analyze_turn("Bonjour, merci pour cet entretien."),
			analyze_turn("Euh, genre, c'était un truc."),
		]
		agg = build_session_aggregate(turns)
		assert agg.turn_count == 2
		assert agg.avg_overall_score > 0
