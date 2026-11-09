# TalkUp identity

**Read this when:** framing any screen (phase 0) and before drawing pistes (phase 2).
**It covers:** where the identity lives, how to read the Figma backlog, the product's personas, and the seminar's 30 principles.
**It does not repeat:** token values and component rules. Those are in `web/DESIGN.md` and `web/src/styles/tailwind.css`: read both, every time.

## Contents
1. Source of truth
2. The product and its users
3. Identity in one screen
4. Personas: Tali and Sophie
5. Illustration vs icon
6. Seminar principles, ranked by impact

## 1. Source of truth

| Question | Answer |
|---|---|
| Is the element listed in `docs/design/figma-backlog.md`? | Follow the Figma (`N0oUi7zzoaQHvkMVYh2wLM`, node ids in the backlog). Say in the piste which backlog item it implements. |
| Not listed? | Follow the code: `tailwind.css` tokens win, then `web/DESIGN.md`. The Figma is no longer maintained for these. |
| A piste needs a value that has no token? | Propose the token (name + light + dark value + contrast) in the piste's "Écarts" line. Never hardcode it. Apply it only after the human approves. |
| A PR implements a backlog item? | Remove the item from `figma-backlog.md` in the same PR. |

Reading the Figma: with a Figma-capable tool, open the node id from the backlog and take a screenshot; otherwise read `docs/design/research/research-seminar-lessons.md` (per-screen analysis, same codes: G1–G6, B, L1–L3, A1–A2, C1–C3, Ap1–Ap4, R1–R2, M1–M2).

## 2. The product and its users

TalkUp prepares people for job interviews: track applications, compare a CV with an offer, get a preparation roadmap, rehearse with an AI recruiter, keep notes and an agenda. Schools use an organization view to follow their students.

Users are **anxious but ambitious**: students and young graduates heading to their first internship, apprenticeship or job, often applying to dozens of offers ("ça devient commun que des gens postulent à plusieurs dizaines d'offres"). Many use only a phone. They need to feel **in control and coached**, not judged.

Their words: candidature, offre, entretien, recruteur, relance, CV, lettre de motivation, préparation, simulation. Use them. Avoid product jargon ("workflow", "pipeline", "insights").

Surface modes (from `taste.md`): most of TalkUp is **Operate** (app screens). Landing, /about, /privacy are **Persuade** or **Read**.

## 3. Identity in one screen

- **Calm, precise, coached.** Plenty of air, clear hierarchy, one accent.
- Light: white and cool lavender-grey surfaces, blue accent `accent`, navy `primary` for brand weight.
- Dark: **navy, not black**; elevation by lightness; accents and statuses turn **pastel** with dark labels.
- Saira (headings, buttons) + Inter (body). Few type variants ("attention aux typos à ne pas avoir trop de variantes de typo différentes créé par l'IA").
- Borders over shadows. Hairlines separate chrome; tint blocks don't.
- Buttons 8 px radius, cards 12 px, round only for avatars, dots and badges.
- Outline icons; the selected nav item uses the filled variant (backlog G1).
- Glossy soft-3D spot illustrations for emotional moments; glow under them in dark (backlog L1/L2).

## 4. Personas: Tali and Sophie

- **Tali** is the coach (name validated at the seminar: "Tali est bien pour le moment"). Blue squircle smiley avatar, with states. Entry: "Ask Tali" at the top of the nav (desktop), a Tali tab (mobile). Opens a **right column that pushes the page**, never a floating bubble that covers content. Tali **acts** on the site (rename an application, add to agenda): replies are action receipts with **Undo** for reversible actions and **Confirm** for side effects; the changed object is highlighted in the page. None of this is in the code yet: backlog G1/G2/G6/B. See `ai-assistant-ux.md`.
- **Sophie** is the AI recruiter in simulations. Distinct name, distinct role: never mix the two voices.
- The old blue→green gradient chat bubble, the "TalkUp AI" header and "Powered by" are gone. Do not bring them back.

