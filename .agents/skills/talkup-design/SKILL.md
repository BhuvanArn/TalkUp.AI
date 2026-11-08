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

**Depth.** It is a **new feature** if any of these is true: it adds a screen or a flow, needs new data or a new API route, or implements a backlog item marked *Maquette*. Otherwise it is a **small change**.

| # | Phase | You produce | Small change | New feature |
|---|---|---|---|---|
| 0 | **Frame** | Captures of the real screen today ("Avant", light + dark, at the widths the screen is used at) and the *Cadrage* block, one short line each (two for the concept): surface mode, user, primary job of the screen, **the concept questioned** (is this element the right answer, or does the user need something else?), backlog items involved | yes | yes |
| 1 | **References** | Real products that solved it, each with what you take and what you leave; the seminar principles and designer quotes that apply | 1–2 | 3–5 |
| 2 | **Pistes** | `docs/design/pistes/<slug>/index.html`, every slot filled, FR + EN, light + dark, *Recommandation* and *Questions bloquantes* filled | 2 variants placed in a cropped capture of the real screen | 3 pistes that differ on a decision: safe, TalkUp, forward-looking |
| 3 | **Stop** | Message to the human: the page path, one line per piste, your recommendation and the blocking questions. **End your turn.** | yes | yes |
| 4 | **Implement** | The chosen piste with existing components and tokens; new copy in FR and EN (i18n keys if `web/src/locales/` exists on your branch, otherwise in the PR description); the team's choice recorded in the page's *Décision* block | yes | yes |
| 5 | **Audit** | `run-audit.mjs` (light + dark, 1440 + 390, `--axe`) and `tells.mjs --diff`: every FAIL fixed, every WARN fixed or justified | yes | yes |
| 6 | **Critique** | Screenshots 1440 + 390, light + dark, FR + EN; your critique in the designer's form (element, measurement, why it matters, proposal); fixes applied | yes | yes |

### Phase 2 in detail

```bash
S=.agents/skills/talkup-design/scripts      # from the repo root
node $S/new-pistes.mjs <slug> --title "<titre FR>" --count 2   # or 3
# --out <dir> writes <dir>/<slug>/index.html instead of docs/design/pistes/<slug>/
```

The page inlines the real tokens and has slots per piste: **Intention, Idée forte, Références, Lois UX, États et mesures, Compromis, Écarts Figma ↔ code**. Fill every slot with **one sentence**: the page must be read in five minutes. An empty slot means the thinking was not done. Then:

- **Backlog item?** Piste A is the Figma decision applied to today's screen, with the states the Figma lacks. Where the Figma itself breaks a rule of this skill (an unlabelled icon button, a tell, a missing prerequisite like R1), piste A keeps the intent, fixes the rule, and lists each fix in *Écarts*. B and C may depart from the decision; say so in *Écarts* and in the recommendation ("departs from Ap1: needs the designer's OK").
- Draw the mockup with tokens (`var(--color-…)`, `.text-h3`, `--radius-button`), never hex. Mockups at the real width of their device: on desktop the content area (sidebar optional), 390 phone frames for mobile-only screens. While the mobile shell (backlog M1) is not built, draw a 390 screen on its own and name the M1 dependency in the questions; the page opens one piste at a time. Sample the real surfaces from your "Avant" captures: in dark, the signed-in main area is `--color-white` (the darkest navy), not `--color-background`.
- Real content at real length, the **same persona and data in every piste**, both languages (`data-lang="fr|en"`), French first because it is longer. New copy exists in FR and EN even if the locale files are not on your branch yet; existing user data (job titles, summaries, generated talking points) stays as shipped: wrap it in `lang="en"` inside the FR view and note it. Run `node $S/fr-typo.mjs <page>` for French spacing (it only touches `data-lang="fr"` text, and skips `lang="en"`).
- Show the states that matter (empty, error, loading, overflow, sent…), and write their numbers in *États et mesures* (a short list is fine there): contrast ratios, target sizes, gaps. Several states of one phone screen: lay them out side by side and let them wrap, never in a horizontally scrolling strip.
- Emotional moments (empty, blocker, success): a simple inline SVG in the TalkUp style, or a placeholder that names the illustration and its Figma reference. Never an emoji.
- Changes inside an existing screen (small or not): `node $S/capture.mjs <url> --out <page dir>/context.png --clip <selector of the zone> [--theme dark] [--storage state.json]`, then place each variant in `.context > .slot` at real size, or in `.stack` (capture above, mockup below) when the variant pushes content down. `--click <sel>` opens a tab or menu first, `--hide <sel>` removes floating widgets.
- Pistes must differ on a **decision** (concept, placement, disclosure, interaction model), not on decoration. See `references/taste.md` §4.
- Before showing, check the page itself:
  ```bash
  node $S/run-audit.mjs file://$PWD/docs/design/pistes/<slug>/index.html --themes light,dark --width 1440,390 --no-focus
  node $S/tells.mjs docs/design/pistes/<slug>/index.html
  ```
  The audit runs on every piste in turn. No FAIL, no `layout.clipped-text`, no tells. Then cover the logo: "could this be any AI SaaS?"

