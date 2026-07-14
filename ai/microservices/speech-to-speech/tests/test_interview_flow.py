##
## Talkup Project, 2026
## TalkUp.AI
## Interview flow unit tests.
##

from __future__ import annotations

from engine.interview_flow import (
	CLOSING_TURN_THRESHOLD,
	InterviewFlowStore,
	count_user_turns,
	get_phase_instruction,
	get_turn_instruction,
	looks_like_name_only,
	mark_presentation_done,
)


def test_count_user_turns() -> None:
	history = [
		{"role": "assistant", "content": "Bonjour"},
		{"role": "user", "content": "Bonjour"},
		{"role": "assistant", "content": "Parlez-moi de vous"},
		{"role": "user", "content": "Je suis dev"},
	]
	assert count_user_turns(history) == 2


def test_looks_like_name_only() -> None:
	assert looks_like_name_only("Bonjour, je m'appelle Mathéo.") is True
	assert looks_like_name_only("Je m'appelle Mathéo") is True
	assert looks_like_name_only(
		"Je suis Mathéo, diplômé en informatique à Nantes, "
		"je travaille depuis 3 ans en développement web."
	) is False


def test_presentation_phase_before_experience() -> None:
	instruction = get_phase_instruction(
		user_turn_count=1,
		presentation_done=False,
		latest_user_text="Bonjour, je m'appelle Mathéo.",
	)
	assert "PRESENTATION" in instruction
	assert "experiences professionnelles" in instruction.lower()

	parcours = get_phase_instruction(
		user_turn_count=3,
		presentation_done=True,
		latest_user_text="Je suis développeur depuis 3 ans.",
	)
	assert "PARCOURS" in parcours


def test_closing_instruction_after_threshold() -> None:
	instruction = get_turn_instruction(
		[],
		CLOSING_TURN_THRESHOLD,
		"Merci beaucoup",
		farewell_sent=False,
		presentation_done=True,
	)
	assert "conclure" in instruction.lower()
	assert "historique" in instruction.lower()


def test_farewell_ack_when_farewell_sent() -> None:
	instruction = get_turn_instruction(
		[],
		5,
		"Au revoir",
		farewell_sent=True,
		presentation_done=True,
	)
	assert "termine" in instruction.lower()


def test_mark_presentation_done() -> None:
	InterviewFlowStore.clear("int-test")
	state = InterviewFlowStore.get("int-test")
	assert state.presentation_done is False
	mark_presentation_done(
		"int-test",
		"Je suis Mathéo, développeur .NET avec 4 ans d'expérience en React et C#.",
	)
	assert InterviewFlowStore.get("int-test").presentation_done is True
	InterviewFlowStore.clear("int-test")
