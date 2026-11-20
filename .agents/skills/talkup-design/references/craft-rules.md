# Craft rules: the measuring eye

**Read this when:** drawing pistes (to place things on the grid), implementing, and auditing (phases 5–6).
**What it is:** the numbers a designer checks at a glance, with severity and source, and how to measure them.
**Keep in sync with:** `scripts/audit.js` (`NORMS`). If you change a number here, change it there, and the reverse.
Full reasoning and sources: `docs/design/research/research-measurable-rules.md`.

Severity: **FAIL** blocks shipping (WCAG 2.2 AA); **WARN** needs a fix or a written reason; **NOTE** is a question.

## Contents
1. Spacing
2. Typography
3. Contrast and accessibility (WCAG 2.2 AA, RGAA)
4. Interaction states
5. Motion
6. Colour and dark mode
7. How to measure

## 1. Spacing

| Check | Norm | Sev. | Source |
|---|---|---|---|
| Spacing values | multiples of 4 px (8 for layout); 1–2 px only for border compensation | NOTE | Tailwind scale, DSFR, Carbon |
| Label → field | 4–8 px (warn outside 2–12) | WARN | DSFR 8, GOV.UK 5, Carbon 8 |
| Field → field | **16–20 px** | WARN | the designer: « Le 24px, généralement c'est soit 16 ou 20 »; DSFR 16 |
| Last field → primary button | ≥ field gap; **32 px** in TalkUp | WARN | seminar A1, Carbon 32 |
| Proximity | gap between groups ≥ 1.5× gap inside a group (aim 2×) | WARN | Gestalt proximity, NN/g |
| Space above a heading | 1.5–2× the space below it | NOTE | Refactoring UI |
| Card padding | 16–24 px app, 24–32 px marketing; inner gaps smaller than the padding | WARN if < 12 | DSFR, Atlassian |
| Gap between cards | 16–32 px | NOTE | — |
| Button group gap | 8–12 px; icon ↔ label 4–8 px | NOTE | Atlassian |
| Section spacing | app 32–48 px; marketing 64–128 px desktop, 40–64 px mobile | NOTE | Carbon, Refactoring UI |
| Table rows | 40 px (≈ 16 rows on screen) | NOTE | seminar Ap4 |
| Input height | 40–48 px (36 dense minimum) | WARN | DSFR, GOV.UK, Carbon |
| Input text | ≥ 16 px on mobile (iOS zooms below) | WARN | — |

The cramped-form diagnosis: field gap ≤ label gap (labels float between fields), button glued to the last field. The airy-form diagnosis: field gap ≥ 24 px, fields stop reading as one form.

## 2. Typography

| Check | Norm | Sev. |
|---|---|---|
| Distinct font sizes on a screen | ≤ 8 (aim 5–6); use weight and colour before a new size | WARN |
| Weights | ≤ 3 per family | NOTE |
| Body size | 16 px reading; 14 px fine in dense app UI; < 12 px never | WARN < 14 |
| Body line height | 1.4–1.6 (warn outside 1.3–1.8) | WARN |
| Heading line height | 1.1–1.3, tighter as size grows | NOTE |
| Line length | 45–75 characters (warn > 90) | WARN |
| Uppercase labels | ≤ 14 px, +0.05–0.1 em tracking, short; rarely (see `ai-tells.md` eyebrow) | NOTE |
| Display ≥ 40 px | letter-spacing 0 to −0.02 em | NOTE |
| Text spacing robustness | survives line-height 1.5, letter 0.12 em, word 0.16 em (WCAG 1.4.12) | WARN |
| Reflow | no horizontal scroll at 320 px wide (WCAG 1.4.10) | FAIL |
| French copy | 20–30 % longer than English: check the FR layout, not only EN | WARN |

TalkUp scale: `text-h1…h6` (Saira), `text-body-*` (Inter), `text-label-*`, `text-button-*`. Use them, never raw `text-sm` for new UI.

## 3. Contrast and accessibility (WCAG 2.2 AA, RGAA)

| Check | Norm | Sev. |
|---|---|---|
| Text contrast | ≥ 4.5:1; ≥ 3:1 for ≥ 24 px or ≥ 18.66 px bold | FAIL |
| Placeholder text | is text: 4.5:1 | FAIL |
| Disabled labels | exempt in WCAG, but TalkUp requires ≥ 4.5:1 (seminar G3) | WARN |
| Non-text contrast | field boundaries, focus rings, meaningful icons ≥ 3:1 against adjacent colours | FAIL |
| Target size | ≥ 24 × 24 px, or WCAG 2.5.8 spacing exception; 44 px on touch and primary actions | FAIL / WARN |
| Focus visible | every focusable element; 2 px ring, 2 px offset, ≥ 3:1 (`focus-ring` utility) | FAIL |
| Focus not obscured | not fully hidden by sticky headers, panels, banners | FAIL |
| Colour alone | never the only cue for status, errors, links in text | FAIL |
| Errors | text next to the field, `aria-invalid`, `aria-describedby`, focus the first error on submit | FAIL |
| Labels | every control has a programmatic label; a visible one for text fields | FAIL / WARN |
| Autocomplete | `autocomplete` on personal fields (email, name, new-password…) | WARN |
| Paste | never block paste on login fields | FAIL |
| Reduced motion | looping and large motion stops under `prefers-reduced-motion` | WARN |

