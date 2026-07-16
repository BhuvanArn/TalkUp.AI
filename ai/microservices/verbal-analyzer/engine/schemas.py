##
## Talkup Project, 2026
## TalkUp.AI
## Pydantic schemas for Verbal Analyzer API.
##

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class JobContext(BaseModel):
	title: str | None = None
	description: str | None = None
	requirements: str | None = None


class AnalyzeTurnRequest(BaseModel):
	interview_id: str = Field(..., min_length=1, max_length=64)
	request_id: int | str | None = None
	user_id: str | None = None
	turn_index: int | None = None
	transcription: str = Field(..., min_length=1, max_length=4000)
	language: str = "French"
	interview_type: str | None = None
	job_context: JobContext | None = None

	@field_validator("transcription")
	@classmethod
	def strip_transcription(cls, value: str) -> str:
		stripped = value.strip()
		if not stripped:
			raise ValueError("transcription must not be empty")
		return stripped


class TurnMetrics(BaseModel):
	filler_word_count: int = 0
	tic_count: int = 0
	informal_count: int = 0
	impolite_count: int = 0
	overly_formal_count: int = 0
	politeness_count: int = 0
	professional_word_count: int = 0
	job_keyword_count: int = 0
	repeated_phrase_count: int = 0
	word_count: int = 0
	sentence_count: int = 0
	avg_sentence_length: float = 0.0
	lexical_richness: float = 0.0


class TurnAnalysis(BaseModel):
	speech_register: Literal["professional", "neutral", "informal", "mixed", "inappropriate"]
	clarity_score: int = Field(ge=0, le=100)
	politeness_score: int = Field(ge=0, le=100)
	vocabulary_score: int = Field(ge=0, le=100)
	overall_score: int = Field(ge=0, le=100)
	metrics: TurnMetrics
	detected_tics: list[str] = Field(default_factory=list)
	detected_fillers: list[str] = Field(default_factory=list)
	warnings: list[str] = Field(default_factory=list)
	advice: list[str] = Field(default_factory=list)


class SessionAggregate(BaseModel):
	turn_count: int = 0
	avg_overall_score: float = 0.0
	avg_clarity_score: float = 0.0
	avg_politeness_score: float = 0.0
	avg_vocabulary_score: float = 0.0
	total_filler_words: int = 0
	total_tics: int = 0
	total_informal: int = 0
	total_impolite: int = 0
	dominant_register: str = "neutral"
	top_tics: list[str] = Field(default_factory=list)
	summary_advice: list[str] = Field(default_factory=list)


class VerbalAnalysisResult(BaseModel):
	interview_id: str
	request_id: int | str | None = None
	turn_index: int
	turn: TurnAnalysis
	aggregate: SessionAggregate


class SessionSummary(BaseModel):
	interview_id: str
	aggregate: SessionAggregate
	turns: list[dict[str, Any]] = Field(default_factory=list)
