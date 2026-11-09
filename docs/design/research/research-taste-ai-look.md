# Research: UI taste, "AI look" tells, and AI-assistant UX (for a TalkUp.AI design skill)

Date: 2026-11-07. Scope: web research to ground a Claude Code skill that stands in for a designer on TalkUp.AI (React 19 + Tailwind v4, French students preparing applications/interviews with an AI assistant).

Source quality note: the strongest evidence is (a) Adrian Krebs' deterministic audit of ~1,590 Show HN pages (HN, Apr 2026), (b) Anthropic's own frontend-design skill and article, (c) Muzli's data-driven sameness study, (d) NN/g articles, (e) Microsoft HAX (CHI 2019, validated), Linear AIG. Most "N signs of vibe-coded UI" blogs are opinion; they converge, which is itself the signal. French creators (Basti UI, Cacatoès, Cléa Cassutti) have little written, indexable doctrine; see §2.6.

---

## 0. TL;DR for the skill author

1. The "AI look" is not one style, it is **defaults applied regardless of subject** (Anthropic calls it *distributional convergence*). Bans alone fail: models drift to the *next* default (Anthropic saw Space Grotesk replace Inter; the 2026 tells are cream+serif+terracotta, near-black+acid-green, broadsheet hairlines). The skill must force **decisions derived from the subject**, not just an avoid-list.
2. Most tells are **mechanically detectable** (Krebs, Impeccable's 62-rule detector). The skill should include a self-audit checklist with grep-able/computed checks, run against the rendered page.
3. TalkUp is an **Operate** surface (app UI) more than a Persuade surface. On app UI, taste = precision, restraint, hierarchy, states, copy, craft details; not effects. Brand lives in one "signature move", type, palette, density.
4. AI assistant UX in 2025–26 has moved past the floating chat bubble: **side panel / co-pilot column with artifacts, inline actions on selected content, generated controls (chips, checkboxes) instead of typed follow-ups, plan → confirm → act → audit/undo, visible state (thinking/waiting/acting/done), citations to the user's own material.**
5. Existing skills (Anthropic frontend-design, Impeccable, taste-skill) are strong on marketing pages, weak on product UI with an existing design system, French copy, and AI-feature UX. That gap is TalkUp's skill.

---

## 1. Observable "AI-generated / vibe-coded" tells — each with "instead do"

Grouped; each is phrased as a checkable rule. Frequency signal: Krebs scored 1,590 Show HN submissions with deterministic CSS/DOM checks: 22% had 4+ patterns, 32% had 2–3, 46% had 0–1 (FP rate ~5–10%).

### 1.1 Color & surface

| # | Tell (observable) | Check | Instead do |
|---|---|---|---|
| C1 | Purple/indigo → blue gradient, "VibeCode Purple" accent, `indigo-500` CTA (Tailwind UI's 2020 placeholder that propagated into training data) | grep `indigo-`, `violet-`, `purple-`, `from-*-to-*` in JSX | Use only project tokens (`bg-accent`, `bg-primary`). Derive accent from audience/purpose, not "AI = purple". |
| C2 | Gradients everywhere: gradient text, gradient buttons, gradient section washes | grep `bg-clip-text`, `bg-gradient`, `linear-gradient` | Max one gradient on the whole surface and only if it carries meaning; never gradient text (emphasis via weight/size). |
| C3 | Glows: big colored `box-shadow` halos, radial aurora/orb blobs behind hero | `box-shadow` with 0 offset + colored rgba; absolutely-positioned blurred circles | Depth via surface levels (`surface`, `surface-raised`) and a 2-layer neutral shadow with real offset + blur. Remove effects that don't respond to state. |
| C4 | Glassmorphism by default (`backdrop-blur` + translucent white cards) | grep `backdrop-blur`, `bg-white/10` | Opaque surfaces. Blur only for a specific effect over moving content (e.g. sticky header over scroll). |
| C5 | Permanent dark mode + medium-grey body text + barely-AA contrast | contrast of body text < 4.5:1 | Choose theme from usage scene; check contrast ≥4.5:1 body, ≥3:1 large; on colored backgrounds tint secondary text from the hue, never plain grey (Refactoring UI). |
| C6 | Neon palette with no priority: 5–6 saturated colors at equal weight | count distinct hues on screen | One dominant, one accent, one neutral scale; status colors only where they mean status. |
| C7 | Multicolored side tabs / colored `border-left` stripes on cards, callouts, list items ("almost as reliable a sign of AI as em-dashes", designer quoted by Krebs) | `border-l-[2-9]` / `border-left` >1px with color | Drop the stripe. Group with spacing and a heading; if status matters, use a labeled badge/icon + text. |
| C8 | Meaningless status dots / pulsing dots on nav, headers, labels | colored dots not bound to a state variable | Every dot maps to a defined state explained in text; if nothing changes state, delete it. |
| C9 | 2026 "second-generation" defaults (Anthropic's own calibration list): cream bg ≈ `#F4F1EA` + high-contrast serif + terracotta ≈ `#D97757`; near-black + single acid-green/vermilion; broadsheet hairlines + zero radius; tinted near-black `#0B0B0B/#111` for black | hex grep | These are fine only if the brief asks. For TalkUp: stay on tokens. |

### 1.2 Typography

| # | Tell | Instead do |
|---|---|---|
| T1 | Inter (or system-ui) for everything, especially a centered hero H1 | TalkUp tokens already pair Saira (headings/buttons) + Inter (body). Keep Inter for body, but never let Inter carry a display role; make Saira the voice. |
| T2 | Recurrent LLM pairings: Space Grotesk, Instrument Serif, Geist; serif-italic accent on one hero word | Do not introduce new families. Emphasis via scale/weight, not a swapped face or a colored word. |
| T3 | Single-word accent in a headline (one word italic/bold/colored/gradient) — Anthropic lists it as "commonest tell" | Whole headline in one treatment; emphasis comes from what the sentence says. |
| T4 | ALL-CAPS tracked-out eyebrow/kicker above every heading; ALL-CAPS section labels | Delete eyebrows (Impeccable bans them outright). Sentence case everywhere. Heading carries its own weight. |
| T5 | Timid scale: 400 vs 600, 1.25× steps everywhere; everything 14–16px | Obvious steps: Anthropic suggests extremes (e.g. 300/800 weights, ≥3× display/body ratio on hero surfaces). On app UI: a clear 4–5 step scale, weight 500–600 for medium headings (Rauno), never <400. |
| T6 | Template chrome strings: "A · B · C" middle-dot meta, "WORD — fragment", "→" appended to every link/button, monospace for small labels "to look technical" | Write normal labels. Arrow only when the action navigates forward and only on one primary CTA. Mono only for code/data/numbers. |
| T7 | Bad measure / no `tabular-nums` / default `::selection` | Body 65–75ch; `font-variant-numeric: tabular-nums` on timers, scores, tables; theme `::selection`, focus rings, caret (Impeccable: "the cheapest signal a page was built rather than assembled"). |

### 1.3 Layout & composition

| # | Tell | Instead do |
|---|---|---|
| L1 | Centered hero: pill badge ("✨ New: AI-powered") → oversized H1 → grey subline → two buttons → screenshot in glowing frame | Lead with the most characteristic thing of the subject (Anthropic): for TalkUp, the actual product moment (an interview question with live feedback, an application timeline). Left-aligned text is the default for reading; center only short, isolated statements. |
| L2 | Three identical icon-on-top feature cards (icon tile + title + 2 lines), repeated for every section | Vary composition by content: a list, a split with a real UI fragment, a table, a single large statement. Use one layout primitive as signature, not six card styles. |
| L3 | Everything in a card; cards inside cards 3–4 levels deep; one radius + same `rgba(0,0,0,.1)` shadow on all | Group by whitespace/proximity/typography. Cards only for items users act on independently (an application, a note). Never nest cards. Concentric radii (child ≤ parent). Declare elevation once: border *or* shadow, not both ("ghost card"). |
| L4 | Hero-metric template / stat banner: big number + small label ×3–4 ("10k+ users", "98% satisfaction") | Real numbers only, with context and history; or remove. NN/g: "low-value stat blocks" waste space. |
| L5 | Numbered "01 / 02 / 03" sections or steps when content isn't a sequence | Number only true sequences (an interview prep flow can be one — then make it functional: progress, current step). |
| L6 | Uniform spacing: same `gap-6`/`p-6` between everything → no grouping | Tight within groups, generous between; more space above a heading than below; start with too much whitespace and remove (Refactoring UI). |
| L7 | No hierarchy / emphasis on the wrong element / duplicated info / illogical flow ("Frankenstein layouts", NN/g) | One primary action per screen; squint test; de-emphasize competitors instead of shouting the target; each fact appears once. |
| L8 | Every page looks like a landing page (dark hero, pricing section) even for app screens | Pick the mode: app screens are Operate — shell, work areas, data, states first. |
| L9 | Modal by reflex | Inline expansion, side panel, or page; modals only for interruption/protected focus. |

### 1.4 Iconography & imagery

| # | Tell | Instead do |
|---|---|---|
| I1 | Emoji as icons in nav, headings, bullets, feature cards | One icon library, one stroke weight, sized per context; emoji only for tone in user-generated content. |
| I2 | The same five lucide icons: Zap, ShieldCheck, Bot, Sparkles, Rocket; rounded-square tinted icon tile above every heading | Icons only where they aid scanning/recognition; no decorative tile. Avoid ✨ Sparkles as the universal "AI" marker unless it is the product's documented AI identifier (Shape of AI "Iconography"). |
| I3 | Abstract 3D blobs, gradient orbs, fake dashboards, sketchy SVG doodles, `feTurbulence` grain | Real product UI with real (realistic) content; real photos or none. |

### 1.5 Motion

| # | Tell | Instead do |
|---|---|---|
| M1 | Fade-and-slide-up on every section on scroll; hover lift on every card | One orchestrated moment per page at most; motion that answers a user action (open, expand, confirm) and shows what changed. |
| M2 | `transition: all`, long eases, bouncy springs on frequent actions | List properties; transform/opacity; <200–300ms; ease-out for enter/exit; no animation for keyboard/high-frequency actions (Kowalski); `prefers-reduced-motion` variant. |

### 1.6 Copy (as visible as any pixel)

| # | Tell | Instead do |
|---|---|---|
| W1 | Vague buzz: "Unlock your potential", "Supercharge your workflow", "Seamless", "AI-powered", "Elevate", "Revolutionize" | Say what it does for whom with a concrete noun: "Entraînez-vous sur les questions de l'entretien chez Decathlon". |
| W2 | "Submit", "Get started", "Learn more →" | Verb + object; same verb through the flow (button "Publier" → toast "Publié"). |
| W3 | Lorem ipsum / "John Doe" / round fake numbers | Realistic French content: real company types, real job titles, plausible dates/durations. |
| W4 | Apologetic, vague errors; empty states that just say "Nothing here" | Errors name the problem + recovery, don't apologize; empty states invite the first action (optionally with templates). |
| W5 | Title Case, ALL CAPS | Sentence case (also correct French typographic convention). |

### 1.7 Code/system tells (shadcn/Tailwind stock)

- Unmodified shadcn defaults (radius `0.5rem` on everything, `slate` neutrals, default ring) — stock defaults are the giveaway, not the library.
- Hardcoded hex / arbitrary values instead of tokens; inconsistent radius/shadow values across components.
- Missing states: no hover/active/focus-visible/disabled/loading/empty/error.
- Browser surfaces unthemed: selection, scrollbars, focus ring, caret.

---

## 2. Taste: what designers mean and how to apply it

### 2.1 Definitions worth encoding

- "An internal standards filter that allows one to discern the good from the merely good enough." Taste = a point of view committed to fully; coherence and intention over convention (Adobe, *Taste over haste*).
- Taste = critical judgment / discernment of quality: does it solve the problem for this audience, and does it resonate (Design Career Handbook). Trained by learning fundamentals, noticing where conventions are kept vs bent and whether it was intentional, scrutinizing small details, critiquing what you consume.
- "Average in, average out. We ran out of different inputs." Muzli's study of 6,346 Muzli Picks: look-alike pairs within a year went from ~1/1,100 (2021) to ~1/200 (2025–26). Advice: name your tools' defaults and decide each one deliberately; ask the model for several directions with likelihoods and keep only the unlikely ones; let AI do the predictable parts, put human effort into the one unexpected element; if you revive a style, change something. "Taste is nostalgia that went to design school."
- NN/g *Handmade designs*: as AI makes polish cheap, "polish stops being a quality signal"; signals of care (specificity, human detail) become trust signals — but must be honest.
- NN/g *Aesthetic-usability effect*: attractive UIs are perceived as easier to use and forgive minor issues, never major ones. So aesthetics matter for a student-facing product, but can't mask flow problems; don't judge your own output by polish.

### 2.2 Concrete heuristics (checkable)

1. **Ground in the subject.** Before designing, write: subject, audience, primary job of this screen (Anthropic). TalkUp: anxious-but-ambitious students; job = rehearse and track applications; vernacular = CV, lettre de motivation, entretien, recruteur, candidature, relance.
2. **One strong idea per screen; spend boldness in one place.** One memorable element, everything around it quiet. Chanel's rule: remove one accessory before shipping (Anthropic).
3. **Contrast of scale.** Obvious size/weight steps; the most important thing is unmistakably biggest/heaviest. Squint/blur test must still show the hierarchy.
4. **Emphasize by de-emphasizing.** Lighten secondary text, fade inactive nav, smaller labels; pair values with labels ("3 relances en attente" not "Relances : 3").
5. **Structure is information** (Anthropic). Borders, numbers, dividers, eyebrows must encode something true about content; otherwise delete.
6. **Restraint in color.** Neutral-dominant UI, accent reserved for the primary action and selection; status colors only for status + text label.
7. **Rhythm, not uniformity.** Tight groups, generous separation, more space above headings than below; varied section composition.
8. **Intentional alignment / asymmetry.** Left-aligned reading axis; asymmetric splits (e.g. 2/3 work area + 1/3 assistant) over centered stacks; equal outer edges.
9. **Real content first.** Design with realistic French data at real lengths (long company names, 3-line job titles, empty and overflowing states). NN/g: realistic mock data is the biggest prompt lever for AI-generated UI.
10. **Motion with purpose.** Only to show cause→effect, continuity, or state change.
11. **Details/craft floor** (Vercel/Rauno/Impeccable): visible `:focus-visible` rings; hit targets ≥24px (44 mobile); inputs ≥16px on mobile; loading buttons keep their label + spinner; skeletons mirror final layout; spinners with ~150–300ms show delay; `tabular-nums`; `::selection` themed; no font-weight change on hover; `pointer-events:none` on decorative layers; concentric radii; 2-layer shadows; non-breaking spaces in "10 min", "3 h"; Enter submits single-field forms, Cmd/Ctrl+Enter in textareas; errors inline next to fields + focus first error; never block paste; URL holds tabs/filters state; optimistic update + rollback/undo.
12. **Self-critique on the render, not the code.** Screenshot at shipping sizes (390/768/1024/1440), light and dark, then fix batched issues. Ask: "With the logo covered, could this be any other AI SaaS?" If yes, revise the plan.
13. **Plan → review against brief → build.** Write a compact token plan + ASCII wireframe, then explicitly check each choice: "Is this what I'd produce for any similar prompt?" If yes, change it and say why (Anthropic two-pass process).

### 2.3 Modes (Impeccable) — map to TalkUp

- **Persuade** (landing, /about, pricing): full commitment, a point of view, real imagery/product moments.
- **Operate** (dashboard, agenda, notes, interview simulator, application tracker, settings): "Someone who uses tools like this should know where everything is before they notice the world." The world lends only **type, palette, density, and one signature move**; never the layout, nav model, or controls. "A grey screen with one accent colour is the category default without the category's polish, not restraint." Finish bar = best product in the category: aligned grid, consistent spacing, real type scale.
- **Read** (help, privacy, guides): structure for comprehension, 65–75ch measure.
- Self-check: "with the name covered, does it read as a product of its category, could the visitor do the task, is it at least as clean as the category standard and more distinctive?"

### 2.4 A "signature move" idea bank for TalkUp (illustrative, to be decided by humans)

- Interview session rendered with the rhythm of a real interview: question → think time → answer → feedback, using a timeline/transcript layout rather than chat bubbles.
- Application pipeline as a single horizontal track of stages (candidature → relance → entretien → réponse) reused everywhere status appears.
- Feedback shown as annotations on the user's own words (margin notes / highlights), not a score card.

### 2.5 Anti-heuristic warnings (things "taste" skills over-apply)

- Do not swap Inter for "a distinctive font" in a project with established tokens: **tokens win** (TalkUp CLAUDE.md). Fix the hierarchy instead.
- Do not add atmosphere/background textures/shaders to app screens (Anthropic's skill leans maximalist; paddo.dev notes subtle/corporate looks need steering).
- Don't reject a technique in isolation: gradients, serifs, dark, glass, cards can all be intentional (MengTo audit skill). The tell is the default applied regardless of subject.

### 2.6 French design creators — what was findable

- **Basti UI** (Bastien Marécaux; YouTube/Twitch, Atecna trainer): content is mostly video (UI reviews, "Méga UI Review" with Cacatoès, design-system and designer/dev collaboration, a "refactoring UI" quiz in his training catalog). No indexable written rule list was found; his training explicitly builds on Refactoring UI-style tips.
- **Cacatoès Design Studio / The Cacatoès Theory** (Paris product studio, monthly design challenges, live UI reviews with Basti UI and Romain Dao). Their Medium post "Vers une pénurie de (bons) UI Designers ?" argues color + typography are "le duo gagnant" of a good UI and stresses mastering component libraries (atomic design) and prototyping (article itself returned 403; summary via search).
- **Cléa Cassutti** (note spelling, two t's): Nice-based freelance Product (UX/UI) designer and Framer expert specialized in SaaS product design/landing pages (Contra/Codeur profiles). No published doctrine found.
- Takeaway for the skill: no distinct French "school" is documented online; apply French *content* conventions instead (sentence case, `«  »` guillemets with narrow no-break spaces, no-break space before `: ; ! ?`, `tu` vs `vous` decided once, date format "7 nov. 2026", 24h time, "€" after the number with a space).

---

## 3. AI-assistant UX patterns (2025–2026), beyond the chat bubble

### 3.1 Framing principles

- NN/g, *AI Chat Is Not (Always) the Answer*: "AI does not have to be anthropomorphized, conversational, or even visible to the user to add value." Validate the need before adding chat.
- Vitaly Friedman (Smashing, 2025): best AI UIs are often "quiet" — a humble button or background work; products should be "AI-second, not AI-first"; the default "drop in a chat panel" brings the same problems everywhere.
- Microsoft HAX 18 guidelines (Amershi et al., CHI 2019), grouped:
  - *Initially*: G1 Make clear what the system can do. G2 Make clear how well it can do it.
  - *During interaction*: G3 Time services based on context. G4 Show contextually relevant information. G5 Match relevant social norms. G6 Mitigate social biases.
  - *When wrong*: G7 Support efficient invocation. G8 Support efficient dismissal. G9 Support efficient correction. G10 Scope services when in doubt. G11 Make clear why the system did what it did.
  - *Over time*: G12 Remember recent interactions. G13 Learn from user behavior. G14 Update and adapt cautiously. G15 Encourage granular feedback. G16 Convey the consequences of user actions. G17 Provide global controls. G18 Notify users about changes.
- Google PAIR Guidebook: chapters on user needs, mental models, explainability + trust, feedback + control, errors + graceful failure; patterns grouped by questions (onboarding to AI features, calibrating trust, balance of control vs automation, what to do when something goes wrong).
- Linear Agent Interaction Guidelines (2025): agent always discloses it is an agent; inhabits the platform natively (uses the same UI/actions as humans); gives instant, non-intrusive acknowledgement; is transparent about internal state (thinking / waiting / executing / done, with inspectable reasoning and tool calls); respects requests to disengage immediately; cannot be held accountable — a human stays responsible.

### 3.2 Pattern catalogue (with where they are seen)

**Placement / surface**
- **Co-pilot side panel / column** next to the work, not a floating bubble: Notion AI, Google Workspace Gemini panel, Cursor, Linear. Chat on one side, artifact/canvas on the other: Claude Artifacts, ChatGPT Canvas (AI UX Playground "Chat Artifacts").
- **Inline action on selected content** ("ask AI about this"): Notion, Google Docs, Shape of AI "Inline action". Accordion editing (expand/shorten/rephrase) is a real observed behavior (NN/g) → offer it as direct controls.
- **Ambient / quiet AI**: suggestions appear where the decision happens (e.g. a draft relance email appears on the application card when it's due) — HAX G3/G4.

**Input / wayfinding** (Shape of AI "Wayfinders", NN/g prompt controls)
- Suggestions/starter prompts grounded in the user's data, not generic ("Prépare-moi à l'entretien de jeudi chez Capgemini").
- Templates / madlibs for structured asks; attachments and connectors (CV, job offer URL) shown as removable **scope chips** above the input.
- **Generated controls instead of typed follow-ups** (NN/g *GenUI: buttons and checkboxes*): one multiple-choice question at a time, with an open-text option and Skip, prefilled from known context; cap the number of questions (Claude's AskUserQuestion caps at 4). Perplexity's numbered text questions are the anti-example.
- Label icons; name features plainly (no "Think carefully" magic labels); group controls by function; keep platform gestures (NN/g best practices).

**Output**
- **Streaming** with stable layout; don't flood the viewport — keep answers short (NN/g *Less chat, more answer*): lead with the direct answer, state limitations in the first sentence, then 2–3 follow-up chips ("truncated pyramid").
- **Structured outputs** as real UI (a question list, a scored rubric, a diff of the CV) rather than markdown walls; **diff-first summary** of what changed.
- **Variations / branches**: compare options side by side instead of scrolling a wall of near-identical answers (NN/g "apple-picking").
- **Regenerate / refine** with specific controls (shorter, more formal, more concrete).

**Trust / governance** (Shape of AI "Governors" and "Trust builders"; Smashing *Designing for agentic AI*, Victor Yocco, Feb 2026)
- **Citations to the user's own material**: feedback that quotes the exact sentence of the answer/CV it refers to; source browser beside the answer.
- **Intent preview / action plan**: numbered plain-language steps with "Lancer", "Modifier le plan", "Je m'en occupe". Use before irreversible, outward-facing, or hard-to-undo actions (sending an email to a recruiter, deleting notes).
- **Autonomy dial per task type**: Observe & suggest → Plan & propose → Act with confirmation → Act autonomously; start low.
- **Explainable rationale**: "Pourquoi cette suggestion" bullets tied to the user's own inputs.
- **Confidence + scope statement**, and "verified / assumed / skipped" footer for agent results.
- **Action audit + undo**: chronological log with status and per-action Undo, stated time window ("Annulable pendant 15 min"); optimistic update with rollback (Vercel).
- **Tiered permission gates**: reads silent, writes ask once, destructive always ask; batch approvals for same-tier actions to avoid approval fatigue.
- **Live step ledger** (pending/running/done/failed), collapsed reasoning with one-line summary, **interrupt & redirect** (pause keeps completed steps), **background mode** with a nav pill that turns amber when input is needed (setproduct catalogue; seen in Claude Code, Cursor, Devin, ChatGPT Agent).
- **Disclosure / identifiers**: AI-generated content visibly marked; consistent AI identity (name, icon, color) — but restrained, not sparkles everywhere.
- **Memory controls**: what the assistant remembers about the user, editable; incognito.
- **Failure disclosure + handoff**: say clearly what couldn't be done and offer the closest alternative.

### 3.3 Implications for TalkUp (concrete)

- Replace "floating support-widget chat bubble" with a **right-hand assistant column** on work screens (applications, notes, agenda, interview prep), contextual to the open object; collapsible; same tokens as the app (no special purple "AI" theme).
- Interview simulator: present as a **session** (question, timer with `tabular-nums`, transcript, inline annotated feedback with citations to the user's words), not as chat bubbles.
- Every AI write action on user data (create application from job URL, draft relance, edit note) → preview + accept/edit/discard; accepted changes undoable.
- Assistant status always visible and textual: "Analyse de l'offre…", "En attente de ta validation", "Terminé · 3 suggestions".
- Starter prompts generated from the user's actual pipeline; follow-ups as chips; clarifications as generated choice controls.

---

## 4. Prior art: prompts/skills giving agents design taste

| Prior art | What it contains | Strengths | Weaknesses (for TalkUp) |
|---|---|---|---|
| **Anthropic frontend-design skill** (v1 Nov 2025, ~400 tokens; current installed version much longer) + article *Improving frontend design through Skills* | Role framing (studio design lead, client rejected templated work); ground in subject; avoid Inter/Roboto/Open Sans/Lato/Arial, purple-on-white; v1: extreme weights, 3× size jumps, dominant color + sharp accent, one orchestrated load animation, atmospheric backgrounds. Current version: calibration list of 5 clusters of AI defaults (cream+serif+terracotta, near-black+acid-green, broadsheet, SaaS card kit, template chrome: eyebrows, middle dots, em-dash labels, `#111` blacks, mono labels, "→"); two-pass plan (4–6 hex, type roles, ASCII wireframes) reviewed against the brief before coding; "spend boldness in one place"; strong UX-writing section. | Names the mechanism (distributional convergence); process (plan → critique → build) is the most transferable part; the copy section is excellent. | Oriented to greenfield marketing pages/artifacts; encourages new fonts and bold aesthetics, which conflicts with an existing token system; nothing on AI-feature UX, app shells, states, data density; avoid-lists breed new defaults (Space Grotesk drift, documented by Anthropic itself). |
| **Impeccable** (Paul Bakaus, Apache-2.0, github.com/pbakaus/impeccable) | 24 commands (shape, critique, audit, polish, bolder, quieter, distill, typeset, layout, colorize, animate, clarify, harden, onboard…); PRODUCT.md + DESIGN.md context files; Modes (Persuade/Operate/Read/Experience); `craft-floor.md` with verify list (contrast, depth, spacing, type 65–75ch, motion, states, browser surfaces, copy) and refuse list (identical card grids, nested cards, hero-metric, eyebrows — hard ban, section numbers, reflex modals, gradient text, default glass, side-stripe borders >1px, hard offset shadows, decorative sparklines/rings, mono-as-technical, emoji/glyph icons, theme-by-habit; ghost cards; radii 12–16px); deterministic 62-rule detector via hook/CLI. | Most complete; distinguishes app UI (Operate) from marketing; mechanical detector closes the loop; respects existing design system ("the brief wins"). | Heavy (binary launcher, many references); generic across products; English copy assumptions; not AI-assistant-UX specific. |
| **taste-skill / design-taste-frontend** (Leon Lin, MIT, github.com/Leonxlnx/taste-skill) | Very prescriptive marketing-site generator: "one section per screen", equal edges, hover micro-animation rules, real photos/icons, shader effects only for tech, "deal, never choose by taste" randomized dealers, Node+Chrome finish gate. | Enforces in a real browser; fights sameness via randomized dealing. | Explicitly for landing/company sites, steers away from dashboards/product UI; very opinionated house style (becomes its own template); large dependency footprint. Not suitable for TalkUp app screens. |
| **Vercel Web Interface Guidelines** (vercel.com/design/guidelines, `AGENTS.md` MUST/SHOULD/NEVER) and **Rauno Freiberg** (interfaces.rauno.me) | Interaction/a11y/forms/motion/craft-details rules (see §2.2 #11). | Concrete, checkable, high-quality craft floor. | No aesthetic direction; doesn't prevent the templated look on its own. |
| **Refactoring UI** (Wathan & Schoger) — many community "refactoring-ui" skills | Hierarchy via de-emphasis, whitespace-first, label/value pairing, no grey on color, limited palettes and scales. | Timeless, developer-friendly. | Secondhand summaries; predates AI-specific tells. |
| **Emil Kowalski motion skills** (animations.dev-derived community skills) | Ease-out default, <300ms, no animation for keyboard/100×/day actions, frequency table. | Precise motion rules. | Motion only. |
| **v0 system prompt (leaked Nov 2024, unverified)** | "DOES NOT use indigo or blue unless specified"; use theme variables (`bg-primary`) not hardcoded colors; responsive; explicit dark mode. | Shows vendors patching the indigo default. | Ban-list approach; no taste process. |
| **Lovable docs** (prompting best practices, design guidance) | Name a style direction early and save it to project Knowledge; opinionated descriptors ("bold, saturated colors" > "colorful"); design previews; skips design guidance for dashboards/internal tools and defers to existing design system/template tokens. | Persistence of a design direction; defers to systems. | Little guidance on *how* to choose; vague for app UI. |
| **Krebs' ai-design-checker / design-slop-cop**, **MengTo audit-ai-design-slop**, **ravidsrk/slop-detect**, **Hallmark (nutlope)** | Detectors/audits of the tell list. MengTo: evidence-based, "smallest set of removals", no numeric slop score, don't reject a technique in isolation, don't prescribe new art direction unasked. | Good review stance. | Detection ≠ direction. |
| **NN/g *Prompt to design interfaces*** (Dec 2025) | Precise design vocabulary, references, connect to tokens/Figma, realistic mock data, critique prompts with AI. Warns judging by polish. | Research-backed. | For designers prompting tools, not agent rules. |

**Common weaknesses across prior art**
1. Ban-lists without a decision process → new defaults (the 2025→2026 drift in Anthropic's own list is proof).
2. Marketing-page bias; little for dense app UI, states, tables, forms, empty/error flows.
3. Push for "distinctive fonts/effects" that conflicts with existing design tokens.
4. Nothing on AI-assistant surfaces (placement, state, preview/undo, citations) even though that's what AI products ship.
5. Rarely require verification on the rendered result in both themes and at mobile width.
6. English-only copy guidance; no locale typography.

**What the TalkUp skill should therefore do**
- Read `web/DESIGN.md` + `tailwind.css` tokens first; never introduce new fonts/colors; taste expressed through hierarchy, density, composition, copy, states, one signature move.
- Classify the surface mode (Persuade/Operate/Read) first.
- Two-pass: plan (subject, user, job, layout ASCII, the one bold thing) → "would I produce this for any SaaS?" check → build.
- Run the tell checklist (§1) as a mechanical self-audit (grep + rendered screenshots at 390/1440, light + dark).
- Include the AI-assistant pattern rules (§3.3) for any assistant-related UI.
- French copy and typography rules (§2.6).

---

## 5. Compact checklist (paste-ready core for the skill)

Before coding:
- [ ] Surface mode named (Persuade / Operate / Read). Subject, user, primary job written in one line each.
- [ ] One bold thing named; everything else declared quiet.
- [ ] Realistic French content drafted (real lengths, an empty state, an error state, an overflow case).
- [ ] "Generic test": would this plan be my output for any SaaS? If yes, revise and state what changed.

Forbidden unless the brief explicitly asks:
- [ ] No purple/indigo/violet classes, no gradient text, no colored glows, no default glassmorphism.
- [ ] No eyebrow/kicker labels, no ALL CAPS labels, no single-word headline accent, no "→" on every CTA, no "A · B · C" meta strings.
- [ ] No identical icon-card grids, no nested cards, no stat banner, no 01/02/03 unless a real sequence.
- [ ] No colored side-stripe borders >1px, no meaningless status dots, no emoji icons, no Sparkles/Zap/Rocket/Bot/ShieldCheck decoration.
- [ ] No section fade-up on scroll, no `transition: all`, no hover lift on everything.
- [ ] No hardcoded hex; tokens only; no new font families.
- [ ] No buzzwords ("unlock", "supercharge", "seamless", "révolutionner", "booster", "propulsé par l'IA").

Must:
- [ ] Clear 4–5 step type scale; one primary action per screen; squint test passes.
- [ ] Spacing: tight groups, generous separation, more space above headings.
- [ ] States: hover, active, focus-visible, disabled, loading (label kept), empty (with action), error (problem + recovery).
- [ ] Contrast ≥4.5:1 body; dark mode verified; 390px width without horizontal scroll.
- [ ] `tabular-nums` on timers/scores; themed `::selection`/focus; hit targets ≥24/44px; inputs ≥16px mobile.
- [ ] Motion only on user-triggered state changes, <300ms ease-out, reduced-motion respected.
- [ ] AI surfaces: in-context panel or inline, visible textual state, preview before writes, undo after, citations to user's own material, follow-ups as chips/controls, AI content disclosed.

---

## Sources

AI-look tells
- Adrian Krebs, "Scoring Show HN submissions for AI design patterns" — https://www.adriankrebs.ch/blog/design-slop/ (HN thread Apr 22 2026, ~333 pts; coverage: https://www.gigazine.net/gsc_news/en/20260423-design-slop ; checker: https://github.com/AdrianKrebs/ai-design-checker)
- Developers Digest, "AI Design Slop: 16 Patterns…" — https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- Jeff Humble, The Fountain Institute, "7 Signs a UI Has Been Vibe Coded" — https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui
- "Why every AI-built website looks the same (blame Tailwind's indigo-500)" — https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- "How to fix the AI-generated look in your frontend" — https://dev.to/alanwest/how-to-fix-the-ai-generated-look-in-your-frontend-1ahh
- "How Tailwind became the tell for LLM-generated slop apps" — https://news.lavx.hu/article/how-tailwind-became-the-tell-for-llm-generated-slop-apps
- Towards AI, "10 Signs of AI Generated Design" — https://pub.towardsai.net/10-signs-of-ai-generated-design-and-how-to-make-yours-not-look-like-it-482ff7da81fc
- BrainGrid, "Design systems for AI coding: stop getting purple gradients" — https://www.braingrid.ai/blog/design-system-optimized-for-ai-coding
- vibecodekit, "AI slop design" — https://vibecodekit.dev/ai-slop-design
- Built In, "AI makes bad design look good enough" — https://builtin.com/articles/ai-design-slop-era
- NN/g, "Prompt to Design Interfaces" — https://www.nngroup.com/articles/vague-prototyping/

Taste
- Muzli, "Are we out of new things?" — https://muz.li/blog/are-we-out-of-new-things/
- Adobe Design, "Taste over haste" — https://adobe.design/ideas/taste-over-haste
- Design Career Handbook, "Having taste in the age of AI" — https://designcareerhandbook.substack.com/p/having-taste-in-the-age-of-ai
- Steve Ruiz, "Sameness as a service" — https://steveruiz.substack.com/p/sameness-as-a-service
- NN/g, "The Aesthetic-Usability Effect" — https://www.nngroup.com/articles/aesthetic-usability-effect/
- NN/g, "Handmade Designs: The New Trust Signal" — https://www.nngroup.com/articles/handmade-designs/
- NN/g, Visual design study guide — https://www.nngroup.com/articles/visual-design-in-ux-study-guide/
- Vercel Web Interface Guidelines — https://vercel.com/design/guidelines (repo: https://github.com/vercel-labs/web-interface-guidelines)
- Rauno Freiberg, Web Interface Guidelines — https://interfaces.rauno.me
- Refactoring UI (Wathan & Schoger) — https://www.refactoringui.com (summaries via community skills, e.g. https://smithery.ai/skills/wondelai/refactoring-ui)
- Emil Kowalski motion guidance (community distillation) — https://www.ui-skills.com/skills/emilkowalski/emil-design-eng
- French creators: Basti UI — https://www.youtube.com/@BastiUi , podcast https://podcast.ausha.co/design-journeys/22-bastien-marecaux-basti-ui , training catalog https://medium.com/@Bastiii/catalogue-de-formation-ui-design-5802b0e1777b ; Cacatoès — https://medium.com/cacatoes-design-studio/vers-une-p%C3%A9nurie-de-bons-ui-designers-2fafab9fea3b , UI review https://www.youtube.com/watch?v=VpEed2ZMJ48 ; Cléa Cassutti — https://contra.com/clea_cassutti/about

AI UX patterns
- Shape of AI (Emily Campbell) — https://www.shapeof.ai
- AI UX Playground (Bestfolios) — https://www.aiuxplayground.com/patterns
- Microsoft HAX Toolkit — https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/ ; paper PDF https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf
- Google PAIR Guidebook — https://pair.withgoogle.com/guidebook/
- NN/g, Designing AI study guide — https://www.nngroup.com/articles/designing-ai-study-guide/
- NN/g, "AI Chat Is Not (Always) the Answer" — https://www.nngroup.com/articles/ai-chat-not-the-answer/
- NN/g, "Less Chat, More Answer" — https://www.nngroup.com/articles/less-chat-more-answer/
- NN/g, "Prompt Controls in GenAI Chatbots" — https://www.nngroup.com/articles/prompt-controls-genai/
- NN/g, "The Most Exciting Development in GenUI: Buttons and Checkboxes" — https://www.nngroup.com/articles/genui-buttons-and-checkboxes/
- NN/g, "Accordion Editing and Apple Picking" — https://www.nngroup.com/articles/accordion-editing-apple-picking/
- NN/g, "Explainable AI in Chat Interfaces" — https://www.nngroup.com/articles/explainable-ai/
- Linear, Agent Interaction Guidelines — https://linear.app/developers/aig
- Victor Yocco, Smashing Magazine, "Designing for Agentic AI" (Feb 2026) — https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/
- Setproduct, "16 AI agent UI design patterns" — https://www.setproduct.com/blog/ai-agent-ui-design-patterns
- Vitaly Friedman, "Design Patterns for AI Interfaces" (Smashing, Jul 2025; via https://conffab.com/elsewhere/design-patterns-for-ai-interfaces-smashing-magazine/) and Dive Club podcast "Beyond Chat" — https://zeno.fm/podcast/dive-club/episodes/vitaly-friedman-beyond-chat-whats-next-for-ai-design-patterns

Prior art
- Anthropic, "Improving frontend design through Skills" — https://claude.com/resources/articles/improving-frontend-design-through-skills ; skill text in the official plugin `claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md` (read locally)
- paddo.dev review of the frontend-design plugin — https://paddo.dev/blog/claude-code-plugins-frontend-design/
- Impeccable (Paul Bakaus) — https://impeccable.style , https://github.com/pbakaus/impeccable (read `skill/SKILL.src.md`, `reference/craft-floor.md`, `reference/mode-operate.md`)
- taste-skill (Leon Lin) — https://github.com/Leonxlnx/taste-skill
- MengTo audit-ai-design-slop — https://skills.sh/mengto/skills/audit-ai-design-slop
- v0 leaked prompt (unverified) — https://gist.github.com/jasonkneen/22289f24ce343b1a33e1b163f834ea6d , discussion https://lr.eu.psf.lt/r/LocalLLaMA/comments/1gwwyia/leaked_system_prompts_from_v0_vercels_ai
- Lovable docs — https://docs.lovable.dev/prompting/prompting-one , https://docs.lovable.dev/features/design-guidance
