# Measurable UI Rules for a "Designer's Eye" Audit Skill

Research for TalkUp.AI (React 19 + Tailwind v4, 4px spacing base, Saira headings/buttons + Inter body, light + dark).
Date: 2026-11-07. Every rule has a number an agent can check and a source. Confidence tags:
**[V]** = verified this session from a primary source (spec page, or values extracted from the design system's shipped CSS/tokens);
**[K]** = established guidance from the cited source, recalled, not re-fetched this session (treat as strong heuristic);
**[H]** = practitioner heuristic / synthesis (use as WARN, never as FAIL).

Severity model suggested for the skill:
- **FAIL** = WCAG 2.2 AA violation (legal relevance under EAA / RGAA 4.1.2).
- **WARN** = outside the norm range of 2+ major design systems.
- **NOTE** = taste / heuristic.

---

## 0. TL;DR checklist (numbers to keep in the skill's head)

| Check | Norm | Severity |
|---|---|---|
| All spacing values multiples of 4px (8px preferred for layout) | 4 / 8 grid | WARN |
| Label → input gap | 4–8px (GOV.UK 5px, DSFR 8px, Carbon 8px) | WARN if <4 or >12 |
| Hint text → input / label → hint | 4–12px | WARN |
| Field → field (form-group) gap | 16–32px (DSFR 16px, GOV.UK 20px mobile / 30px desktop, Carbon 24–32px) | WARN if <16 or >40 |
| Last field → submit button | ≥ field gap; 24–32px typical | WARN if < field gap |
| Internal gap < external gap (proximity) | ratio external/internal ≥ 1.5 (aim 2×) | WARN |
| Card padding | 16–24px (dense) / 24–32px (marketing). DSFR card 24–32px | WARN if <12 |
| Section spacing (marketing) | 64–128px desktop, 40–64px mobile | NOTE |
| Body text size | ≥16px marketing/reading; 14px OK for dense app UI; never <12px | WARN <14, FAIL-ish <12 |
| Body line-height | 1.4–1.6 (WCAG 1.4.12 tolerance target 1.5) | WARN outside 1.3–1.8 |
| Heading line-height | 1.1–1.3 | WARN >1.4 on ≥32px |
| Line length | 45–75 characters (66 ideal); hard WARN >90 or <30 | WARN |
| Distinct font sizes per screen | ≤ 6–8 (excl. icons) | WARN >8 |
| Font weights per screen | ≤ 3 per family | NOTE |
| Uppercase / small caps letter-spacing | +0.05 to +0.1em | NOTE |
| Large display (≥40px) letter-spacing | 0 to −0.02em | NOTE |
| Text contrast | ≥4.5:1 (≥3:1 if ≥24px or ≥18.66px bold) | **FAIL** |
| Non-text contrast (input borders, icons, focus ring) | ≥3:1 vs adjacent | **FAIL** |
| Target size | ≥24×24 CSS px (or spacing exception) | **FAIL** |
| Target size recommended | 44×44 (WCAG AAA / Apple), 48×48 (Material) | WARN on primary/touch controls |
| Focus indicator | visible on every focusable; ≥2px, ≥3:1 change | **FAIL** if none |
| Micro-interaction duration | 100–200ms (hover/press/toggle) | WARN >300 |
| Medium transitions (menus, dialogs) | 200–400ms | WARN >500 |
| prefers-reduced-motion | non-essential motion removed / ≤ opacity fades | **FAIL**-ish (2.3.3 is AAA; RGAA/brand expectation) |
| Dark background | not pure #000; ~#121212–#1E1E1E | NOTE |
| Accent usage | ≈10% of surface; 1 primary CTA per view | NOTE |

---

## 1. Spacing

### 1.1 Grid systems (base units)

| System | Base | Scale (px) | Source |
|---|---|---|---|
| Tailwind v4 | 4px (`--spacing: 0.25rem`; `p-1`=4px, `p-2`=8, `p-4`=16, `p-6`=24, `p-8`=32) | multiples of 4 | tailwindcss.com/docs/theme [K] |
| IBM Carbon | 2/4/8 | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 (`$spacing-01..13`) | carbondesignsystem.com [V] |
| Atlassian | 8 (with 2/4/6 sub-steps) | 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 (`space.025..1000`) | atlassian.design [V] |
| DSFR (French State) | 4px "v" unit, 8px "w" unit | `fr-mt-1v`=4, `2v`/`1w`=8, `3v`=12, `4v`/`2w`=16, `6v`/`3w`=24, `8v`/`4w`=32, … `15v`=60 | `@gouvfr/dsfr@1.12.1/dist/dsfr.min.css` [V] |
| GOV.UK | 5px | responsive: unit 1=5, 2=10, 3=15, 4=15→20, 5=15→25, 6=20→30, 7=25→40, 8=30→50, 9=40→60 (small→≥641px) | design-system.service.gov.uk/styles/spacing [V] |
| Material 3 | 4dp grid for components, 8dp for layout | 4, 8, 12, 16, 24, 32… | m3.material.io/foundations/layout [K] |
| Apple HIG | 8pt-based layout margins (16/20pt standard margins) | — | developer.apple.com/design/human-interface-guidelines/layout [K] |
| Refactoring UI | Hand-picked non-linear scale, adjacent steps differ ≥ ~25%: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256… "start with too much whitespace, then remove" | refactoringui.com [K] |

Rule (WARN): any `margin`/`padding`/`gap` not in `{0, 2, 4, 6} ∪ multiples of 4` → off-grid. (Exceptions every system allows: 1–2px border compensation, 6px — Atlassian & DSFR both document 2px/6px.) Borders cause `n±1px` values: subtract border widths before judging.

### 1.2 Form spacing (extracted from shipped CSS)

| Measurement | DSFR [V] | GOV.UK [V] | Carbon [K] | Recommended range |
|---|---|---|---|---|
| Label → input | 8px (`.fr-label+.fr-input{margin-top:.5rem}`) | 5px (`.govuk-label{margin-bottom:5px}`) | 8px (label `margin-bottom: $spacing-03`) | **4–8px** (≤12) |
| Label → hint | hint `margin-top:.75rem`... hint inside label, 12px font, 20px lh | hint `margin-top:-5px`, `margin-bottom:10–15px` | 4px helper text | 2–8px |
| Hint/helper → input | — | 10–15px | — | 4–12px |
| Input → error message | — | — | 4px | 4–8px |
| Field → field (form group) | 16px (`.fr-input-group{margin-bottom:1rem}`; `.fr-fieldset__element{margin-bottom:1rem}`) | 20px mobile / 30px ≥641px (`.govuk-form-group`) | 24–32px (`$spacing-06/07`) | **16–32px** |
| Fieldset / group of fields → next group | 24–40px | 30–50px | 32–48px | **≥1.5× field gap** |
| Last field → primary button | 16–24px+ | ≥20–30px (form-group margin) | 32px | **24–32px**, must be ≥ field gap |
| Input height | `padding:.5rem 1rem` + 24px lh = 40px | 40px (`height:2.5rem`) | 40px (md), 32 sm, 48 lg | **40–48px** (36 min dense) |
| Input horizontal padding | 16px | 5px (+2px border) | 16px | **12–16px** |
| Button height | 40px (`min-height:2.5rem`), sm 32, lg 48 | ~40px | 48 default, 40 field, 32 sm | **40–48px**, never <32 |
| Button padding | 8px 16px (lg 8 24) | 8px 10px | — | x ≥ 16px, y 8–12px |
| Input font size | 16px | 16→19px | 14px | **≥16px on mobile** (iOS Safari zooms on focus if <16px) [K] |

**The "cramped auth form" diagnosis:** typical failures are label→input 0–2px, field→field 4–8px (equals or less than label→input, so labels float ambiguously between fields), and button glued to last input (≤8px). Flag: `fieldGap < 16`, `fieldGap / labelGap < 1.5`, `buttonGap < fieldGap`.

### 1.3 Gestalt proximity (checkable)

Rule [K, Gestalt / NN/g "Proximity Principle in Visual Design"; Atlassian "place related elements closer together and unrelated farther apart" [V]]:
- `gap(label, its input)` < `gap(input, next label)` — **strictly**, ideally ≥ 2×.
- Heading → its content < previous content → heading. Practical: space *above* a heading ≈ 1.5–2× space *below* it.
- Cards in a grid: gap between cards ≥ 16px (usually 16–32px). Inside a card, element gaps (title→body 4–8px, body→actions 12–16px) must be smaller than the card's padding, or the content looks loose inside its own container.
- Button groups: gap 8–12px (Atlassian small range "between repeating elements such as button groups" = 2–8px [V]).
- Icon ↔ label in button: 4–8px.

### 1.4 Density per context

| Context | Body size | Component gap | Card padding | Section spacing | Source |
|---|---|---|---|---|---|
| Dense app / dashboard / tables | 14px (13 min) | 8–16px | 12–16px | 24–32px | Carbon "productive" type set (14px body-compact) [K]; Atlassian small/medium ranges [V]; Material density −1..−3 (−4dp each) [K] |
| Standard app (TalkUp dashboard, forms, agenda) | 14–16px | 12–24px | 16–24px | 32–48px | Atlassian medium 12–24 [V] |
| Marketing / landing / reading | 16–20px | 24–48px | 24–40px | 64–128px desktop, 48–64 mobile | Carbon "expressive"; Refactoring UI; Atlassian large 32–80 [V] |
| Auth forms | 16px | label 4–8, field 16–24, button 24–32 | 24–40px panel padding | — | DSFR / GOV.UK [V] |

Material 3 density: each density step removes 4dp of height; never reduce below the 48dp touch target (pad target, not visual) [K].

---

## 2. Typography

| Rule | Number | Source |
|---|---|---|
| Body minimum | 16px reading/marketing; 14px acceptable in dense app UI; 12px only for captions/meta; <12px = WARN-strong | GOV.UK body 16→19px [V]; DSFR `fr-text` 16/24 [V]; Carbon body-compact 14 [K]; Material body-medium 14, body-large 16 [K] |
| Form input text | ≥16px on mobile | iOS Safari auto-zoom behavior [K] |
| Type scale ratio | 1.125–1.25 for apps (minor/major third), 1.25–1.333 for marketing; adjacent sizes should differ ≥ ~2px / ≥ 1.125× | type-scale.com conventions [H]; Material 3 scale 11/12/14/16/22/24/28/32/36/45/57 [K] |
| DSFR scale (reference) | 16/24, 18/28, 20/28, 24/32, 28/36, 32/40, 40/48 (px, size/line-height) | dsfr.min.css [V] |
| Body line-height | 1.4–1.6 (1.5 target) | WCAG 1.4.12 uses 1.5 as the user override target [V]; DSFR 24/16=1.5 [V] |
| Headings line-height | 1.1–1.3 (shrink as size grows: 40px → 1.2, 24px → 1.3) | DSFR 48/40=1.2, 32/24=1.33 [V]; Refactoring UI "line-height inversely proportional to font size" [K] |
| Line length | 45–75 characters, ~66 ideal; up to 80 for CJK n/a; WCAG 1.4.8 (AAA) ≤80 chars | Bringhurst, *Elements of Typographic Style* [K]; Baymard Institute 50–75 [K]; WCAG 1.4.8 [K] |
| Paragraph spacing | ≥ 1× font size between paragraphs (WCAG override target 2×) | WCAG 1.4.12 [V] |
| Sizes per screen | ≤6–8 distinct font sizes; ≤3 weights per family (e.g. 400/500/700) | Refactoring UI "establish a type scale" [K]; [H] |
| Heading weight | 500–700 for headings; Saira is a display face: 600–700 at ≥24px, 500–600 for buttons | [H] |
| Hierarchy by more than size | use weight + color (text-weak tokens) before adding a new size | Refactoring UI [K] |
| UPPERCASE labels / eyebrows / buttons | letter-spacing +0.05em to +0.1em; ≤ 14px; short strings only | Material overline/button +0.1–1.5px tracking [K]; Refactoring UI [K] |
| Large display (≥40px) | letter-spacing 0 to −0.02em (Material display-large −0.25px) | Material 3 [K] |
| Text spacing robustness | content must survive line-height 1.5, paragraph 2em, letter 0.12em, word 0.16em without clipping | WCAG 2.2 SC 1.4.12 (AA) [V] |
| Text resize | usable at 200% zoom; reflow at 320 CSS px width without horizontal scroll | WCAG 1.4.4 / 1.4.10 (AA) [K] |
| Font sizes in rem | sizes in px block user font preferences in some browsers — prefer rem | [K] |

---

## 3. Accessibility

### 3.1 WCAG 2.2 AA — numeric success criteria

| SC | Level | Numeric rule | How to check |
|---|---|---|---|
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 text; 3:1 large text (≥24px regular or ≥18.66px/14pt bold); disabled/inactive & logos exempt | snippet §7.4 |
| 1.4.6 Contrast (Enhanced) | AAA | 7:1 / 4.5:1 | same |
| 1.4.11 Non-text Contrast | AA | 3:1 vs adjacent colors for UI component boundaries needed to identify the control, states (selected/focused), and meaningful graphics; 2.999 fails; inactive controls exempt; hover effects exempt | [V] snippet §7.4 on borders |
| 1.4.12 Text Spacing | AA | see §2 | inject override CSS, check overflow |
| 1.4.10 Reflow | AA | no 2-D scroll at 320 CSS px wide | `setViewportSize({width:320})`, `scrollWidth > clientWidth` |
| 2.4.7 Focus Visible | AA | any keyboard-operable UI has a visible focus indicator | snippet §7.6 |
| 2.4.11 Focus Not Obscured (Min) | AA (new 2.2) | focused element not *entirely* hidden by author content (sticky headers, cookie banners) | §7.6 checks `elementFromPoint` |
| 2.4.13 Focus Appearance | AAA | indicator area ≥ 2 CSS px perimeter of the unfocused component AND ≥3:1 change between focused/unfocused pixels | [V] — use as target: 2px solid ring, offset 2px, ≥3:1 vs background |
| 2.5.8 Target Size (Minimum) | AA (new 2.2) | ≥24×24 CSS px; or 24px-diameter circle centered on the target doesn't intersect another target / another undersized target's circle; exceptions: equivalent control, inline-in-text, user-agent-default, essential | [V] snippet §7.5 |
| 2.5.5 Target Size (Enhanced) | AAA | ≥44×44 CSS px | [V] |
| 2.3.3 Animation from Interactions | AAA | motion triggered by interaction can be disabled | `prefers-reduced-motion` |
| 2.2.2 Pause, Stop, Hide | A | auto-moving content >5s must be pausable | — |
| 2.3.1 Three Flashes | A | ≤3 flashes/second | — |
| 3.3.1 / 3.3.3 Error identification / suggestion | A / AA | errors described in text, not color alone | check error text exists + `aria-invalid`/`aria-describedby` |
| 3.3.8 Accessible Authentication (Min) | AA (new 2.2) | no cognitive test for login; allow paste / password managers | check `autocomplete="current-password"`, no `onpaste` block |
| 1.3.5 Identify Input Purpose | AA | `autocomplete` on personal-data inputs (`email`, `given-name`, `new-password`…) | DOM query |
| 1.4.1 Use of Color | A | color not sole cue (links in body text need underline or 3:1 vs surrounding text + non-color cue on hover/focus) | — |

Platform recommendations beyond WCAG: Apple HIG 44×44pt min hit target [K]; Material 48×48dp touch target, 8dp between targets [K]; DSFR buttons 32/40/48px heights [V].

Focus ring references from shipped CSS: DSFR `outline: 2px solid #0a76f6; outline-offset: 2px` on `:focus-visible` [V]; GOV.UK `outline:3px solid transparent` (for Windows High Contrast) + yellow `#fd0` background + `box-shadow: 0 4px #0b0c0c` [V]. Pattern worth copying: transparent outline + visible box-shadow ring so forced-colors mode still shows focus.

### 3.2 French legal context — RGAA 4.1.2 / EAA

- **RGAA 4.1.2** (Référentiel Général d'Amélioration de l'Accessibilité) is the French method for testing conformance; 106 criteria across 13 themes, aligned with WCAG 2.1 AA via EN 301 549 [K]. **RGAA 5** is announced/in preparation (DesignGouv articles reference "upcoming RGAA 5 changes") [V].
- Applies under Loi n°2005-102 art. 47 to: public bodies, organisations delegated a public service, and private companies with revenue > €250M (averaged over 3 years) [K; corroborated by blogdumoderateur, sk-web.fr — secondary sources].
- **European Accessibility Act** (Directive 2019/882) transposed in France, in force **28 June 2025**: extends obligations to private-sector e-commerce/consumer digital services; micro-enterprises (<10 staff and ≤ €2M turnover) exempt for services [secondary sources: consultation.avocat.fr, degaullefleurance.com]. Obligations: conformity, accessibility statement (déclaration d'accessibilité), multi-year plan for large orgs, sanctions (up to €50k per service for art. 47 non-compliance, per 2023 decree) [K].
- **For TalkUp.AI**: as a student micro-startup it is most likely *not* legally bound today, but RGAA/WCAG AA is the right engineering target (school/public partners, future B2B, EAA once it grows). Treat WCAG 2.2 AA as the FAIL bar.

### 3.3 design.numerique.gouv.fr ("DesignGouv", DINUM) — what it offers [V]

(`design.gouv.fr` does not resolve; the site is **https://design.numerique.gouv.fr/**.)

| Tool / method | URL | Use for the skill |
|---|---|---|
| **Diagnostic Flash** | /outils/diagnostic-flash/ | Quick partial accessibility estimate, no expertise needed — good model for an "audit-lite" pass |
| **Checklist Formulaires** | /outils/checklist-forms/ | Accessible/inclusive form good practices — directly relevant to auth forms |
| **Checklist dev** | /outils/checklist-dev/ | Quick self-tests for devs before delivery |
| **Mémo dev** / **Mémo design** | /outils/memo-dev/, /outils/memo-design/ | Key accessibility points per role |
| Checklist Pidila | /outils/checklist-pidila/ | Criteria merged from several frameworks |
| Checklist PDF | /outils/checklist-pdf/ | Accessible PDF export |
| **Audit rapide** | /outils/audit-rapide/ | Low-cost audit gauging site + team maturity |
| Jeu de l'OAA, Fiches métiers | /outils/jeu-de-oaa/, /outils/roles-cles/ | Awareness game, role sheets |
| **Ara** | https://ara.numerique.gouv.fr | Run RGAA audits, generate report and accessibility statement |
| **Assistant RGAA** (browser extension) | Firefox / Chrome stores | Brings RGAA 4.1 criteria and tests into the browser |
| Audit grid / report templates | accessibilite.numerique.gouv.fr/doc/rgaa4.1.2.modele-de-grille-d-audit.ods | Official RGAA spreadsheet |
| Example accessibility statement | /outils/exemple-declaration-accessibilite/ | Template |
| Disabled-user testing panel | via DINUM (≈30 testers, mostly visually impaired) | Real-user testing (public sector) |
| Legal framework, RGAA, schéma pluriannuel pages | /accessibilite-numerique/… | Legal context |
| Formations / ateliers | /formations/ | Trainings |
| Link to **DSFR** | https://www.systeme-de-design.gouv.fr/ | RGAA-conformant components; **use restricted to State websites** (TalkUp may borrow numbers, not the brand/Marianne font) |

### 3.4 Lighthouse accessibility audit

- Score = weighted average of pass/fail audits; each maps to an **axe-core** rule; weights 10/7/3 from axe impact; binary per audit (one failing button → whole "button-name" audit 0) [V].
- Weight-10 audits include: ARIA validity/roles/required attrs/IDs, `button-name`, `image-alt`, `input-button-name`, `label` (form elements have labels), `meta-viewport` (no `user-scalable=no`/`maximum-scale<5`), `select-name`, `td-has-header`, `video-caption` [V]. `color-contrast` is weighted 7 [K].
- **Misses**: manual audits are excluded from the score (logical tab order, focus traps, focus visible, offscreen content hidden, custom controls' keyboard support, heading order is low weight) [V]; no target-size-as-AA judgment (axe `target-size` rule exists but is not in the score by default) [K]; no spacing, typography rhythm, line length, motion, reduced-motion, state coverage; only the current state of a single page (no hover/focus/error states unless you script them); contrast over gradients/images reported as "incomplete". **100 ≠ accessible.**

CLI (Node 22+):
```bash
npx lighthouse http://localhost:8081/login \
  --only-categories=accessibility \
  --output=json --output=html --output-path=./lh/login \
  --chrome-flags="--headless=new" --preset=desktop --quiet
# Authenticated pages: pass cookies
npx lighthouse http://localhost:8081/dashboard --only-categories=accessibility \
  --extra-headers='{"Cookie":"access_token=...; refresh_token=..."}' \
  --disable-storage-reset --output=json --output-path=stdout --chrome-flags="--headless=new" \
  | jq '.categories.accessibility.score, [.audits[] | select(.score==0) | {id, title}]'
```
Dark mode run: add `--chrome-flags="--headless=new --force-dark-mode"` only if the app follows `prefers-color-scheme`; TalkUp uses a `.dark` class, so set the stored theme first (Playwright is easier).

### 3.5 axe-core (preferred over Lighthouse inside Playwright)

```ts
import AxeBuilder from '@axe-core/playwright';
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])
  .options({ rules: { 'target-size': { enabled: true } } })
  .analyze();
// results.violations[].{id, impact, nodes[].target, nodes[].failureSummary}
// results.incomplete = needs human review (contrast on images/gradients, etc.)
```
Without the npm dep: `await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' }); const r = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2aa','wcag22aa'] }));`
axe catches ~57% of issues by volume per Deque's own study [K]; run in both themes and in each state (open menu, error form).

---

## 4. Motion

| Rule | Number | Source |
|---|---|---|
| Material 3 durations | short1–4 = 50/100/150/200ms; medium1–4 = 250/300/350/400; long1–4 = 450/500/550/600; extra-long1–4 = 700–1000 | `@material/web` tokens `_md-sys-motion.scss` [V] |
| Material 3 easing | standard `cubic-bezier(0.2,0,0,1)`; standard-decelerate `(0,0,0,1)`; standard-accelerate `(0.3,0,1,1)`; emphasized-decelerate `(0.05,0.7,0.1,1)`; emphasized-accelerate `(0.3,0,0.8,0.15)`; legacy `(0.4,0,0.2,1)` | same [V] |
| Carbon durations | fast-01 70ms, fast-02 110, moderate-01 150, moderate-02 240, slow-01 400, slow-02 700 | carbondesignsystem.com/elements/motion [K] |
| Carbon easing | productive standard `(0.2,0,0.38,0.9)`, entrance `(0,0,0.38,0.9)`, exit `(0.2,0,1,0.9)`; expressive standard `(0.4,0.14,0.3,1)` | `@carbon/motion` [V] |
| Micro-interactions (hover, press, toggle, color) | 100–200ms | M3 short tokens; NN/g "Animation duration" (100–500ms, simple feedback ~100ms) [K] |
| Medium (dropdown, tooltip, accordion, toast) | 200–300ms | M3 medium [V] |
| Large (dialog, drawer, page transition) | 300–500ms; >500ms feels sluggish | M3 long; NN/g [K] |
| Exit faster than enter | exit ≈ 70–80% of enter duration; enter = decelerate, exit = accelerate | Material [K] |
| Size-scaled | larger travel distance → longer duration; mobile ~ 200–300ms, desktop ~ 150–200ms (desktop shorter) | Material [K] |
| Never `ease`/`linear` for UI movement | linear only for opacity/color loops/progress | [K] |
| Response-time limits | 0.1s feels instant; 1s keeps flow (show spinner/skeleton beyond ~1s, or after ~300ms delay to avoid flicker); 10s needs progress % + cancel | Nielsen, "Response Times: The 3 Important Limits" [K] |
| prefers-reduced-motion | under `reduce`: remove parallax, large translate/scale, auto-play, scroll-jacking; keep ≤200ms opacity fades or none | WCAG 2.3.3 (AAA) + MDN `prefers-reduced-motion` [K] |
| Tailwind pattern | `motion-safe:` / `motion-reduce:` variants; global fallback `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}` | [K] |

---

## 5. Color

| Rule | Number / heuristic | Source |
|---|---|---|
| 60-30-10 | ~60% neutral surface, ~30% secondary (sidebar, cards, text), ~10% accent | interior-design rule adopted in UI [H] |
| Accent restraint | one filled primary CTA per view/region; accent for actions + selection + focus, not decoration | Refactoring UI "not everything can be a button"; Material emphasis [K] |
| Palette size | each hue needs 5–10 shades; neutrals 8–10 greys; don't use grey text on colored bg — use a tint of the bg hue | Refactoring UI [K] |
| Semantic states | success/green, warning/amber, error/red, info/blue; never color alone (icon + text); error text ≥4.5:1 | WCAG 1.4.1; Carbon/Material [K] |
| Status color contrast | error/success *text* 4.5:1; status *icons/borders* 3:1 | WCAG 1.4.3 / 1.4.11 [V] |
| Dark: no pure black | base ~#121212 (Material), surfaces lighter as elevation increases (M2 overlay white 5% @1dp → 16% @24dp; M3 uses surface-container tones) | Material dark theme [K] |
| Dark: text | not pure #FFF on #000; high-emphasis ≈ 87% white, medium ≈ 60%, disabled ≈ 38% | Material [K] |
| Dark: accents desaturated | use lighter, less saturated tints (Material 200-tone range) so they hit 4.5:1 on dark and don't vibrate | Material [K] |
| Dark: shadows don't read | express elevation with lighter surfaces/borders, not shadows | Material / Apple HIG [K] |
| Dark: re-verify contrast | every token pair re-measured; borders often drop below 3:1 | WCAG [V] |

### 5.1 TalkUp tokens — quick contrast pass (computed this session from `web/src/styles/tailwind.css`)

| Pair | Ratio | Verdict |
|---|---|---|
| `--color-text-weakest` #a4a4b2 on #fff | **2.46** | FAIL for any text (OK only for disabled/placeholder decoration — placeholder text *is* text: fails) |
| #a4a4b2 on `--color-surface` #f8f9ff | **2.34** | FAIL |
| `--color-text-weaker` #5f5f77 on #f8f9ff | 5.90 | pass |
| `--color-accent` #2b70c9 on #fff (link) / white on accent (button) | 4.93 | pass (AA) |
| `--color-border` #d9dbeb on #fff | **1.37** | FAIL 1.4.11 *if* it's the only boundary of an input |
| `--color-border-strong` #c8c8d4 on #fff | **1.66** | FAIL 1.4.11 for input boundaries |
| dark `--color-text-weakest` #606068 on #1e1e1e | **2.68** | FAIL for text |
| dark `--color-text-weaker` #909098 on #1e1e1e | 5.26 | pass |
| dark accent #5a8fe8 on #1e1e1e | 5.18 | pass |
| dark `--color-text-accent` #2a2a3a on accent #5a8fe8 | **4.38** | FAIL for normal text (pass ≥24px / bold ≥18.66px) |

Input boundary note: 1.4.11 is satisfied if the input is identifiable by *some* 3:1 cue (e.g. filled background vs page ≥3:1, or bottom border). Light grey border on white alone fails. `--color-border-hover` #5f5f77 would pass (~6:1). Dark bg is #121212 (good, not pure black).

---

## 6. Interaction-state checklist

For every interactive component, the agent should force and screenshot each state (Playwright: `hover()`, `focus()` via Tab, `mouse.down()`, set `disabled`, mock slow network / empty / error responses).

| State | Requirement | Measurable check |
|---|---|---|
| Default | identifiable as interactive (affordance: button shape, underline for inline links) | link in body text: underline OR 3:1 vs body text + cue on hover/focus (WCAG F73/G183) |
| Hover | visible change (bg tint / underline); 100–150ms transition; hover-only info must also be available on focus/touch | computed style differs after `hover()`; WCAG 1.4.13 for hover content: dismissible, hoverable, persistent |
| Focus-visible | ≥2px ring, ≥3:1 vs adjacent bg, offset 2px, not clipped by `overflow:hidden`, not obscured by sticky UI; only on keyboard (`:focus-visible`) | §7.6 |
| Active / pressed | darker/scaled (scale 0.97–0.98) for ≤100ms; `aria-pressed` for toggles | style differs on `mouse.down()` |
| Selected / current | not color-only (weight, indicator bar, icon, `aria-current`/`aria-selected`) | DOM attr + style |
| Disabled | exempt from contrast, but **often an anti-pattern** (see below); if used: `aria-disabled="true"` (stays focusable) + explanation | — |
| Loading | button keeps width (no layout shift), shows spinner + text ("Connexion…"), disabled against double-submit briefly, `aria-busy`; show indicator after ~300ms, progress if >10s | width before == width after; CLS 0 |
| Skeleton | for content regions loading 300ms–10s; mirrors final layout (same heights → CLS ≈ 0); subtle shimmer ≤1.5s cycle, stops under reduced motion | compare skeleton block heights vs loaded |
| Empty | explains what goes here + primary action ("Aucune note — Créer une note"); illustration optional | text + CTA present when list length 0 |
| Error (field) | message adjacent to field (4–8px below), text + icon (not color only), `aria-invalid="true"`, `aria-describedby` → message; focus moved to first invalid field or error summary on submit | DOM checks |
| Error (page/network) | retry action, human message, no raw codes | — |
| Success | confirmation in context (toast ≥ 5s or persistent, `role="status"`/`aria-live="polite"`), not color-only | live region exists |
| Read-only | distinguishable from disabled; still selectable/copyable | — |

**Why disabled submit buttons are usually an anti-pattern** (Smashing Magazine, Vitaly Friedman 2021 [V]; also NN/g / Adam Silver "Form Design Patterns" [K]): no explanation of *what's missing*; often not focusable → invisible to screen-reader users; low contrast makes it hard to read; breaks when validation is buggy (dead end); conditional logic complexity; users retry randomly.
**Alternatives:** keep the button enabled and validate on submit → focus first error / error summary; sensible defaults; show unavailable options in context; if you must disable: `aria-disabled` + focusable + hint text, no `pointer-events:none`; disabling *briefly after click* to prevent double submission with a loading label is the legitimate case.

---

## 7. Measuring in a running page (Playwright `page.evaluate`)

All snippets are self-contained functions; pass them to `page.evaluate(fn, arg)`. They return JSON the agent can turn into "your spacing is 4px, norm is 16–32px" findings. Tested logic paths are plain DOM APIs (Chromium/Firefox/WebKit).

### 7.0 Shared helpers (inline into each evaluate, or `page.addInitScript` once)

```js
// Inject once per page: await page.addInitScript({ content: HELPERS }) or page.evaluate(HELPERS_FN)
window.__audit = (() => {
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0;
  };
  const sel = (el) => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && parts.length < 4; e = e.parentElement) {
      let p = e.tagName.toLowerCase();
      const tid = e.getAttribute('data-testid'); if (tid) { parts.unshift(`${p}[data-testid="${tid}"]`); break; }
      const cls = [...e.classList].slice(0, 2).map((c) => '.' + CSS.escape(c)).join('');
      const idx = e.parentElement ? [...e.parentElement.children].indexOf(e) + 1 : 1;
      parts.unshift(`${p}${cls}:nth-child(${idx})`);
    }
    return parts.join(' > ');
  };
  // Convert ANY CSS color (rgb, hex, oklch, color-mix, lab…) to [r,g,b,a] via canvas.
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  ctx.canvas.width = ctx.canvas.height = 1;
  const toRGBA = (css) => {
    if (!css || css === 'transparent') return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255];
  };
  const blend = (top, bottom) => { const a = top[3] + bottom[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a); };
  // Effective background = composite of ancestor backgrounds (ignores images/gradients -> flagged)
  const effectiveBg = (el) => {
    const layers = []; let hasImage = false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none') hasImage = true;
      const c = toRGBA(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let bg = [255, 255, 255, 1]; // canvas default
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return { rgb: bg, hasImage };
  };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const px = (v) => parseFloat(v) || 0;
  return { isVisible, sel, toRGBA, blend, effectiveBg, ratio, px };
})();
```

### 7.1 Vertical/horizontal gaps between visible siblings (the "spacing is Xpx" measurer)

```js
// await page.evaluate(measureGaps, 'form')  — returns gaps between consecutive visible children, recursively
function measureGaps(rootSelector) {
  const A = window.__audit; const out = [];
  const walk = (parent, depth) => {
    if (depth > 6) return;
    const kids = [...parent.children].filter(A.isVisible);
    const s = getComputedStyle(parent);
    const dir = (s.display.includes('flex') && s.flexDirection.startsWith('row')) ? 'x' : 'y';
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1].getBoundingClientRect(), b = kids[i].getBoundingClientRect();
      const gap = dir === 'y' ? b.top - a.bottom : b.left - a.right;
      if (Math.abs(gap) < 400 && (dir === 'x' ? Math.abs(a.top - b.top) < a.height : true))
        out.push({ parent: A.sel(parent), axis: dir, from: A.sel(kids[i - 1]), to: A.sel(kids[i]),
                   gap: Math.round(gap * 10) / 10, onGrid4: Math.round(gap) % 4 === 0 });
    }
    kids.forEach((k) => walk(k, depth + 1));
  };
  document.querySelectorAll(rootSelector).forEach((r) => walk(r, 0));
  return out;
}
```

### 7.2 Form anatomy audit: label↔input, field↔field, last field↔button, proximity ratio

```js
// await page.evaluate(auditForm, 'form')
function auditForm(formSel) {
  const A = window.__audit;
  return [...document.querySelectorAll(formSel)].map((form) => {
    const controls = [...form.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(A.isVisible);
    const fields = controls.map((c) => {
      const label = (c.id && form.querySelector(`label[for="${CSS.escape(c.id)}"]`)) || c.closest('label')
        || (c.getAttribute('aria-labelledby') && document.getElementById(c.getAttribute('aria-labelledby')));
      const cr = c.getBoundingClientRect(); const lr = label && label !== c.closest('label') ? label.getBoundingClientRect() : null;
      const cs = getComputedStyle(c);
      return { control: A.sel(c), hasLabel: !!label, placeholderOnly: !label && !!c.placeholder,
        labelToInput: lr ? Math.round(cr.top - lr.bottom) : null,
        top: lr ? Math.min(lr.top, cr.top) : cr.top, bottom: cr.bottom,
        inputHeight: Math.round(cr.height), inputFontSize: A.px(cs.fontSize),
        padX: A.px(cs.paddingLeft), autocomplete: c.getAttribute('autocomplete') };
    });
    // bottom of each field "group" = lowest of control / its hint / error sibling inside the same wrapper
    const fieldGaps = fields.slice(1).map((f, i) => Math.round(f.top - fields[i].bottom));
    const btn = [...form.querySelectorAll('button,[type=submit]')].filter(A.isVisible)
      .find((b) => b.type === 'submit' || b.getAttribute('type') === null) ;
    const btnGap = btn && fields.length ? Math.round(btn.getBoundingClientRect().top - fields.at(-1).bottom) : null;
    const labelGaps = fields.map((f) => f.labelToInput).filter((v) => v !== null);
    const minField = fieldGaps.length ? Math.min(...fieldGaps) : null;
    const maxLabel = labelGaps.length ? Math.max(...labelGaps) : null;
    const findings = [];
    labelGaps.forEach((g, i) => { if (g < 4 || g > 12) findings.push(`label→input ${g}px on ${fields[i].control}; norm 4–8px (DSFR 8, GOV.UK 5)`); });
    fieldGaps.forEach((g, i) => { if (g < 16 || g > 40) findings.push(`field→field ${g}px after ${fields[i].control}; norm 16–32px (DSFR 16, GOV.UK 20–30)`); });
    if (minField !== null && maxLabel !== null && minField / Math.max(maxLabel, 1) < 1.5)
      findings.push(`proximity: field gap ${minField}px vs label gap ${maxLabel}px (ratio <1.5) — labels look detached`);
    if (btnGap !== null && minField !== null && btnGap < minField) findings.push(`button gap ${btnGap}px < field gap ${minField}px; norm 24–32px`);
    fields.forEach((f) => {
      if (f.inputHeight < 36) findings.push(`input height ${f.inputHeight}px on ${f.control}; norm 40–48px`);
      if (f.inputFontSize < 16) findings.push(`input font ${f.inputFontSize}px on ${f.control}; <16px triggers iOS zoom`);
      if (!f.hasLabel) findings.push(`no programmatic label on ${f.control}${f.placeholderOnly ? ' (placeholder-only)' : ''}`);
    });
    return { form: A.sel(form), fields, fieldGaps, btnGap, findings };
  });
}
```
Note: if labels/hints/errors are wrapped together, replace `fields[i].bottom` with the wrapper's `getBoundingClientRect().bottom` (find via `c.closest('[class*=field],[class*=group],div')`).

### 7.3 Typography inventory (sizes, weights, line-heights, families, letter-spacing, line length)

```js
// await page.evaluate(auditType)
function auditType() {
  const A = window.__audit; const seen = new Map(); const issues = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
    { acceptNode: (n) => n.textContent.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const els = new Set(); for (let n; (n = walker.nextNode());) if (n.parentElement && A.isVisible(n.parentElement)) els.add(n.parentElement);
  const m = document.createElement('canvas').getContext('2d');
  for (const el of els) {
    const s = getComputedStyle(el); const fs = A.px(s.fontSize);
    const lh = s.lineHeight === 'normal' ? fs * 1.2 : A.px(s.lineHeight);
    const key = `${fs}|${s.fontWeight}|${s.fontFamily.split(',')[0]}`;
    seen.set(key, (seen.get(key) || 0) + 1);
    const text = el.innerText?.trim() || ''; const ratio = lh / fs;
    const isBlock = /^(P|LI|DD|BLOCKQUOTE|TD)$/.test(el.tagName) || (s.display === 'block' && text.length > 120);
    if (fs < 12) issues.push({ el: A.sel(el), rule: 'min-size', value: fs, norm: '≥12px (≥14 UI, ≥16 reading)' });
    if (isBlock && text.length > 80) {
      if (ratio < 1.3 || ratio > 1.8) issues.push({ el: A.sel(el), rule: 'body-line-height', value: +ratio.toFixed(2), norm: '1.4–1.6' });
      // characters per line ≈ content width / average char width of this font
      m.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const avg = m.measureText('abcdefghijklmnopqrstuvwxyz ').width / 27;
      const width = el.getBoundingClientRect().width - A.px(s.paddingLeft) - A.px(s.paddingRight);
      const cpl = Math.round(width / avg);
      if (cpl > 90 || cpl < 30) issues.push({ el: A.sel(el), rule: 'line-length', value: cpl, norm: '45–75 chars' });
    }
    if (/^H[1-6]$/.test(el.tagName) && fs >= 32 && ratio > 1.4) issues.push({ el: A.sel(el), rule: 'heading-line-height', value: +ratio.toFixed(2), norm: '1.1–1.3' });
    if (s.textTransform === 'uppercase' && text.length > 3 && A.px(s.letterSpacing) / fs < 0.03)
      issues.push({ el: A.sel(el), rule: 'caps-tracking', value: s.letterSpacing, norm: '+0.05–0.1em' });
  }
  const sizes = [...new Set([...seen.keys()].map((k) => +k.split('|')[0]))].sort((a, b) => a - b);
  const weights = [...new Set([...seen.keys()].map((k) => k.split('|')[1]))];
  const families = [...new Set([...seen.keys()].map((k) => k.split('|')[2]))];
  if (sizes.length > 8) issues.push({ rule: 'too-many-sizes', value: sizes, norm: '≤6–8 per screen' });
  const close = sizes.filter((v, i) => i && v - sizes[i - 1] < 2);
  if (close.length) issues.push({ rule: 'near-duplicate-sizes', value: close, norm: 'adjacent steps ≥2px / ×1.125' });
  return { sizes, weights, families, combos: Object.fromEntries(seen), issues };
}
```
Exact line length alternative (precise, slower): wrap the text in a `Range`, `range.getClientRects()` gives one rect per line box; count chars by binary-searching offsets per line. The width/avg-char method is within ~10% and enough for a WARN.

### 7.4 Text contrast + non-text contrast (borders of inputs)

```js
// await page.evaluate(auditContrast)
function auditContrast() {
  const A = window.__audit; const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
    { acceptNode: (n) => n.textContent.trim() ? 1 : 2 });
  const els = new Set(); for (let n; (n = walker.nextNode());) if (n.parentElement && A.isVisible(n.parentElement)) els.add(n.parentElement);
  for (const el of els) {
    const s = getComputedStyle(el);
    if (el.closest('[disabled],[aria-disabled="true"]')) continue; // 1.4.3 exempts inactive UI
    const { rgb: bg, hasImage } = A.effectiveBg(el);
    const fgRaw = A.toRGBA(s.color); const fg = A.blend([...fgRaw.slice(0, 3), fgRaw[3] * +s.opacity], bg);
    const r = A.ratio(fg, bg); const fs = A.px(s.fontSize); const bold = +s.fontWeight >= 700;
    const large = fs >= 24 || (bold && fs >= 18.66); const need = large ? 3 : 4.5;
    if (r < need) out.push({ el: A.sel(el), text: el.innerText.trim().slice(0, 40), ratio: +r.toFixed(2), need,
      fg: s.color, bg: `rgb(${bg.slice(0, 3).map(Math.round)})`, fontSize: fs, uncertain: hasImage });
  }
  // placeholders are text too
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach((el) => {
    const c = getComputedStyle(el, '::placeholder').color; const bg = A.effectiveBg(el).rgb;
    const r = A.ratio(A.blend(A.toRGBA(c), bg), bg);
    if (r < 4.5) out.push({ el: A.sel(el), text: `placeholder "${el.placeholder}"`, ratio: +r.toFixed(2), need: 4.5 });
  });
  // 1.4.11: control boundary vs the background *around* the control
  document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea').forEach((el) => {
    if (!A.isVisible(el) || el.disabled) return;
    const s = getComputedStyle(el); const outside = A.effectiveBg(el.parentElement).rgb;
    const fill = A.blend(A.toRGBA(s.backgroundColor), outside);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((d) => A.px(s[`border${d}Width`]) > 0)
      .map((d) => A.ratio(A.blend(A.toRGBA(s[`border${d}Color`]), outside), outside));
    const best = Math.max(A.ratio(fill, outside), ...sides, 1);
    if (best < 3) out.push({ el: A.sel(el), rule: '1.4.11 non-text', ratio: +best.toFixed(2), need: 3,
      border: s.borderColor, fill: s.backgroundColor });
  });
  return out;
}
```
Limits: ignores `background-image`/gradients (flagged `uncertain`), `mix-blend-mode`, text-shadow, and elements positioned over unrelated siblings. For those, fall back to screenshot pixel sampling or axe `incomplete`.

### 7.5 Target size (WCAG 2.5.8 with spacing exception)

```js
// await page.evaluate(auditTargets)
function auditTargets() {
  const A = window.__audit;
  const q = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[tabindex]:not([tabindex="-1"])';
  const t = [...document.querySelectorAll(q)].filter(A.isVisible).map((el) => {
    // include associated <label> as part of the hit area for checkbox/radio
    let r = el.getBoundingClientRect();
    const lab = el.labels?.[0]; if (lab) { const l = lab.getBoundingClientRect();
      r = { left: Math.min(r.left, l.left), top: Math.min(r.top, l.top), right: Math.max(r.right, l.right), bottom: Math.max(r.bottom, l.bottom) };
      r.width = r.right - r.left; r.height = r.bottom - r.top; }
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && /\S/.test(el.parentElement?.textContent.replace(el.textContent, '') || '');
    return { el, r, cx: r.left + r.width / 2, cy: r.top + r.height / 2, small: r.width < 24 || r.height < 24, inline };
  });
  const distToRect = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  return t.filter((a) => a.small && !a.inline).map((a) => {
    // spacing exception: 24px circle on a doesn't hit another target, nor another small target's circle
    const conflict = t.find((b) => b !== a && (b.small ? Math.hypot(a.cx - b.cx, a.cy - b.cy) < 24 : distToRect(a.cx, a.cy, b.r) < 12));
    return { el: A.sel(a.el), w: Math.round(a.r.width), h: Math.round(a.r.height),
      verdict: conflict ? 'FAIL 2.5.8' : 'pass via spacing exception (WARN: <44px recommended)',
      conflictsWith: conflict ? A.sel(conflict.el) : null };
  }).concat(t.filter((a) => !a.small && (a.r.width < 44 || a.r.height < 44) && a.el.matches('button,[role=button],[type=submit]'))
    .map((a) => ({ el: A.sel(a.el), w: Math.round(a.r.width), h: Math.round(a.r.height), verdict: 'WARN <44×44 (AAA/Apple/Material 48)' })));
}
```

### 7.6 Focus visibility, obscuring and ring contrast (driven by real Tab presses)

```ts
// Playwright (TS). Compares styles before/after keyboard focus; checks the element isn't covered.
async function auditFocus(page, maxTabs = 60) {
  const results = [];
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const A = (window as any).__audit; const el = document.activeElement as HTMLElement;
      if (!el || el === document.body) return null;
      const f = getComputedStyle(el);
      const focused = { outline: `${f.outlineStyle} ${f.outlineWidth} ${f.outlineColor}`, shadow: f.boxShadow, bg: f.backgroundColor, border: f.borderColor };
      // unfocused snapshot: clone styles by temporarily blurring is unreliable -> compare against a sibling-like default:
      const hasRing = (f.outlineStyle !== 'none' && parseFloat(f.outlineWidth) >= 1) || (f.boxShadow !== 'none');
      const ringColor = f.outlineStyle !== 'none' ? f.outlineColor : (f.boxShadow.match(/rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+/i) || [null])[0];
      const bg = A.effectiveBg(el.parentElement || el).rgb;
      const ringRatio = ringColor ? A.ratio(A.blend(A.toRGBA(ringColor), bg), bg) : null;
      const rect = el.getBoundingClientRect(); el.scrollIntoView({ block: 'nearest' });
      const pts = [[rect.left + 2, rect.top + 2], [rect.right - 2, rect.bottom - 2], [rect.left + rect.width / 2, rect.top + rect.height / 2]];
      const covered = pts.every(([x, y]) => { const h = document.elementFromPoint(x, y); return h && h !== el && !el.contains(h) && !h.contains(el); });
      return { el: A.sel(el), tag: el.tagName, hasRing, ringWidth: f.outlineWidth, ringRatio: ringRatio && +ringRatio.toFixed(2), focused, obscured: covered };
    });
    if (!r) break;
    if (results.length && results[0].el === r.el) break; // wrapped around
    results.push(r);
  }
  return results.map((r) => ({ ...r, verdict:
    r.obscured ? 'FAIL 2.4.11 focus obscured' : !r.hasRing ? 'CHECK 2.4.7 no outline/shadow (maybe bg/border change — screenshot)' :
    r.ringRatio !== null && r.ringRatio < 3 ? 'FAIL 1.4.11 focus ring <3:1' : 'ok' }));
}
```
Stronger 2.4.13 check: `el.screenshot()` focused vs after `blur()`, diff pixels with `pixelmatch`; changed-pixel count ≥ 2px × perimeter and ≥3:1 per changed pixel.

### 7.7 Spacing-on-grid sweep (margins, paddings, gaps)

```js
// await page.evaluate(auditGrid, 4)
function auditGrid(base = 4) {
  const A = window.__audit; const off = {}; const allowed = new Set([0, 1, 2, 6]);
  for (const el of document.querySelectorAll('body *')) {
    if (!A.isVisible(el)) continue; const s = getComputedStyle(el);
    for (const p of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'rowGap', 'columnGap']) {
      const v = Math.round(Math.abs(A.px(s[p])) * 100) / 100;
      if (!v || allowed.has(v) || v % base === 0) continue;
      if (v > 0 && v < 1) continue;
      (off[v] ||= []).length < 5 && off[v].push(`${A.sel(el)} ${p}`);
    }
  }
  return off; // { "5": ["div.card > p margin-bottom", ...], "13.5": [...] }
}
```

### 7.8 Motion: durations, easing, and reduced-motion compliance

```ts
async function auditMotion(page) {
  const collect = () => page.evaluate(() => {
    const A = (window as any).__audit; const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      const durs = s.transitionDuration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000));
      const max = Math.max(...durs);
      if (max > 0) out.push({ el: A.sel(el), prop: s.transitionProperty, ms: max, easing: s.transitionTimingFunction });
      if (s.animationName !== 'none') out.push({ el: A.sel(el), anim: s.animationName,
        ms: parseFloat(s.animationDuration) * (s.animationDuration.includes('ms') ? 1 : 1000), iter: s.animationIterationCount });
    }
    const running = document.getAnimations().map((a) => ({ name: (a as any).animationName || (a as any).transitionProperty, ms: a.effect?.getTiming().duration }));
    return { declared: out, running };
  });
  const normal = await collect();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await collect();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const flags = normal.declared.filter((d) => d.ms > 500 && !d.anim).map((d) => `${d.el}: ${d.ms}ms transition (norm 100–400ms)`)
    .concat(normal.declared.filter((d) => /linear|^ease$/.test(d.easing || '') && /transform|translate|top|left/.test(d.prop || '')).map((d) => `${d.el}: ${d.easing} on movement; use decelerate/standard curve`))
    .concat(reduced.declared.filter((d) => (d.anim && d.ms > 10 && d.iter === 'infinite') || (d.ms > 200 && /transform|all/.test(d.prop || '')))
      .map((d) => `${d.el}: still animating under prefers-reduced-motion (${d.anim || d.prop} ${d.ms}ms)`));
  return { normal, reduced, flags };
}
```

### 7.9 Text-spacing (1.4.12) and reflow (1.4.10) stress tests

```ts
// 1.4.12: inject the WCAG overrides and detect clipped/overflowing text
await page.addStyleTag({ content: `*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}` });
const clipped = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => {
  const s = getComputedStyle(el); const h = el as HTMLElement;
  return (s.overflow.includes('hidden') || s.textOverflow === 'ellipsis' || s.webkitLineClamp !== 'none')
    && (h.scrollHeight > h.clientHeight + 1 || h.scrollWidth > h.clientWidth + 1) && h.innerText?.trim();
}).map((el) => (window as any).__audit.sel(el)));
// 1.4.10: no horizontal scroll at 320px
await page.setViewportSize({ width: 320, height: 640 });
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
```

### 7.10 Running everything in both themes (TalkUp uses a `.dark` class)

```ts
for (const theme of ['light', 'dark'] as const) {
  await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
  await page.waitForTimeout(250); // let color transitions finish before measuring contrast
  const report = {
    theme,
    contrast: await page.evaluate(auditContrast),
    form: await page.evaluate(auditForm, 'form'),
    type: await page.evaluate(auditType),
    targets: await page.evaluate(auditTargets),
    grid: await page.evaluate(auditGrid, 4),
  };
  console.log(JSON.stringify(report, null, 2));
}
```
(Check how the app persists theme — e.g. a Zustand/localStorage key — and set it via `addInitScript` so reloads keep the theme. Disable transitions while measuring: `addStyleTag({content:'*{transition:none!important}'})` for contrast, but NOT for the motion audit.)

### 7.11 Turning measurements into designer-style findings

Template the skill should emit:
> **[WARN] Spacing — login form, field→field gap is 8px (`#email` → `#password`). Norm: 16–32px (DSFR 16px, GOV.UK 20–30px). Label→input is 6px, so the ratio is 1.3 (want ≥1.5): labels read as belonging to the field above. Fix: `gap-6` (24px) on the field stack, keep `gap-2` (8px) label→input, `mt-8` (32px) before the submit button.**

Always state: measured value, the selector, the norm range, 1–2 named sources, a Tailwind-token fix (4px base: `1`=4, `2`=8, `3`=12, `4`=16, `5`=20, `6`=24, `8`=32, `10`=40, `12`=48, `16`=64).

---

## 8. Sources

Primary, verified this session:
- WCAG 2.2 Understanding 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 Understanding 2.4.13 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- WCAG 2.2 Understanding 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- WCAG 2.2 Understanding 1.4.12 Text Spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- IBM Carbon spacing: https://carbondesignsystem.com/elements/spacing/overview/
- Atlassian spacing: https://atlassian.design/foundations/spacing
- GOV.UK Design System spacing: https://design-system.service.gov.uk/styles/spacing/
- GOV.UK Frontend shipped CSS (form-group, label, hint, input, focus values): https://unpkg.com/govuk-frontend@5.7.1/dist/govuk/govuk-frontend.min.css
- DSFR shipped CSS v1.12.1 (spacing utilities, `.fr-input-group`, `.fr-label+.fr-input`, `.fr-btn`, focus ring, type sizes): https://unpkg.com/@gouvfr/dsfr@1.12.1/dist/dsfr.min.css — docs: https://www.systeme-de-design.gouv.fr/ (403 to bots)
- Material 3 motion tokens (`@material/web`): https://cdn.jsdelivr.net/npm/@material/web@2.2.0/tokens/v0_192/_md-sys-motion.scss — docs: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- Carbon motion (`@carbon/motion`): https://carbondesignsystem.com/elements/motion/overview/
- DesignGouv (DINUM): https://design.numerique.gouv.fr/ , tools https://design.numerique.gouv.fr/outils/ , accessibility https://design.numerique.gouv.fr/accessibilite-numerique/
- Ara audit tool: https://ara.numerique.gouv.fr
- RGAA 4.1.2 audit grid: https://accessibilite.numerique.gouv.fr/doc/rgaa4.1.2.modele-de-grille-d-audit.ods ; RGAA: https://accessibilite.numerique.gouv.fr/
- Lighthouse accessibility scoring: https://developer.chrome.com/docs/lighthouse/accessibility/scoring
- Lighthouse CLI readme: https://github.com/GoogleChrome/lighthouse/blob/main/readme.md
- Smashing Magazine, "Frustrating Design Patterns: Disabled Buttons": https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/

Established references (recalled, not re-fetched; cite as such):
- Material 3 layout / density / type scale: https://m3.material.io/foundations/layout/understanding-layout , https://m3.material.io/styles/typography/type-scale-tokens
- Material dark theme (#121212, elevation overlays, 87/60/38% text): https://m2.material.io/design/color/dark-theme.html
- Apple HIG layout & accessibility (44×44pt): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Refactoring UI (Wathan & Schoger): https://www.refactoringui.com/
- Tailwind v4 theme / spacing: https://tailwindcss.com/docs/theme
- Baymard line length: https://baymard.com/blog/line-length-readability
- Bringhurst, *The Elements of Typographic Style* (45–75 chars)
- NN/g Response time limits: https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g Animation duration: https://www.nngroup.com/articles/animation-duration/
- NN/g Proximity: https://www.nngroup.com/articles/gestalt-proximity/
- MDN prefers-reduced-motion: https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
- axe-core rules: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md ; @axe-core/playwright: https://www.npmjs.com/package/@axe-core/playwright
- Adam Silver, *Form Design Patterns* (disabled buttons, labels, errors)

Secondary (legal context — verify on Légifrance before any compliance claim):
- https://www.blogdumoderateur.com/accessibilite-web-2025-rgaa-nouvelles-regles/
- https://consultation.avocat.fr/blog/axelle-offroy/article-2976840-accessibilite-aux-produits-et-amp-services-numeriques-une-obligation-incontournable-pour-les-entreprises-privees-depuis-le-28-juin-2025.html
- https://www.degaullefleurance.com/en/actualites/digital-accessibility-new-obligations-for-the-private-sector/
- https://sk-web.fr/article/rgaa-obligations-2026
