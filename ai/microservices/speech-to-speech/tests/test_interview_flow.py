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

	still_presenting = get_phase_instruction(
		user_turn_count=3,
		presentation_done=False,
		latest_user_text="Je suis en master informatique cette annee.",
	)
	assert "PRESENTATION" in still_presenting
	assert "PARCOURS" not in still_presenting

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


def test_farewell_ack_does_not_revive_cleared_flow() -> None:
	interview_id = "int-farewell-clear"
	InterviewFlowStore.clear(interview_id)
	flow = InterviewFlowStore.get(interview_id)
	flow.farewell_sent = True
	flow.presentation_done = True

	farewell_sent = flow.farewell_sent
	InterviewFlowStore.clear(interview_id)

	if not farewell_sent:
		mark_presentation_done(
			interview_id,
			"Je suis Mathéo, développeur .NET avec 4 ans d'expérience en React et C#.",
		)

	revived = InterviewFlowStore.get(interview_id)
	assert revived.presentation_done is False
	assert revived.farewell_sent is False
	InterviewFlowStore.clear(interview_id)
