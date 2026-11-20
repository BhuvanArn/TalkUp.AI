# UX resources + laws/heuristics/biases: research for the TalkUp.AI designer skill

Researched 2026-11-07. Access was tested with WebFetch and with `curl` using a Chrome user agent. Access verdicts below are **tested** unless marked *(not tested)*. Guidance marked *(from knowledge)* was not re-fetched this session. Cite those items by URL and verify them before quoting.

---

## 0. TL;DR access matrix

| Resource | URL | Agent access | Best agent route |
|---|---|---|---|
| Laws of UX | lawsofux.com | **Open, SSR** | WebFetch `lawsofux.com/<slug>/` |
| NN/g | nngroup.com/articles/ | **Open, SSR** | WebFetch article URLs; WebSearch `allowed_domains:["nngroup.com"]` |
| UI-Patterns | ui-patterns.com/patterns | **Open, SSR** | WebFetch `/patterns/<Slug>` or `/patterns/<section>/list` |
| AI UX Playground | aiuxplayground.com | **Open, no account, has `llms.txt`** | WebFetch `/llms.txt`, then topic pages |
| growth.design psychology (the "Cognitive Bias Index") | growth.design/psychology | **Open, SSR** (106 entries) | WebFetch |
| The Decision Lab biases index | thedecisionlab.com/biases | Open (curl 200) | WebFetch `/biases/<slug>` |
| Awwwards | awwwards.com/websites/ | **Open, SSR** | WebFetch category/tag paths |
| Httpster | httpster.net | **Open, SSR** | WebFetch `/type/<slug>/`, `/style/<slug>/` |
| Designspiration | designspiration.com | Open (curl 200, SSR grid) | `/search/saves/?q=<term>`. Results are images, so view them with Playwright |
| Collect UI | collectui.com | HTML shell only; shots load via JS | **Playwright** `collectui.com/challenges/<slug>` |
| Siteinspire | siteinspire.com | WebFetch OK on home; curl got **429 Vercel checkpoint** | WebFetch or Playwright, at low request rate |
| Muzli | muz.li, search.muz.li | Open (marketing page) | Playwright for `search.muz.li` |
| Dribbble | dribbble.com | **Empty body (202, bot challenge)** | Playwright only |
| Behance | behance.net | **403** | Playwright only |
| Mobbin | mobbin.com | **403** to fetch; free tier is very limited | Playwright logged in; MCP needs **Pro ($10–15/mo)** |
| Refero | refero.design | JS shell (title only) | Playwright; official **MCP** `https://api.refero.design/mcp` needs a **paid plan** |
| UX Myths | uxmyths.com | **403 (Cloudflare)**, including tumblr mirrors | WebSearch `allowed_domains:["uxmyths.com"]` returns titles and snippets. The full list is in §B3 |
| DesignGouv (the "design.gouv.fr" resource) | **design.numerique.gouv.fr** (`design.gouv.fr` does not resolve) | **Open, SSR** | WebFetch `/accessibilite-numerique/`, `/outils/`, `/articles/` |
| RGAA | accessibilite.numerique.gouv.fr | Open | WebFetch criteria |
| DSFR | systeme-de-design.gouv.fr | **403 Cloudflare** | Playwright |
| Lighthouse | CLI / DevTools / pagespeed.web.dev | Local tool | `npx lighthouse` against `localhost:8081` (PSI cannot reach localhost) |

---

## 1. Per-resource guide

### Inspiration (look and feel, art direction). Use these early in the "diverge" phase and when a page feels generic

**Awwwards**: https://www.awwwards.com/websites/
- Best for: high-craft marketing and landing sites, motion, typography, bold art direction. It is weak for app UI. Use it for TalkUp's landing, about and pricing pages, not for dashboards.
- Access: SSR, WebFetch returns the lists of winners.
- URL patterns: `/websites/<category>/` (`startups`, `education`, `e-commerce`, `web-interactive`...). Tags: `/websites/<tag>/` (`minimal`, `typography`, `animation`, `scrolling`, `3d`, `portfolio`). Tech: `/websites/react/`, `/websites/gsap/`. Font: `/websites/<FontName>/`. Country: `/websites/France/`. **Color by hex**: `/websites/%23<HEX>/`. Awards: `/websites/sites_of_the_day/`, `/websites/sites_of_the_month/`. Pagination: `?page=N`. Collections: `/collections/`.
- Agent use: WebFetch a list to collect site names, then open the 2–3 best in Playwright and screenshot hero, nav and typography.

**Httpster**: https://www.httpster.net/
- Best for: curated, trend-forward sites with less noise than Awwwards. Good for typography and layout ideas.
- Access: SSR, WebFetch OK.
- URL patterns: `/type/<slug>/` (e.g. `online-store`, `inspiration-resource`), `/style/<slug>/` (e.g. `brutalist`, `non-standard-layout` = "Unusual Layout"), `/website/<slug>/`, `/page/<n>/`. Menu labels do not match slugs, so read the slugs from the menu first.

**Siteinspire**: https://www.siteinspire.com/
- Best for: restrained, editorial, minimal web design. Fits a clean SaaS marketing tone.
- Access: WebFetch home OK. Repeated curl hits a **Vercel 429 checkpoint**, so throttle requests.
- URL patterns: `/websites/category/<slug>` (`minimal`, `grid-layout`, `typographic`, `unusual-layout`, `e-commerce`), `/websites/page/<n>`, `/websites/popular/<today|week|month|year>`. The Styles, Types, Subjects and Platforms tabs exist.

