# AI-look tells

**Read this when:** reviewing your own pistes before showing them (phase 2), and in the critique (phase 6).
**What it is:** what makes a screen read as "made by an AI", each with what to do instead. Items marked `tells.mjs:<id>` are caught by `node scripts/tells.mjs --diff`; the rest need your eye.
**Sources:** `docs/design/research/research-taste-ai-look.md` §1 (Anthropic frontend-design, Impeccable, Krebs' Show HN scoring, NN/g, Vercel/Rauno guidelines), and the seminar designer.

## Why this happens, and why a ban list is not enough

Models produce the **most likely** design for a prompt: the same defaults whatever the subject ("distributional convergence"). Ban one default and the model slides to the next one (Anthropic saw Inter replaced by Space Grotesk; the 2026 defaults are cream + serif + terracotta, near-black + acid green, broadsheet hairlines). Krebs scored 1,590 Show HN pages: 22 % had 4 or more of these tells.

So the fix is **a decision process anchored in the subject**, not this list alone:
1. Frame the screen from TalkUp's users and their task (phase 0).
2. Look at real references (phase 1).
3. After drafting, ask of each choice: "would I have produced this for any SaaS?" If yes, change it and say what changed.
4. Then run this list as a last net.

A technique is not a tell by itself; **the default applied regardless of subject** is. A round avatar is right; a round button is a tell.

## Contents
1. Colour and surface
2. Typography
3. Layout and composition
4. Icons and images
5. Motion
6. Copy
7. Code and system
8. TalkUp-specific (from the seminar)

## 1. Colour and surface

| Tell | Instead |
|---|---|
| Purple / indigo / violet accent or gradient (`tells.mjs:raw-palette`) | Project tokens only. TalkUp's accent is blue `accent`, navy `primary`. |
| Gradients: gradient text (`gradient-text`), gradient buttons and washes (`gradient-bg`) | Flat surfaces. Emphasis from size, weight, space. The seminar removed the chatbot gradient. |
| Coloured glows and aurora blobs (`glow-shadow`) | Depth from surface steps (light) or lightness (dark). TalkUp's dark glow is only for large titles and illustrations. |
| Glassmorphism by default (`glass`) | Opaque surfaces. |
| Five saturated colours at equal weight | One accent, neutrals, status colours only for status. |
| Coloured left-border stripes on cards and callouts | Group with space and a heading; status as a labelled badge. |
| Decorative status dots that map to no state | Every dot is a real state, explained in text, or deleted. |
| Grey text on a coloured background | A tint of that background's hue, or `text-on-accent`. |
| Hardcoded colour literals (`hex-literal`), white that flips in dark (`text-white-in-dark`) | Tokens: `text-on-accent`, `text-on-media`, `bg-surface-*`. |

## 2. Typography

| Tell | Instead |
|---|---|
| Too many sizes and weights ("trop de variantes de typo … créé par l'IA") | ≤ 5–6 sizes per screen from the `text-*` scale; hierarchy via weight and colour first. |
| Timid hierarchy (400 vs 600, 14 vs 16 everywhere) | Clear steps; the most important thing is unmistakably the biggest. Squint test. |
| A new "distinctive" font | Never. Saira + Inter. Taste here comes from hierarchy, not a typeface. |
| One accented word in a headline (italic, colour, gradient) | One treatment for the whole headline. |
| ALL-CAPS tracked eyebrow above every heading (`eyebrow-caps`) | Delete it. A label only if it states something true (a column name like "Interview" may be uppercase, sparingly). |
| "A · B · C" meta strings, "Word — fragment", mono labels "to look technical" | Normal sentences and labels. Mono only for code and data. |
| No `tabular-nums` on scores, timers, tables | `tabular-nums` wherever numbers line up or change. |
| Title Case Everywhere | Sentence case (English and French). |

## 3. Layout and composition

| Tell | Instead |
|---|---|
| Centered hero: pill badge "✨ New" → huge H1 → grey subline → two buttons → glowing screenshot | Lead with a real product moment (an interview question with feedback, a CV ↔ offer match). Left-aligned reading axis. |
| Three identical icon-on-top feature cards, repeated per section | Vary by content: a list, a split with a real UI fragment, a table, one strong statement. |
| Everything in a card; cards in cards | Group with space and type. Cards only for things users act on one by one (an application, a note). Never nest. |
| Stat banner ("10k+ users · 98 % satisfaction") | Real numbers with context, or nothing. |
| 01 / 02 / 03 numbering on things that are not a sequence | Number only real sequences, and make them functional (current step, progress). The seminar replaced numerals with spot illustrations. |
| Uniform spacing everywhere (`gap-6` between all) | Tight inside groups, generous between; more air above headings. |
| App screens styled like a landing page | Operate mode: shell, work area, data, states first. |
| Modal by reflex | Inline expansion, side panel (pushes, never covers), or a page. |
| Floating chat bubble in a corner | TalkUp's assistant is a column in the shell (see `ai-assistant-ux.md`). |

## 4. Icons and images

| Tell | Instead |
|---|---|
| Emoji as icons or decoration (`emoji`) | The `Icon` atom for functions; seminar-style illustrations for emotional moments. |
| Sparkles / Zap / Rocket / Wand as "AI" (`decor-icon`) | Show what the AI does: Tali's avatar, a verb, the result. |
| Tinted rounded tile behind every icon | Icons only where they help scanning; no decorative tile. |
| Abstract 3D blobs, orbs, fake dashboards, grain | Real product UI with realistic content. |
| Sticker-like illustrations, decoration with no value | Illustrations with volume and intent, readable in both themes, only for emotional moments. |

## 5. Motion

| Tell | Instead |
|---|---|
| Fade-and-slide-up on every section; hover lift on every card | Motion answers an action and shows what changed (panel pushes, renamed card flashes). |
| `transition: all` (`transition-all`), long or bouncy easing | Name the property; 100–200 ms ease-out; no animation on frequent or keyboard actions; respect reduced motion. |

## 6. Copy

| Tell | Instead |
|---|---|
| Buzzwords: unlock, supercharge, seamless, elevate, revolutionize; booster, révolutionner, propulsé par l'IA (`buzzword`) | What it does, for whom, with a concrete noun: "Compare your CV with the offer in 2 minutes." |
| "Submit", "Get started", "Learn more →" (`arrow-cta`) | Verb + object, same verb through the flow (button "Save note" → toast "Note saved"). |
| Lorem ipsum, John Doe, round fake numbers | Realistic content at real length: "Ingénieur logiciel backend (Go) chez Qonto", 3-line titles, 42 applications. |
| Vague apologetic errors, "Nothing here" empty states | Errors: problem + fix. Empty states: why + first action. |
| Labels describing abstract stages ("Upload, Analysis, Confirmation") | Describe what will actually happen (seminar C1). |

## 7. Code and system

- Stock component-library defaults (one radius everywhere, `slate` neutrals, default ring).
- One-off radii (`arbitrary-radius`) and pill buttons (`pill-button`): TalkUp is 8 px buttons, 12 px cards.
- Missing states: hover, focus-visible, active, disabled, loading, empty, error.
- Unthemed browser surfaces: selection, focus ring, caret, scrollbars.

## 8. TalkUp-specific (from the seminar)

- Pill buttons: « la rondeur des boutons fait très IA slop ».
- Offset shadows: « Supprimer l'ombre décalée si elle n'apporte rien ».
- Text used as page background decoration: « attention à habiller une page avec du texte en background ».
- Green on non-success elements; colour on non-interactive labels.
- Strong hover colours.
- A floating gradient assistant bubble.

## Self-check before showing pistes

1. Cover the TalkUp logo: could this be any AI SaaS? If yes, what is the one element that makes it TalkUp, and is it strong enough?
2. Count sizes, weights, colours, radii on the screen.
3. Read every string aloud: would a recruiter or a student say it?
4. Run `tells.mjs` on the piste file (`node scripts/tells.mjs docs/design/pistes/<slug>/index.html`).
