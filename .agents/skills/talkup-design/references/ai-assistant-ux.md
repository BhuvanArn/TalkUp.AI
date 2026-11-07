# AI assistant UX (Tali, Sophie, any AI surface)

**Read this when:** a task touches Tali, a simulation with Sophie, an AI score or analysis, suggested prompts, or any place where the AI writes to the user's data.
**Why it matters:** the seminar's biggest lesson was here. The old assistant was a floating gradient bubble that "fait trop support qu'un site des années 2010 pourrait avoir"; the target is a coach that **acts** in the product. Most AI products in 2026 still ship the bubble: this is where TalkUp can feel ahead.
**Sources:** seminar G1/G2/G6/B/R1 (`docs/design/research/research-seminar-lessons.md`), NN/g AI articles, Microsoft HAX guidelines, Google PAIR guidebook, Linear agent guidelines, Shape of AI (shapeof.ai), AI UX Playground (aiuxplayground.com, `llms.txt` index for agents). Details: `docs/design/research/research-taste-ai-look.md` §3.

## Contents
1. First question: does this need AI UI at all?
2. Where the AI lives
3. Talking to it (input)
4. What it gives back (output)
5. Acting on the user's data (trust)
6. AI numbers and scores
7. States and failures
8. Tali specifics (target design, backlog)

## 1. First question: does this need AI UI at all?

"AI does not have to be anthropomorphized, conversational, or even visible to add value" (NN/g). Prefer, in this order:
1. **Quiet AI**: the result appears where the decision happens (a draft follow-up email on the application card when it is due).
2. **Inline action** on the content (rephrase this answer, explain this score).
3. **Tali's column** for open questions and multi-step actions.
A new chat surface is the last option, never the default.

## 2. Where the AI lives

- **A right column that pushes the page**, never a bubble or overlay that hides content (« c'est surtout que la sidebar … fait qu'il y a du contenu de perdu derrière »). The page shrinks into its bordered window; the nav collapses to a rail and can expand.
- Reached from **"Ask Tali" at the top of the nav** (desktop) and a Tali tab (mobile).
- **Contextual to the open object**: on an application, Tali knows which one.
- Same tokens as the app. No special "AI theme", no gradient, no sparkles.
- Separated from the nav by the same hairline as the rest of the shell.

## 3. Talking to it (input)

- The empty state **teaches what it can do, in context**: avatar, one line on who Tali is, 3–5 suggestions built from the user's real data ("Prepare my Qonto interview on Thursday"), never "Ask me anything".
- Attachments and context (CV, offer link, application) as removable **scope chips** above the composer.
- Clarifying questions as **generated controls** (one choice at a time, an open option, Skip, prefilled from context), not "please type more details".
- Follow-ups as chips after an answer.

## 4. What it gives back (output)

- **Less chat, more answer**: the direct answer first, its limits in the first sentence, then 2–3 follow-up chips.
- Stream with a stable layout; do not autoscroll past the start of the answer.
- Structured output as **real UI** (a question list, a checklist, a CV diff), not walls of markdown.
- **Citations to the user's own material**: feedback quotes the exact sentence of their answer or CV it refers to.
- Variations side by side when the user must choose.
- AI-generated content is visibly marked; the user can edit it, copy it, discard it.

## 5. Acting on the user's data (trust)

The seminar's G2: Tali renames an application and asks before adding to the agenda.

| Action | Pattern |
|---|---|
| Read (look up applications, notes) | Silent, but say what was read ("Based on your 3 Qonto notes"). |
| Reversible write (rename, mark done, move a card) | Do it, show an **action receipt** "✓ Renamed to … · Undo", **highlight the changed object** in the page. |
| Side effect or outward-facing (add to agenda, send an email to a recruiter, delete) | **Preview + Confirm** first ("Add interview · 12 Nov 2026, 14:00 · Confirm / Edit / Cancel"). |
| Multi-step | A short **plan** in plain words before acting, a live step list (pending / running / done / failed), interrupt keeps completed steps. |

Always: state what changed, a time window for Undo if any, and an activity log the user can open. Start with low autonomy; let users raise it later.

## 6. AI numbers and scores

- Every score explains **what it is and is not** ("an estimate of fit between your CV and the offer, not a hiring probability") and **how it is calculated**, one click away ("How is it calculated?").
- Give it its own card, easy to find (« Le score en haut à droite est un peu planqué »).
- A benchmark when you have one ("62/100 · average for this role 55").
- Visuals truthful to the value; at 0 %, a ring keeps a starter stub so it reads as "fills up".
- Users can triage AI output: "Got it", "Hide", a hidden count, "See more".

## 7. States and failures

- State always visible **in words**: "Reading the offer…", "Waiting for your confirmation", "Done · 3 suggestions". Tali's avatar has matching states.
- Stop / cancel generation at any time.
- Failure: say clearly what could not be done, keep what was done, offer the closest alternative or a retry.
- Response time: acknowledge in < 100 ms, show progress beyond 1 s, steps and cancel beyond 10 s.

## 8. Tali specifics (target design, backlog)

Not in the code yet (backlog G1, G2, G6, B): treat as Figma-sourced when a task touches them.
- Avatar: blue squircle smiley, states (idle, thinking, acting, happy). « on revient aux smiley, on a ajouté un layer "Avatar bot" avec des états ».
- Panel title "New chat with Tali", expand / collapse, composer with attach and send.
- On marketing pages, Tali appears as a speech card commenting on the product, not as a chatbot.
- **Sophie** (the recruiter in simulations) is a different voice: a simulation is a **session** (question, think time with a `tabular-nums` timer, answer, transcript, annotated feedback), not a chat.
- The old `bg-brand-gradient` chatbot surfaces are obsolete: `tells.mjs` flags new uses.