**Dribbble**: https://dribbble.com
- Best for: component and visual exploration (cards, stat tiles, chat bubbles, calendars). Shots are often unrealistic "dribbble-ware", so never copy their density or contrast blindly.
- Access: **blocked to fetch** (202 with an empty body). Use Playwright: `dribbble.com/search/<term>` and `dribbble.com/tags/<tag>` *(patterns from knowledge)*.

**Behance**: https://www.behance.net
- Best for: full case studies (problem → research → UI) and branding systems.
- Access: **403**. Playwright: `behance.net/search/projects/<term>` *(pattern from knowledge)*.

**Collect UI**: https://collectui.com
- Best for: one specific component or screen type, organised by Daily UI-style "challenges".
- Access: the HTML shell is served but shots load via JS, so use **Playwright**. Unknown slugs also return HTTP 200 (`zzzbogus` = 200, 0 images), so judge by whether images appear.
- URL pattern: `collectui.com/challenges/<slug>`. Verified pages with titles: `sign-up`, `dashboard`, `onboarding`, `calendar`, `settings` (title "settings-page"). Other Daily UI slugs relevant to TalkUp *(unverified, from knowledge)*: `user-profile`, `landing-page`, `pricing`, `direct-messaging`, `analytics-chart`, `to-do-list`, `file-upload`, `search`, `notifications`, `flash-message`, `404-page`, `leaderboard`, `faq`. Also `/categories`, `/trending`, `/designers`.

**Designspiration**: https://www.designspiration.com
- Best for: moodboards (colour, typography, imagery). Supports color search *(from knowledge; not confirmed in the fetch)*.
- Access: SSR, curl 200. `/search/saves/?q=<term>` works (`/search/saved/` returns 404). Results are images, so view them with Playwright.

**Muzli**: https://muz.li
- Best for: a daily digest of trends and a searchable inspiration archive (it aggregates Dribbble, Behance and Awwwards). Use it to scan current trends, not to reference a pattern.
- URLs: `/inspiration/`, `/blog/`, search at `https://search.muz.li/` (JS-rendered, use Playwright).

### UX flows (real shipped products). Use these in the "define the flow" phase, before wireframing