### Phase 3: the stop

Present the pistes and end your turn. Do not start phase 4 in the same turn, even if one piste is "obviously" right: the human may see what you missed.
**No human available** (you are a subagent, in an automated loop, or told not to ask): produce the pistes, report them, and stop. Never pick for the human.

## Which reference to read

**Small change, short path:** `talkup-identity.md` §1 and §6, `designer-reflexes.md`, `craft-rules.md` §1–4, `ai-tells.md` self-check. Read the rest only when the task touches it.

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
S=.agents/skills/talkup-design/scripts      # run from the repo root
node $S/new-pistes.mjs <slug> --title "<titre>" [--count 2|3] [--out dir]
TALKUP_PASSWORD=… node $S/login.mjs http://localhost:8081 --email <e>   # prints the state file (system temp folder)
node $S/capture.mjs <url> --out shot.png [--theme light|dark] [--width 1440] [--clip sel] [--click sel] [--hide sel,sel] [--full] [--storage state.json] [--lang fr|en] [--piste A]
node $S/run-audit.mjs <url> --themes light,dark --width 1440,390 --axe [--root main] [--storage state.json]
node $S/tells.mjs --diff origin/staging        # or: node $S/tells.mjs <files>
node $S/fr-typo.mjs <page.html>                # French no-break spaces in data-lang="fr" text
```

The app: `VITE_PORT=8081 npm run dev:web` (signed-in pages also need the server; `LOCAL_DEV.md` if present). Signed-in captures and audits need the storage state written by `login.mjs` (password from the environment; the state is a live session, it lives in the temp folder and is never committed). `capture.mjs` and `run-audit.mjs` save the rotated session back after each run; if one still lands on /login it exits with code 3: log in again. For your own Playwright scripts, prefer the bundled ones; otherwise write a `.cjs` file and run it with `NODE_PATH=<repo>/node_modules` (ES modules ignore `NODE_PATH`; use `createRequire` there). Tests of the scripts: `node --test '.agents/skills/talkup-design/scripts/test/*.test.mjs'`.

## Missing capabilities

- **No browser automation:** you cannot run the audit or capture the real screen. Say so in the stop message and in the PR; list what you checked statically (tokens, tells, contrast computed from token values).
- **No web access:** use `references/resources.md` from memory of the products and `docs/design/research/`; say that references were not re-checked.
- **No Figma access:** use the backlog text and `docs/design/research/research-seminar-lessons.md` for the screen code.

## Definition of done

- [ ] Pistes page committed with the *Décision* block filled (choice, date, who).
- [ ] Audit: no FAIL in light and dark at 1440 and 390; WARNs fixed or justified in the PR.
- [ ] `tells.mjs --diff` clean, or each line justified with `design-ok: <why>`.
- [ ] Screenshots (light/dark × 1440/390) in the PR.
- [ ] New copy in FR and EN (i18n keys once `web/src/locales/` exists); French layout checked.
- [ ] Backlog item removed if implemented; token proposals applied only if approved.

## Red flags

| Thought | Reality |
|---|---|
| "It's just a link / a button, pistes are overkill" | The user asked for pistes on every change. Two variants in a screenshot take minutes. |
| "One option is clearly best, I'll describe the others in prose" | Prose alternatives are not pistes. The human chooses by looking. |
| "I'll show one proposal marked RECOMMENDED" | Recommend in the *Recommandation* block and the stop message, not with a badge or by shrinking the other pistes. |
| "The reasoning is in my message, the page can stay 'À décider'" | The page travels without you: recommendation and blocking questions go in it. |
| "Measurements come at implementation" | The team chooses on the page: put contrast, sizes and states in *États et mesures*. |
| "English only, FR is a translation detail" | French is longer and breaks layouts: it is part of the design. |
| "Grey boxes are enough for a mockup" | Placeholders hide hierarchy and length problems. Real content. |
| "I know the convention, no need for references" | References are where the forward-looking idea comes from. |
| "The current code does X, so the piste does X" | If the backlog says otherwise, the Figma wins (e.g. R1: linear path, not zig-zag). |
| "It looks fine to me" | Measure it. Then look at it in dark, at 390, in French. |