French context: RGAA 4.1.2 is WCAG 2.1 AA in French form. TalkUp is probably not legally bound yet, but schools and public partners will ask: treat WCAG 2.2 AA as the bar. Tools: design.numerique.gouv.fr (checklist formulaires, checklist dev, Diagnostic Flash), Ara, the Assistant RGAA browser extension.

## 4. Interaction states

Every interactive element, every time:

- **Hover:** a hint (subtle tint), 100–150 ms. Never as strong as selection.
- **Focus-visible:** the `focus-ring` utility.
- **Active/pressed:** slightly darker, ≤ 100 ms; `aria-pressed` on toggles.
- **Selected/current:** not colour-only (weight, indicator, filled icon, `aria-current`).
- **Disabled:** prefer not to. A disabled submit hides *why*. Keep it enabled and validate on submit, or use `aria-disabled` + a hint. If disabled, `bg-disabled text-text-disabled` (≥ 5:1), no opacity fade.
- **Loading:** the button keeps its width and label + spinner; content regions get a skeleton that mirrors the final layout; show indicators after ~300 ms; > 10 s needs progress + cancel.
- **Empty:** what goes here, why it is empty, one or two actions; an illustration for emotional moments.
- **Error:** what happened + how to fix it, next to the field or in context; keep everything the user entered.
- **Success:** confirmation in context (`role="status"`), plus Undo when reversible.
- **Overflow:** long names (company, job title), 3-line titles, 99+ counts, empty and full lists.

## 5. Motion

| Check | Norm |
|---|---|
| Micro (hover, press, toggle) | 100–200 ms, ease-out |
| Medium (menu, tooltip, accordion, toast) | 200–300 ms |
| Large (panel, dialog, page) | 300–400 ms; > 500 ms feels slow (WARN) |
| Exit vs enter | exit ≈ 70–80 % of enter; enter decelerates, exit accelerates |
| Easing | never `linear`/`ease` for movement; standard `cubic-bezier(0.2, 0, 0, 1)` |
| Purpose | only for cause → effect, continuity, state change (panel pushes the page, renamed card flashes) |
| Reduced motion | `motion-safe:` / `motion-reduce:`; under reduce, no translate/scale, ≤ 200 ms fades |
| Frequency | no animation on actions done 100 times a day or triggered by keyboard |

## 6. Colour and dark mode

- Neutral-dominant; accent ≈ 10 % of the surface: primary action, selection, focus. One filled primary action per region.
- Semantic colours mean one thing: success green, warning amber, error red, info blue. Always with text or an icon.
- Dark (TalkUp): navy surfaces, elevation by lightness, pastel fills with dark labels (`text-on-accent`), no shadows, glow only on large titles and illustrations. Re-measure every pair in dark: borders often fall under 3:1.
- Organization view remaps brand tokens to a dark emerald: check it on persistent UI.
- Never use `text-white` / `bg-white` as "white on a fill": they flip in dark. Use `text-on-accent`, `text-on-media`.

## 7. How to measure

Run these from the repo root with the app running (`VITE_PORT=8081 npm run dev:web`; signed-in pages need the server too, see `LOCAL_DEV.md` if you have it).

```bash
S=.agents/skills/talkup-design/scripts
# Rendered audit: light + dark, desktop + phone, keyboard focus, reduced motion, axe (WCAG)
node $S/run-audit.mjs http://localhost:8081/<route> --themes light,dark --width 1440,390 --axe
#   --root main            limit to a region      --ignore .x,.y    skip regions
#   --storage <file>       state file printed by login.mjs, for signed-in pages
#   --json                 machine-readable
# Static scan of the lines you added
node $S/tells.mjs --diff origin/staging
# Lighthouse accessibility (optional second opinion, no install)
npx lighthouse http://localhost:8081/<route> --only-categories=accessibility --chrome-flags="--headless=new" --quiet
```

In a browser console (no Node): paste the content of `scripts/audit.js`, then `__talkupAudit({ root: 'main' })`.

Measure by hand when the script cannot: DevTools → select element → Computed box model, or `$0.getBoundingClientRect()` on two elements and subtract. Write the finding the designer's way: element, measured value, norm, why it matters, proposal.

What the tools cannot judge (do it yourself, on screenshots): hierarchy (squint test), rhythm, whether the one bold thing reads first, copy, whether it looks like any other AI SaaS.