**Refero**: https://refero.design
- Best for: real web and iOS **screens and end-to-end flows**, searchable by page type, UI element and flow (onboarding, empty state, pricing, cancellation...). It also has a "Styles" layer (typography, color, spacing, do/don't).
- Access: a JS shell, so WebFetch sees only the title. Use Playwright, or the **official MCP** `https://api.refero.design/mcp` (OAuth or Bearer). The MCP **requires a Pro, Team or Lifetime plan** and allows 8,000 calls a month. Its research areas are Sites/apps, Styles, Screens, Flows, Images and similar screens. Community skill docs mention `search_screens`, `search_flows` and `get_flow` (verify these names at doc.refero.design/mcp/tools).
- Example queries: "web onboarding flow for B2C SaaS", "empty state for list with CTA", "subscription cancellation with retention offer on web".

**Mobbin**: https://mobbin.com
- Best for: the largest library of screens, flows, UI elements and "website sections" from shipped apps. Covers mobile, web and sites.
- Access: **403 to fetch**. The free account is heavily limited: apps are limited, there are **no flows and no search**, and you get 3 collections. **Pro is $10/mo yearly or $15/mo quarterly** and includes the **MCP**. The REST API needs the Team plan. Browse at `mobbin.com/explore/web` and `/explore/mobile` (Playwright, logged in). Pricing details are at `mobbin.com/pricing.md`.
- Practical verdict: without a paid seat, prefer Refero (if the team pays), UI-Patterns and AI UX Playground (free).

### Accessibility (audit phase, and the definition of done for any persistent UI)

**Lighthouse**
- Run against local dev: `npx lighthouse http://localhost:8081/<route> --only-categories=accessibility,best-practices --output=json --output-path=./lh.json --chrome-flags="--headless"`. Authenticated routes need a session: run it via Playwright with a CDP port, or use `--extra-headers` with a cookie.
- Run on a public URL with no install: PageSpeed Insights API `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&category=ACCESSIBILITY` (it **cannot reach localhost**). The UI is at pagespeed.web.dev.
- Limits: a Lighthouse accessibility score of 100 does not mean the page is accessible. Automated checks catch roughly 30–40% of issues *(from knowledge)*. Pair them with a keyboard pass (Tab order, visible focus, Esc closes dialogs), a contrast check in **both light and `.dark`**, and `@axe-core/playwright` in e2e.

**DesignGouv (French state design and accessibility hub)**: the URL is **https://design.numerique.gouv.fr/**. `design.gouv.fr` returns DNS NXDOMAIN.
- Sections: `/accessibilite-numerique/`, `/design-numerique/`, `/outils/` (tools: **checklists** "Diagnostic Flash", **Checklist Formulaires**, Checklist PIDILA, Checklist PDF, a dev checklist, user tests with people with disabilities), `/bien-concevoir/`, `/formations/`, `/articles/` (e.g. `/articles/2026-11-03-rgaa5/` "Ce qui change avec le RGAA 5").
- Related: RGAA criteria at https://accessibilite.numerique.gouv.fr/ (open), the audit tool **Ara** at ara.numerique.gouv.fr, and DSFR at systeme-de-design.gouv.fr (Cloudflare 403, Playwright only).
- Why it matters for TalkUp: it is a French product and the job-seeker audience overlaps with France Travail users. RGAA is the French legal reference (WCAG-based). The "Checklist Formulaires" is directly applicable to CV upload and application forms.

### Guides (the knowledge layer for critique and rationale)

**Laws of UX**: https://lawsofux.com. All 30 laws are in §A. Slug pattern: `lawsofux.com/<lowercase-hyphenated>/` (e.g. `fittss-law/`, `millers-law/`, `law-of-pr%C3%A4gnanz/`). SSR, fetchable.

**UI-Patterns**: https://ui-patterns.com/patterns. SSR, fetchable. Each pattern page has *Problem / Solution / Usage / Rationale*. Use it for a pattern's "when to use / not use".
- Pattern pages: `/patterns/<Slug>` (casing varies: `BlankSlate`, `GoodDefaults`, `InplaceEditor`, `autosave`). Section index: `/patterns/<section>/list`.
- Sections: `getting-input`, `onboarding`, `navigation`, `dealing-with-data`, `social`, `miscellaneous`, and the persuasive sections `cognition`, `game-mechanics`, `perception-and-memory`, `feedback`.
- TalkUp-relevant patterns: `BlankSlate`, `SuggestedAction`, `SuccessState`, `OnboardingChecklist`, `StepsLeft`, `CompletenessMeter`, `Wizard`, `InlineHelpBox`, `inline-hints`, `GoodDefaults`, `ForgivingFormat`, `InputFeedback`, `autosave`, `undo`, `CalendarPicker`, `EventCalendar`, `dashboard`, `TableFilter`, `SortByColumn`, `cards`, `ProgressiveDisclosure`, `notifications`, `modal-windows`. AI patterns: `SuggestedPrompts`, `RefinementControls`, `SourceCitations`. Upgrades: `UsageMeter`, `FeatureGate`, `TrialCountdown`. Data: `DataImport`, `SmartPrefill`.

**UX Myths**: https://uxmyths.com (Zoltán Gócza). **Fetch is blocked by Cloudflare**, but `WebSearch` with `allowed_domains:["uxmyths.com"]` returns post titles and snippets. Post URL pattern: `uxmyths.com/post/<id>/<slug>`. All 34 myths are in §B3.

**Nielsen Norman Group**: https://www.nngroup.com/articles/. SSR, fetchable. Every topic has a **"Study Guide"** hub (e.g. `/articles/designing-ai-study-guide/`), so fetch the study guide first and follow its links. Search with `WebSearch` and `allowed_domains:["nngroup.com"]`. A digest is in §B2.

**Cognitive Bias Index**. No site uses this exact name. The candidates:
- **growth.design/psychology** (most likely the seminar's "index"): 106 biases and principles in 4 decision-cycle groups (Information, Meaning, Time, Memory). SSR, fetchable. Of the 106 entries, 45 have expandable content and 61 are marked "Coming soon".
- **The Cognitive Bias Codex** (Buster Benson / John Manoogian III, 180+ biases): https://en.wikipedia.org/wiki/List_of_cognitive_biases and https://commons.wikimedia.org/wiki/File:Cognitive_bias_codex_en.svg.
- **The Decision Lab**: https://thedecisionlab.com/biases. A bias index with explainer pages (curl 200).
- Also: Jon Yablonski's (author of Laws of UX) "Biased by Design" (jonyablonski.com/work/biased-by-design/).

**AI UX Playground**: https://aiuxplayground.com (by Bestfolios). Free with no account, **agent-friendly**: it publishes `/llms.txt`, `/sitemap.xml` and `/access.md`. Product Hunt lists 141+ patterns, plus teardowns of ChatGPT, Claude, Perplexity and Gemini.
- Key URLs: `/patterns`, `/frameworks/chat-ux`, `/frameworks/trust-scaffolding`, `/frameworks/agentic`, `/teardowns/<jobSlug>`, `/teardowns/compare/<jobSlug>`, `/teardowns/<product>/<guide>`, `/guides/how-to-design-*` (including the AI chat composer UX guide and the citations & sources guide). Hubs: `/ai-failure-states`, `/ai-trust-design`, `/human-in-the-loop-ai`, `/generative-ui-patterns`. Also `/prompts/for-designers` and `/skills`.
- Teardown topics include onboarding & first-value, trust & citations, output & artifacts, model & mode selection, personalization & memory, and pricing & upgrade. llms.txt mentions an "eight states every AI feature needs" checklist.
- **This is the go-to resource for TalkUp's interview-prep AI assistant.**

### People (French design creators)

See §C.

### When to reach for what (process map)

| Phase | Reach for |
|---|---|
| 1. Understand the problem and user | NN/g (study guide for the topic), UX Myths (to kill bad assumptions), growth.design/psychology |
| 2. Benchmark real flows | Refero / Mobbin (flows), AI UX Playground teardowns (AI features), UI-Patterns (pattern rationale) |
| 3. Choose patterns | UI-Patterns, Laws of UX, NN/g pattern articles |
| 4. Art direction / moodboard | Awwwards, Httpster, Siteinspire (marketing pages); Dribbble, Collect UI (components); Designspiration (color/type); Muzli (trends) |
| 5. Build | The TalkUp tokens (`web/src/styles/tailwind.css`) win over any inspiration |
| 6. Critique / self-review | Nielsen's 10 heuristics + the Laws of UX checklist (§A) + the bias ethics table (§B4) |
| 7. Accessibility gate | Lighthouse + axe + keyboard pass + DesignGouv checklists / RGAA, in light and dark |

---

## A. Laws of UX: all 30 (lawsofux.com), each with how to apply or check it on a web UI

| # | Law | Definition | Apply / check |
|---|---|---|---|
| 1 | Aesthetic-Usability Effect | Users perceive attractive designs as more usable | Polish builds tolerance, but it also **hides usability problems in tests**. Measure task success, not "looks nice". Spend polish on high-traffic screens (dashboard, AI chat) |
| 2 | Choice Overload | Too many options overwhelm and paralyse | ≤3 plans on pricing, one recommended. Filters behind "More". Default sort. No more than 3–5 suggested prompts |
| 3 | Chunking | Group information into meaningful units | Split long forms into labelled sections or steps. Format codes and phone numbers in groups. Use cards for each application |
| 4 | Cognitive Bias | Systematic thinking errors shape decisions | Design for predictable irrationality, and audit for manipulation (see §B4) |
| 5 | Cognitive Load | Mental effort to understand and use the UI | Remove decorative noise, one primary task per screen, recognition over recall. Check: can a new user name the main action in 5s? |
| 6 | Doherty Threshold | Productivity soars when response is under ~400ms | Feedback in <100ms (pressed state). Optimistic updates for status changes (application stage drag). Skeletons for >400ms. Stream AI tokens, never a blank 10s spinner |
| 7 | Fitts's Law | Time to hit a target depends on its size and distance | Primary CTA large and close to the attention point (end of form, bottom-right of a dialog). Hit area ≥24×24px (WCAG 2.5.8), ideally 44. Keep destructive actions away from frequent ones |
| 8 | Flow | State of full, energized focus | Don't interrupt focus tasks (CV editing, mock interview) with modals or toasts. Autosave, keyboard shortcuts, minimal chrome in focus mode |
| 9 | Goal-Gradient Effect | Effort increases as the goal nears | Progress bars and checklists that start partly complete ("profile 2/5"). Show steps left in multi-step forms |
| 10 | Hick's Law | Decision time grows with the number and complexity of choices | Limit the top-level nav (≤7). Highlight the recommended option. Use progressive disclosure for advanced settings. Do **not** over-apply it to well-organised lists users search through |
| 11 | Jakob's Law | Users expect your site to work like others they know | Logo top-left goes home, avatar top-right opens the account menu, standard form controls, Esc closes modals, Kanban for application stages, Google-Calendar-like agenda. Innovate on value, not on controls |
| 12 | Law of Common Region | Elements in a bounded area are seen as grouped | Use cards or borders to group related fields and stats. Check that every bordered box contains one concept |
| 13 | Law of Proximity | Near elements are seen as related | Label closer to its input than to the previous field. Spacing scale: within-group < between-group. Help text sits under its own field |
| 14 | Law of Prägnanz | People read complex shapes in their simplest form | Simple icons and shapes, avoid busy illustrations in functional UI. Reduce visual variants |
| 15 | Law of Similarity | Similar-looking elements are seen as related | Same style means same behaviour: all links look alike, and a non-clickable element must not look like a button. Status pills share one shape and differ only by semantic colour plus a label |
| 16 | Law of Uniform Connectedness | Visually connected elements are seen as more related | Use lines or containers for stepper steps, timeline events and the selected tab connected to its panel |
| 17 | Mental Model | Users' internal picture of how a system works | Use user vocabulary ("candidature", "entretien") not internal terms. Card-sort the navigation. Make AI capabilities and limits explicit |
| 18 | Miller's Law | Working memory holds ~7±2 items | Use it to **chunk** content, **not** to cap menus at 7 (UX Myth #23). Don't make users remember data across screens |
| 19 | Occam's Razor | Prefer the solution with the fewest assumptions | Remove elements until removing more would break the task. Each element must justify its existence |
| 20 | Paradox of the Active User | Users skip manuals and start using right away | No mandatory tours. Use contextual inline hints, good empty states and learn-by-doing onboarding |
| 21 | Pareto Principle | ~80% of effects come from 20% of causes | Find the 20% of flows (CV upload, add application, start interview prep) and polish those first. Prioritise bugs by usage |
| 22 | Parkinson's Law | Work expands to fill the time available | Prefill and autofill (import CV data, LinkedIn). Give realistic time estimates ("2 min"). Short interview drills with a timer |
| 23 | Peak-End Rule | Experiences are judged by their peak and their end | Design the best moment (first CV score, interview feedback) and the ending (success state after an application or session, with a clear next step). Make error moments gentle |
| 24 | Postel's Law | Be liberal in what you accept, strict in what you send | Forgiving inputs: trim spaces, accept "06 12 34 56 78" or "+33...", dates in several formats, drag-drop or browse for files. Normalise on save |
| 25 | Selective Attention | Users focus only on goal-relevant stimuli | Avoid banner-like styling for important information (banner blindness). Place key content where the task's gaze goes. Don't rely on side-rail announcements |
| 26 | Serial Position Effect | First and last items are remembered best | Put the key nav items first and last. The most important tip goes first in a list. Put the primary CTA at the end of the flow |
| 27 | Tesler's Law | Some complexity can't be removed, only moved | Move complexity to the system (smart defaults, AI parsing of the CV), not to the user. Don't over-simplify into ambiguity |
| 28 | Von Restorff Effect | The item that differs is remembered | Exactly **one** accent-coloured primary button per view. Use the highlight for the recommended plan. Don't rely on colour alone (pair it with an icon or label for accessibility) |
| 29 | Working Memory | Temporarily holds information for tasks | Show context in place (job title in the interview header). Keep entered data visible on review steps. No "remember this code" |
| 30 | Zeigarnik Effect | Unfinished tasks are remembered better | "Continue where you left off" cards, incomplete-profile nudges, draft badges. Ethically: no fake incompleteness |

Other heuristics to pair with these: **response-time limits** of 0.1s (instant), 1s (flow kept) and 10s (attention lost, so show progress and allow cancel) (NN/g `/articles/response-times-3-important-limits/`, from knowledge).

---

## B. Heuristics and guidance

### B1. Nielsen's 10 usability heuristics (verified at nngroup.com/articles/ten-usability-heuristics/)

| # | Heuristic | Check on a TalkUp screen |
|---|---|---|
| 1 | Visibility of system status | Upload or analysis progress, saving/saved indicator, AI "thinking/streaming" state, current nav item highlighted |
| 2 | Match between system and real world | French job-seeker vocabulary, dates in FR format, statuses that match how candidates think (Envoyée → Entretien → Offre/Refus) |
| 3 | User control and freedom | Undo after delete (toast with "Annuler"), cancel or stop AI generation, back without losing form data |
| 4 | Consistency and standards | One term per concept, same component per job, platform conventions (Jakob) |
| 5 | Error prevention | Constraints (date pickers, file type limits stated upfront), confirm destructive actions, disable invalid submit with an explanation |
| 6 | Recognition rather than recall | Visible options, recent items, suggested prompts, autocomplete of company names |
| 7 | Flexibility and efficiency of use | Keyboard shortcuts, bulk actions, saved filters. Must not burden novices |
| 8 | Aesthetic and minimalist design | Every element is in service of the task. Cut decoration and duplicate information |
| 9 | Help users recognize, diagnose, recover from errors | Plain language, the specific cause, a constructive fix, preserved input |
| 10 | Help and documentation | Contextual help (tooltips, inline help), searchable FAQ, task-focused |

### B2. NN/g guidance by topic

**Forms** *(from knowledge; hubs: `/articles/web-form-design/`, `/topic/forms/`)*
- One column. Labels **above** fields. Never use placeholder-as-label (`/articles/form-design-placeholders/`).
- Mark required **or** optional fields explicitly (`/articles/required-fields/`).
- Group related fields. Size the field to the expected input. Use the right input types (email, tel, date) for mobile keyboards.
- Validate inline **after** the field loses focus, not while typing. Don't show an error for an untouched empty field. Summarise errors at the top on submit for long forms.
- Give the primary button a specific verb ("Analyser mon CV", not "Envoyer"). Avoid a Reset button. Keep the secondary action visually weaker.
- Ask only for what is needed now (defer the rest, "lazy registration"). Autosave long forms.
- Pair this with DesignGouv's "Checklist Formulaires".

**Empty states** *(verified: `/articles/empty-state-interface-design/`)*
- Never leave an area blank. A blank area is ambiguous: is it loading, broken or genuinely empty?
- Don't show "no records" while data is still loading. Show a skeleton or progress indicator.
- Use the space for **learning cues**: what this area is for and how to fill it. Contextual hints are remembered better than upfront tutorials.
- Provide **direct pathways**: a primary CTA ("Ajouter une candidature"), optional demo or sample data, and a link to help.
- There are three kinds of empty state: first use, user-cleared (inbox zero, which deserves a celebration) and no results (offer to clear filters or fix spelling).

**Onboarding** *(from knowledge; `/articles/onboarding-tutorials/`, `/articles/mobile-app-onboarding/`)*
- Prefer **contextual help and learn-by-doing** over upfront deck tutorials, which users skip and forget (Paradox of the Active User).
- If a tour is used, keep it short, skippable and re-openable. Use it only for non-standard interactions.
- Focus onboarding on getting to first value fast (TalkUp: upload CV → see analysis). Use a checklist (Zeigarnik, goal-gradient) for the setup steps.
- Use permission or personalization priming only when it is needed, and explain why.

**Dashboards** *(from knowledge; `/articles/dashboards-preattentive/`)*
- A dashboard is for **at-a-glance** monitoring. Use preattentive attributes (position, length, colour intensity) for the 3–5 KPIs that matter. Avoid decorative gauges and 3D charts.
- Answer "what do I need to do next?": applications needing follow-up, the next interview on the agenda, the latest CV score with its trend.
- Put the most important item top-left (F/Z scan). Use consistent units and time ranges, comparisons (vs last week), and drill-down to detail.
- Design the zero-data dashboard explicitly, which is an empty state.

**AI chat / assistant UX** *(verified: `/articles/ai-chatbots-design-guidelines/`, `/articles/prompt-suggestions/`, `/articles/less-chat-more-answer/`, `/articles/site-ai-chatbot/`; hub `/articles/designing-ai-study-guide/`)*
- One clearly identified assistant. Make it reachable throughout the relevant flow.
- The **opening message states concretely what it can do, in context** (not "Ask me anything"). Users can't tell what generic bots are for.
- Offer **suggested prompts as clickable buttons**. These come in three types: use-case suggestions, autocomplete, and follow-ups. Make them contextual and personalised, and don't repeat ones the user skipped.
- **Less chat, more answer**: give the essential answer first (the "truncated pyramid"), then offer follow-up chips for more depth. Cut filler and preamble.
- **Don't autoscroll** to the end of a streaming response. Keep the user at the start of the new message.
- Use progressive disclosure (expand/collapse) inside long answers. Allow resizing or fullscreen. Let users save, copy or share useful outputs. Consider voice input (relevant to interview practice).
- Handle vague prompts with clarifying questions (`/articles/ai-prompt-structure/`, `/articles/AI-conversation-types/`).
- AI UX Playground adds: trust scaffolding (sources and citations, confidence, "why this suggestion"), failure states (refusals, hallucination recovery, retry or regenerate), human-in-the-loop (user approves before the AI acts, e.g. before sending a follow-up email), stop-generation control, and an editable output.

**Error messages** *(verified: `/articles/error-message-guidelines/`)*
- **Visibility**: show the error next to its source. Use high-contrast red plus an icon or border, never colour alone. Match the severity: inline for minor errors, a banner or toast for page-level ones, a modal only for severe ones. Don't show errors prematurely.
- **Communication**: use plain language with no codes (codes only as a secondary diagnostic). Name the specific problem and give a constructive remedy. Use a positive, non-blaming tone: avoid "invalid" and "incorrect", and **avoid humor** in errors.
- **Efficiency**: prevent errors (warn before acting), **preserve the user's input**, offer likely fixes ("Vouliez-vous dire gmail.com ?"), and explain the system briefly. For total failures, apologise.

**Microcopy / UX writing** *(from knowledge; hub `/articles/ux-writing-study-guide/`)*
- Users **scan** and don't read (UX Myth #1). Front-load the keywords and write for the F-pattern. Use concise, scannable, objective language. Write the CTA as verb + object.
- Use consistent terms. Use the user's language (Heuristic 2). Avoid "Click here" and vague "En savoir plus" links, because link text must make sense out of context (accessibility).
- Tone: friendly but not cute in error or stress moments (job search is stressful). Save personality for success states.
- Use helpful instructional text before an error happens (format hints under fields), not after.

### B3. UX Myths: all 34 (uxmyths.com, titles verified via search snippets)

| # | Myth | Correction |
|---|---|---|
| 1 | People read on the web | They scan. Use headings, bold keywords, short paragraphs and lists |
| 2 | All pages should be accessible in 3 clicks | Click count doesn't affect satisfaction or success. **Scent of information** matters (each click clearly progresses) |
| 3 | People don't scroll | They do (66% of attention is below the fold, per Chartbeat). Avoid false bottoms. Don't cram everything above the fold |
| 4 | Design is about making a site look good | Design is how it works and communicates. Visuals serve the task |
| 5 | Accessibility is expensive and difficult | It costs about the same if built in from the start, and it improves usability for all |
| 6 | Accessible sites are ugly | Accessible can be beautiful. Constraints (contrast, focus states) are design inputs |
| 7 | Graphics will make a page element more visible | Flashy, graphic emphasis triggers banner blindness. Use contrast and placement instead |
| 8 | Stock photos improve the user experience | Generic stock is ignored. Real, relevant imagery (real people, the product) performs better |
| 9 | Design has to be original | Reuse proven conventions (Jakob's Law). Originality goes into the value |
| 10 | If your design is good, small details don't matter | Microcopy, error messages and button labels move metrics |
| 11 | You need to redesign your website periodically | Users dislike big changes. Iterate incrementally |
| 12 | More choices and features result in higher satisfaction | Choice overload and feature bloat reduce satisfaction and conversion |
| 13 | Icons enhance usability | Icons without labels are often ambiguous. **Label icons** (except universal ones: search, close, home) |
| 14 | You are like your users | False-consensus bias. You are not the user, so research and test |
| 15 | Users make optimal choices | Users satisfice: they pick the first reasonable option. Make the right option the obvious one |
| 16 | Search will solve a website's navigation problems | Search complements clear information architecture and navigation. It doesn't replace them |
| 17 | The homepage is your most important page | Many users land deep (via SEO or links). Every page must orient |
| 18 | Flash is evil | (Historical) Technology isn't evil, misuse is. Today that means heavy JS animation or scroll-jacking |
| 19 | You don't need the content to design a website | Design with real content. Lorem ipsum hides layout and length problems |
| 20 | If it works for Amazon, it will work for you | Context differs. Copy the reasoning, not the pixels |
| 21 | People can tell you what they want | Observe behaviour. What people say ≠ what they do |
| 22 | Usability testing is expensive | Guerrilla or paper tests with a few users are cheap and very effective |
| 23 | Choices should always be limited to 7±2 | Miller's number is about working memory, not menus. Well-organised long lists are fine |
| 24 | People always use your product the way you imagined they would | Users repurpose products. Observe real usage and support emergent use |
| 25 | Aesthetics don't matter if usability is good | Aesthetics affect trust, perceived usability and credibility |
| 26 | Usability testing = focus groups | Focus groups record opinions; usability tests observe behaviour on tasks |
| 27 | UX design is about usability | UX also covers emotion, value, content, trust and the brand experience |
| 28 | White space is wasted space | White space improves comprehension and hierarchy (Wichita State study) |
| 29 | People are rational | They are predictably irrational. Design for the biases (ethically) |
| 30 | If you are an expert, you don't need to test your design | Expert reviews miss real failures. Test with real users |
| 31 | UX design is a step in a project | UX runs continuously through the product lifecycle |
| 32 | Success happens overnight | Products succeed through years of iteration |
| 33 | Mobile users are distracted | Much mobile use happens at home (60%, per Google data). Don't dumb down mobile content |
| 34 | Simple = minimal | Simple means easy to understand, not stripped down. Removing labels or affordances makes things harder |

### B4. Cognitive biases most useful for product UI: ethical use and dark-pattern risks

Sources: growth.design/psychology, ui-patterns.com/patterns/cognition/list, Laws of UX, The Decision Lab. Dark patterns are a legal risk in the EU: the **DSA (art. 25)** bans deceptive interfaces, the GDPR requires consent free of nudging, and **DGCCRF/CNIL** enforce. Pre-ticked consent and asymmetric "refuse" buttons are illegal under CNIL's cookie guidance *(legal points from knowledge)*.

| Bias | What it is | Ethical TalkUp use | Dark-pattern red line |
|---|---|---|---|
| Anchoring | The first number seen frames later judgments | Show the CV score with its benchmark ("62/100, average for this role 55"), and the annual price next to the monthly price | Fake "was" prices, inflated anchors |
| Default effect / status-quo bias | People stick with the preselected option | Smart defaults (reminder 2 days before an interview, privacy-safe settings ON) | Pre-checked marketing or consent boxes, default upsell add-ons |
| Framing | The same fact presented as a gain or a loss changes the choice | "3 compétences fortes à mettre en avant" before "2 points à améliorer". Constructive feedback framing | Confirmshaming ("Non, je ne veux pas trouver de travail") |
| Loss aversion | Losses weigh about twice as much as gains | "Votre brouillon sera perdu", shown only when it is true | Fear-based upsells, fake expiry |
| Zeigarnik effect | Unfinished tasks nag the mind | "Continue your interview prep (3/5 questions)" and profile completion | Artificial incompleteness, endless checklists |
| Goal-gradient | Effort rises near the goal | Progress bars that start with credit for steps already done, steps left in wizards | Moving goalposts |
| IKEA effect | People value what they helped build | Let users customise their CV and edit AI drafts (co-creation means ownership) | Locking user-built data behind a paywall to block leaving (lock-in) |
| Endowment effect | People overvalue what they already have | Free trial with the real features, "your saved applications" | Trials that auto-convert without clear notice |
| Peak-end rule | Judged by the peak and the ending | Celebrate the first analysis, end interview sessions with a clear summary and a next step | Masking a bad end with confetti |
| Social proof | People follow what others do | Real, verifiable testimonials and usage numbers | Fake reviews or counters ("12 people are viewing") |
| Scarcity / urgency | Scarce things seem more valuable | Real deadlines only (a job posting's closing date, shown in the tracker) | Fake countdowns, fake low stock |
| Commitment & consistency | People act consistently with past commitments | Small first step (set a weekly goal), then reminders | Foot-in-the-door to hidden costs |
| Reciprocity | People return favours | Give value first (a free CV analysis) before asking for sign-up or payment | Forced registration disguised as a "gift" |
| Labor illusion | Visible effort raises perceived value | Show the real steps of the AI analysis ("Lecture du CV… Analyse des compétences…") | Fake delays to look smart (this violates Doherty) |
| Choice overload / decoy effect | Too many options paralyse; a dominated option steers the choice | ≤3 clear plans, one recommended honestly | A decoy plan designed only to manipulate |
| Aesthetic-usability / halo effect | Pretty means trusted | Earn trust with polish **and** accuracy | Polish that hides weak AI output, with no error disclosure |
| Fresh start effect | Temporal landmarks motivate | "New week: 3 applications goal" on Mondays | Nagging streaks that shame users |

Ethics rule for the skill: **use a bias only when it helps the user reach their own goal (getting hired), and when the same design would survive being explained to the user.** Never exploit job-search anxiety.

---

## C. French creators

**Basti UI: Bastien Marécaux** (YouTube "Basti UI", Twitch lives)
- He is a UX/UI designer, YouTuber and streamer, and one of the most-followed French webdesign creators. He was a mobile developer and UI designer in Brussels and has worked at Atecna and as a freelancer (Design Journeys podcast #22).
- Themes (from video titles): **live Figma** sessions and tutorials (responsive design and auto layout, design systems: "Comment construire un design system ?"), **timed redesign challenges** ("je redesign MSN Messenger en 1h", "Dessiner des applis de mémoire"), **critiques of famous products** ("Pourquoi Amazon est aussi moche ?", which argues that an "ugly" UI can be the right UI when conversion and conventions win, a Jakob's Law point *(interpretation)*), and freelance and designer life (paying illustrators, workplace anecdotes).
- Recurring advice *(inferred from content; not individually verified)*: learn by doing and redesigning real products, structure work with auto layout and components, and share knowledge to grow together (the podcast title: "partager ses connaissances pour progresser ensemble"). Critique starts with *why* a product looks the way it does before you judge the visuals.
- Agent use: YouTube is not fetchable for content. Use his work for **method**: timeboxed redesigns and critique-before-redesign.
- Sources: podcast.ausha.co/design-journeys/22-bastien-marecaux-basti-ui; digidop.com/blog/6-youtube-channels-to-follow-2024-learn-figma; thetvdb.com/series/basti-ui.

**Cléa Cassutti** (spelled "Cassuti" in the seminar list; the web uses **Cassutti**). Freelance product (UX/UI) designer in Nice, a Framer expert, works with Expansion Studio.
- Positioning (Framer Experts profile): *"Je crée des interfaces et des landing pages fondés sur la psychologie du comportement pour réduire la friction, anticiper les réactions et rendre l'expérience évidente."* That is, interfaces built on **behavioral psychology** to **reduce friction**, **anticipate reactions** and make the experience **obvious**.
- Specialty: **SaaS product design and SaaS landing pages** (Codeur profile). Recent work: hero-section redesigns, Framer CMS site redesigns, a web-app interface offer (6 weeks, including user research and "UX issue detection", in close collaboration with developers for clean integration). She posts under the tag #createeveryday.
- Takeaways for the skill: tie each UI decision to a **behavioural rationale** (biases and laws, §A and §B4); landing-page hero craft (one clear promise, one CTA); designer-dev collaboration.
- Her Instagram and LinkedIn content was not found or verified. Ask the user for her handle if her posts are to be quoted.
- Sources: framer.com/@clea-cassutti (via search; a direct fetch returned 404), contra.com/clea_cassutti, codeur.com/-cleac, linkedin.com/in/cléa-cassutti-336b07141.

**The Cacatoès Theory (TCT)**: https://www.thecacatoestheory.com (open and fetchable). A Paris product design studio (Cacatoès Design, founded 2018) and training organisation **specialising in complex SaaS UI/UX**. It is run by **Romain Dao** (design engineer, Figma and design-system trainer since 2018), with Maxime.
- Offer: Figma courses (fundamentals, **design systems with AI**, **Figma MCP and AI delivery workflows**, Figma Make prototyping, design leadership), design-system audits, DesignOps consulting, and mentoring. Clients include Orange, BNP Paribas, France Travail, Allianz and Figma.
- Community: a **Slack of ~4,000+ designers** and regular **Design Challenges with live UI reviews** (academy.thecacatoestheory.com/les-design-challenges). There is also a YouTube channel, Instagram and a blog (`/blog`: design tokens for front-end handoff, essential Figma plugins for design systems, UI art styles, building a product-designer portfolio, important UX figures).
- Recurring themes and advice: **design systems and tokens as the bridge to developers**; clean component handoff and **documenting intent** so teams need fewer back-and-forth exchanges; making **complex SaaS understandable**; prototyping fast, failing early and learning fast; building good habits (structure, naming, variables and modes) from day 1; AI and MCP in the design-to-dev loop.
- Takeaways for the skill: respect TalkUp's token system (`tailwind.css` is the source of truth), document the "why" in PR descriptions, and run critique like a live UI review (heuristics → laws → tokens → accessibility).

---

## Sources (fetched or searched this session)

- https://lawsofux.com/ · https://lawsofux.com/fittss-law/
- https://www.nngroup.com/articles/ten-usability-heuristics/ · /articles/empty-state-interface-design/ · /articles/error-message-guidelines/ · /articles/ai-chatbots-design-guidelines/ · /articles/prompt-suggestions/ · /articles/less-chat-more-answer/ · /articles/site-ai-chatbot/ · /articles/designing-ai-study-guide/
- https://ui-patterns.com/patterns
- https://uxmyths.com/ (403; titles via search: e.g. /post/654047943/myth-people-dont-scroll, /post/2059998441/myth-28-white-space-is-wasted-space, /post/931925744/myth-23-choices-should-always-be-limited-to-seven, /post/115783813605/myth-34-simple-minimal)
- https://aiuxplayground.com/access.md · https://aiuxplayground.com/llms.txt · https://www.producthunt.com/products/ai-ux-playground
- https://growth.design/psychology · https://thedecisionlab.com/biases · https://en.wikipedia.org/wiki/List_of_cognitive_biases
- https://www.awwwards.com/websites/ · https://www.httpster.net/ · https://www.siteinspire.com/ · https://collectui.com/ · https://www.designspiration.com/ · https://muz.li/
- https://mobbin.com/ · https://mobbin.com/pricing.md · https://refero.design/ · https://doc.refero.design/mcp/getting-started · https://doc.refero.design/mcp/examples
- https://design.numerique.gouv.fr/ · /accessibilite-numerique/ · /outils/ · https://accessibilite.numerique.gouv.fr/
- https://www.thecacatoestheory.com/ · https://www.thecacatoestheory.com/blog · https://www.sortlist.com/agency/the-cacatoes-theory
- https://podcast.ausha.co/design-journeys/22-bastien-marecaux-basti-ui · https://www.digidop.com/blog/6-youtube-channels-to-follow-2024-learn-figma · https://www.thetvdb.com/series/basti-ui/allseasons/official
- https://www.framer.com/@clea-cassutti/ · https://contra.com/clea_cassutti/about · https://www.codeur.com/-cleac
