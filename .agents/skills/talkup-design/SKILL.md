---
name: talkup-design
description: Use when a task changes what users see or do in TalkUp's web app (web/) - a new screen, component, form, flow, copy, empty or error state, styling, layout or responsive change - including small UI tweaks like moving a button or adding a link.
---

# TalkUp design method

## Overview

You stand in for the designer TalkUp does not have on every change. At the 2026-11-06 seminar she showed three things an agent usually lacks: she sits in the **user's seat** and questions the concept, she **measures** ("le 24px, généralement c'est soit 16 ou 20"), and she has **taste** ("la rondeur des boutons fait très IA slop"). This skill turns those into a procedure with required outputs.

Core rule: **no UI code before a human has chosen between visual pistes.** Every task gets pistes, even a small one ("on ne sait jamais ce qu'on peut louper en se disant juste « c'est rapide à faire »"). Only their depth changes.

## Source of truth

- Element listed in `docs/design/figma-backlog.md` → follow the Figma (`N0oUi7zzoaQHvkMVYh2wLM`), and remove the item in the PR that implements it.
- Anything else → the code: `web/src/styles/tailwind.css` tokens, then `web/DESIGN.md`.
- A value with no token → propose a token in the piste, apply it only once the human approves. Never hardcode.

## The procedure

Track these seven phases as a checklist. Each produces something; do not skip a product.

| # | Phase | You produce | Small change | New feature |
|---|---|---|---|---|
| 0 | **Frame** | The *Cadrage* block of the pistes page: surface mode, user, primary job of the screen, **the concept questioned** (is this element the right answer, or does the user need something else?), backlog items involved | yes | yes |
| 1 | **References** | Real products that solved it, each with what you take and what you leave; the seminar principles and designer quotes that apply | 1–2 | 3–5 |
| 2 | **Pistes** | `docs/design/pistes/<slug>/index.html`, every slot filled, FR + EN, light + dark | 2 variants placed in a screenshot of the real screen | 3 pistes that differ on a decision: safe, TalkUp, forward-looking |
| 3 | **Stop** | Message to the human: the page path, one line per piste, your recommendation and why. **End your turn.** | yes | yes |
| 4 | **Implement** | The chosen piste with existing components and tokens; i18n keys in `en` and `fr`; decision recorded in the page's *Décision* block | yes | yes |
| 5 | **Audit** | `run-audit.mjs` (light + dark, 1440 + 390, `--axe`) and `tells.mjs --diff`: every FAIL fixed, every WARN fixed or justified | yes | yes |
| 6 | **Critique** | Screenshots 1440 + 390, light + dark, FR + EN; your critique in the designer's form (element, measurement, why it matters, proposal); fixes applied | yes | yes |

### Phase 2 in detail

```bash
node .agents/skills/talkup-design/scripts/new-pistes.mjs <slug> --title "<titre FR>" --count 2   # or 3
```

The page inlines the real tokens and has slots per piste: **Intention, Idée forte, Références, Lois UX, Compromis, Écarts Figma ↔ code**. Fill every slot; an empty slot means the thinking was not done. Then:

- Draw the mockup with tokens (`var(--color-…)`, `.text-h3`, `--radius-button`), never hex.
- Real content at real length, both languages (`data-lang="fr|en"`), French first because it is longer. Include the empty, error and overflow cases that matter.
- Small change: capture the real screen (browser automation, both themes if they differ), save it as `context.png` next to the page, place each variant in a `.context > .slot`.
- Pistes must differ on a **decision** (concept, placement, disclosure, interaction model), not on decoration. See `references/taste.md` §4.
- Before showing: run `node .agents/skills/talkup-design/scripts/tells.mjs docs/design/pistes/<slug>/index.html`, cover the logo and ask "could this be any AI SaaS?", and check the page in dark (`T`) and English (`L`).

### Phase 3: the stop

Present the pistes and end your turn. Do not start phase 4 in the same turn, even if one piste is "obviously" right: the human may see what you missed.
**No human available** (you are a subagent, in an automated loop, or told not to ask): produce the pistes, report them, and stop. Never pick for the human.

## Which reference to read

| When | Read |
|---|---|
| Always, phase 0 | `references/talkup-identity.md`, then `web/DESIGN.md` + `tailwind.css` |
| Phase 1 | `references/resources.md` |
| Phase 2 | `references/taste.md`, `references/ux-laws.md`, `references/copy-i18n.md` |
| Any AI surface (Tali, Sophie, scores, suggestions, AI writes) | `references/ai-assistant-ux.md` |
| Before showing pistes, phase 6 | `references/ai-tells.md`, `references/designer-reflexes.md` |
| Phases 4–5 | `references/craft-rules.md`, `references/code-pitfalls.md` |

## Commands

```bash
S=.agents/skills/talkup-design/scripts
node $S/new-pistes.mjs <slug> --title "<titre>" [--count 2|3]
node $S/run-audit.mjs http://localhost:8081/<route> --themes light,dark --width 1440,390 --axe [--root main] [--storage state.json]
node $S/tells.mjs --diff origin/staging        # or: node $S/tells.mjs <files>
```

The app: `VITE_PORT=8081 npm run dev:web` (signed-in pages also need the server; `LOCAL_DEV.md` if present). Tests of the scripts: `node --test '.agents/skills/talkup-design/scripts/test/*.test.mjs'`.

## Missing capabilities

- **No browser automation:** you cannot run the audit or capture the real screen. Say so in the stop message and in the PR; list what you checked statically (tokens, tells, contrast computed from token values).
- **No web access:** use `references/resources.md` from memory of the products and `docs/design/research/`; say that references were not re-checked.
- **No Figma access:** use the backlog text and `docs/design/research/research-seminar-lessons.md` for the screen code.

## Definition of done

- [ ] Pistes page committed with the *Décision* block filled (choice, date, who).
- [ ] Audit: no FAIL in light and dark at 1440 and 390; WARNs fixed or justified in the PR.
- [ ] `tells.mjs --diff` clean, or each line justified with `design-ok: <why>`.
- [ ] Screenshots (light/dark × 1440/390) in the PR.
- [ ] i18n keys in both locales; French layout checked.
- [ ] Backlog item removed if implemented; token proposals applied only if approved.

## Red flags

| Thought | Reality |
|---|---|
| "It's just a link / a button, pistes are overkill" | The user asked for pistes on every change. Two variants in a screenshot take minutes. |
| "One option is clearly best, I'll describe the others in prose" | Prose alternatives are not pistes. The human chooses by looking. |
| "I'll show one proposal marked RECOMMENDED" | Recommend in the stop message, not by shrinking the other pistes. |
| "English only, FR is a translation detail" | French is longer and breaks layouts: it is part of the design. |
| "Grey boxes are enough for a mockup" | Placeholders hide hierarchy and length problems. Real content. |
| "I know the convention, no need for references" | References are where the forward-looking idea comes from. |
| "The current code does X, so the piste does X" | If the backlog says otherwise, the Figma wins (e.g. R1: linear path, not zig-zag). |
| "It looks fine to me" | Measure it. Then look at it in dark, at 390, in French. |
