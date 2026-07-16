"""Unit tests for STT hallucination filtering."""

from __future__ import annotations

from engine.transcription_validation import (
	contains_hallucination_pattern,
	should_drop_segment_text,
	validate_transcription,
)


class TestHallucinationPatterns:
	def test_detects_sous_titrage_st_501(self) -> None:
		assert contains_hallucination_pattern("Sous-titrage ST' 501")

	def test_detects_amara_subtitles(self) -> None:
		assert contains_hallucination_pattern(
			"Sous-titres réalisés par la communauté d'Amara.org",
		)

	def test_accepts_normal_interview_answer(self) -> None:
		assert not contains_hallucination_pattern(
			"J'ai cinq ans d'expérience en développement backend avec Python.",
		)


class TestValidateTranscription:
	def test_rejects_obvious_subtitle_hallucination(self) -> None:
		valid, reason = validate_transcription("Sous-titrage ST' 501")
		assert not valid
		assert reason == "hallucination"

	def test_rejects_repetitive_gibberish(self) -> None:
		valid, reason = validate_transcription("euh euh euh")
		assert not valid
		assert reason == "repetition"

	def test_accepts_substantive_answer(self) -> None:
		valid, reason = validate_transcription(
			"Je travaille principalement sur des APIs REST et des microservices.",
		)
		assert valid
		assert reason == ""


class TestShouldDropSegment:
	def test_drops_subtitle_segment_even_when_confident(self) -> None:
		assert should_drop_segment_text(
			"Sous-titrage ST' 501",
			no_speech_prob=0.1,
			avg_logprob=-0.1,
		)

	def test_keeps_confident_interview_speech(self) -> None:
		assert not should_drop_segment_text(
			"Je suis développeur full stack depuis trois ans.",
			no_speech_prob=0.1,
			avg_logprob=-0.2,
		)
