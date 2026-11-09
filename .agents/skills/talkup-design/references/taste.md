# Taste: how to decide

**Read this when:** framing (phase 0), drafting pistes (phase 2) and critiquing (phase 6).
**What it is:** what designers mean by taste, turned into decisions you can make and check.
**Sources:** `docs/design/research/research-taste-ai-look.md` §2 (Anthropic, Impeccable, Muzli, NN/g, Refactoring UI, Vercel/Rauno) and the seminar.

## Contents
1. What taste is
2. Surface modes
3. Thirteen checkable heuristics
4. Generating pistes that really differ
5. Signature moves for TalkUp (ideas, not decisions)
6. Over-applied "taste" (anti-heuristics)

## 1. What taste is

- A standard that tells the good from the merely good enough, and a point of view committed to fully.
- Built by looking: at real products, at where conventions are kept or bent and whether it was intentional, at the small details.
- "Average in, average out." Muzli measured look-alike designs going from 1 in 1,100 pairs (2021) to 1 in 200 (2025–26). Name the defaults your tools push and decide each one on purpose.
- As polish becomes cheap, **specificity and care** become the quality signal (NN/g). Attractive UIs are forgiven small flaws, never big ones: don't judge your own work by its polish.

## 2. Surface modes

Name the mode first; it decides how much the brand may speak.

| Mode | TalkUp screens | Rules |
|---|---|---|
| **Operate** | applications, roadmap, CV analysis, simulation, agenda, notes, settings, organization | Users know where everything is before they notice style. Brand lives only in type, palette, density and **one signature move**; layout, nav and controls stay conventional. Bar: as clean as the best product in the category, and more specific. "A grey screen with one accent colour is the category default without the category's polish, not restraint." |
| **Persuade** | landing, teasing page, /about | Commit to one point of view; real product moments; one CTA. |
| **Read** | privacy, help, guides | Comprehension: 65–75 character measure, clear headings, nothing decorative. |

## 3. Thirteen checkable heuristics

1. **Ground in the subject.** Before drawing, write: who, what job this screen does, the vocabulary (candidature, relance, entretien…).
2. **One strong idea per screen.** Spend boldness in one place; everything around it is quiet. Remove one accessory before shipping.
3. **Contrast of scale.** The most important thing is unmistakably the biggest or heaviest. Blur the screenshot (squint test): the hierarchy must survive.
4. **Emphasise by de-emphasising.** Lighten secondary text, quiet inactive nav, smaller labels. Pair values with labels ("3 follow-ups waiting", not "Follow-ups: 3").
5. **Structure is information.** Every border, number, divider and label states something true about the content; otherwise delete it.
6. **Restraint in colour.** Neutral-dominant; accent for the primary action and selection; status colours only for status, with text.
7. **Rhythm, not uniformity.** Tight groups, generous separation, more space above headings.
8. **Intentional alignment.** A left reading axis; asymmetric splits (work area + assistant column) over centered stacks; equal outer edges.
9. **Real content first.** Realistic data at real length, in both languages, plus an empty, an error and an overflowing case. This is the single biggest lever on AI-made UI (NN/g).
10. **Motion with purpose.** Only for cause → effect, continuity, state change.
11. **Craft floor.** Visible focus, ≥ 24 px targets (44 touch), loading keeps the label, skeletons mirror the layout, `tabular-nums`, no font-weight change on hover, non-breaking spaces in "10 min", errors next to fields, never block paste, filters and tabs in the URL, optimistic update + undo.
12. **Critique the render, not the code.** Screenshots at 390 and 1440, light and dark, FR and EN. "Logo covered, could this be any other AI SaaS?"
13. **Plan, check against the brief, then build.** Write the plan (layout sketch, the one bold thing, tokens), then ask of each choice "is this what I'd produce for any similar prompt?" If yes, change it and say why.

## 4. Generating pistes that really differ

Three variants of one layout are one piste. Make them differ on a **decision**, not on decoration:

- **Concept**: what the element is (a link vs a breadcrumb vs making the list reachable from the panel itself; a chat vs an agent column vs inline suggestions).
- **Placement**: where it lives in the shell (header, column, inline, nav).
- **Density / disclosure**: everything visible vs progressive (title → "See more").
- **Interaction model**: direct manipulation vs a step-by-step flow vs the assistant doing it.

For a new feature, one piste is the **safe** one (category convention, done well), one is **TalkUp's** (built on the seminar identity and a signature move), one is **forward-looking** (how the best products of 2026 would solve it: often the agent acting, or the UI adapting to the user's context). Say in each piste what it sacrifices.

To escape your own defaults: list three ways you would "normally" do it, then ask which of them a TalkUp user would actually miss. Keep the unlikely idea if it serves the user better.

## 5. Signature moves for TalkUp (ideas, not decisions)

Use at most one per screen, only if it serves the task, and say so in the piste. The team decides which become identity.

- The interview's real rhythm: question → think time → answer → feedback, as a timeline or transcript, not chat bubbles.
- The application track: one horizontal line of stages (applied → follow-up → interview → answer) reused wherever status appears.
- Feedback as annotations on the user's own words (margin notes, highlights), not a score card.
- Tali visibly acting: the changed object highlighted, with Undo.

## 6. Over-applied "taste" (anti-heuristics)

- Do not swap Inter or Saira for a "distinctive" font: tokens win. Fix the hierarchy.
- Do not add atmosphere (textures, grain, blobs, shaders) to app screens.
- Do not reject a technique in isolation: gradients, dark, glass, cards can each be right when chosen for this subject. The tell is the default applied regardless of subject.
- Do not mistake minimalism for quality: an empty grey screen is not restraint.
- Do not invent a new layout for an Operate screen when the convention works: put the boldness in one place.