## 5. Illustration vs icon

- **Functional affordances get icons** (upload, delete, filter, nav). "Conserver les icônes fonctionnelles plutôt que de chercher à les rendre illustratives."
- **Emotional moments get illustrations**: empty states, blockers (mobile "use a computer"), onboarding, success.
- Never sticker-like or decorative-only: "Éviter les illustrations qui ressemblent à de simples stickers / Éviter les éléments décoratifs sans réelle valeur ajoutée."
- Must read in light and dark ("Adapter les couleurs des illustrations pour assurer leur visibilité en mode clair et sombre").
- In a piste, a placeholder shape labelled "illustration v3: <subject>" is fine; never an emoji or a stock icon blown up.

## 6. Seminar principles, ranked by impact

Codes point to the seminar screen (see `docs/design/research/research-seminar-lessons.md`).

1. The AI is an agent in a persistent column that pushes the page, reached from the top of the nav; never a floating bubble over content. (G1, G2, B, M1)
2. Agent replies are action receipts: Undo for reversible actions, Confirm for side effects; highlight what changed. (G2)
3. Every AI number comes with an explanation of what it is and is not, one click away; visuals are truthful to the value (a ring at 0 % still shows a stub). (R1, L3)
4. Dark mode is tinted navy, pastel fills with dark labels, glow instead of shadow. (G4, L2)
5. Contrast is measured: every text tier ≥ 4.5:1, disabled labels included. (G3, G4, C1)
6. Colour is semantic: green means success only, accent means interactive only; non-interactive labels stay neutral. (G3, C1)
7. Wizards: one decision per step, the steps are the user's inputs, optional steps say "(optional)", consent sits next to the commit button. (C3)
8. Errors send the user back to the step at fault and keep everything else; say what was kept; offer a fallback path. (C3)
9. Plan for scale: search, filters, a count, a searchable combobox instead of a long list, a dense table next to the board. (Ap2–Ap4)
10. Empty states and dead ends: an illustration, one line of why, one or two clear next actions; never a grey icon alone, never a blocked screen. (G5, M2)
11. The assistant's empty state teaches its capabilities with concrete, contextual suggested prompts. (G6, B)
12. Distinct personas with names, roles and a recognisable avatar with states. (G1, G6)
13. Responsive by restructuring, not shrinking: bottom tab nav, status tabs instead of columns. (M1)
14. Respect device fit honestly: if a task needs a desk, say so and offer a handoff (email the link). (M2)
15. Forms: visible labels, example placeholders, 16 px between fields, 32 px before the CTA, optional fields marked in the label. (A1, A2)
16. Sibling screens are strictly consistent (login and sign-up share labels, spacing, side panel). (A2)
17. The headline metric gets its own card, top right; never buried or used as a watermark. (R1)
18. A process is one straight path (white cards on a grey track), not a zig-zag. (R1)
19. Stack instead of tabs when there is room; progressive disclosure (title, then "See more"). (R2)
20. Users can triage AI output ("Got it", "Hide") and see a hidden count. (R2)
21. Users can rename generated entities; the original stays visible. (Ap1)
22. Every detail page has a way back ("← All applications"). (Ap1)
23. Collapse low-value groups (Rejected) so useful ones gain space; hide features that make no sense at small scale (search with < 3 applications). (Ap2, Ap3)
24. One radius system; limit font variants. (R1, R2)
25. Separate chrome with hairlines, not tint blocks; subtle hover ("la couleur de hover … est trop forte"). (G1, Ap2)
26. Settings and integrations stay out of the primary nav. (G1)
27. Marketing: tease real output, blur the rest, one CTA; the hero is not a product tour. (L3)
28. Brand glow over offset shadows; mascot speech cards over decorative floating shapes. (L1, L2)
29. Functional affordances get icons, emotional moments get illustrations. (C1, G5)
30. Reuse saved data by default ("Use my current CV") and make replacement explicit. (C3)
