# UX laws, heuristics, myths and biases

**Read this when:** choosing patterns for a piste (phase 2: cite the laws each piste relies on) and in the critique (phase 6: run Nielsen's 10).
**Sources:** lawsofux.com, nngroup.com, uxmyths.com, growth.design/psychology, The Decision Lab, ui-patterns.com. Full table with links: `docs/design/research/research-resources-ux-laws.md`. Fetch `https://lawsofux.com/<slug>/` or an NN/g article when you need the full argument.

## Contents
1. Laws of UX (30) with a TalkUp check
2. Nielsen's 10 heuristics
3. NN/g by topic: forms, empty states, onboarding, dashboards, errors, microcopy
4. UX myths to unlearn
5. Cognitive biases: ethical use and red lines

## 1. Laws of UX

| Law | Check on a TalkUp screen |
|---|---|
| Aesthetic-usability | Polish earns tolerance but hides problems: judge by task success, not looks. |
| Choice overload | ≤ 3–5 suggested prompts; filters behind "More"; a default sort. |
| Chunking | Long forms in labelled sections or steps; one card per application. |
| Cognitive load | One primary task per screen; can a new user name the main action in 5 s? |
| Doherty threshold (< 400 ms) | Pressed state < 100 ms; optimistic status changes; skeletons > 400 ms; stream AI text, never a blank 10 s spinner. |
| Fitts | Primary action large and near where attention is (end of form); ≥ 24 px, ideally 44; destructive far from frequent. |
| Flow | No modals or toasts during focus tasks (CV editing, simulation); autosave. |
| Goal-gradient | Progress that credits done steps ("profile 2/5"); steps left in wizards. |
| Hick | ≤ 7 top-level nav items; highlight the recommended option; progressive disclosure. Not for well-organised searchable lists. |
| Jakob | Logo → home, avatar → account, Esc closes, kanban for stages, calendar like Google Calendar. Innovate on value, not controls. |
| Common region | One concept per bordered box. |
| Proximity | Label closer to its field than to the previous field; inside < between. |
| Prägnanz | Simple shapes and icons in functional UI; fewer variants. |
| Similarity | Same look = same behaviour; nothing non-clickable looks like a button. |
| Uniform connectedness | Lines and containers for steppers, timelines, selected tab ↔ panel. |
| Mental model | User vocabulary (candidature, entretien); make AI capabilities and limits explicit. |
| Miller | Chunk content; do not cap menus at 7 (that is a myth). |
| Occam's razor | Remove elements until removing more breaks the task. |
| Paradox of the active user | No mandatory tours; contextual hints and good empty states. |
| Pareto | Polish the 20 % of flows used most (add application, CV analysis, simulation). |
| Parkinson | Prefill (CV import), realistic time estimates ("2 min"). |
| Peak-end | Design the best moment (first score, interview feedback) and the end (summary + next step); make errors gentle. |
| Postel | Accept "06 12 34 56 78" and "+33…", several date formats, drag-drop or browse; normalise on save. |
| Selective attention | Important info must not look like a banner (banner blindness). |
| Serial position | Key items first and last; primary CTA at the end of the flow. |
| Tesler | Move complexity to the system (AI parsing, defaults), not to the user. |
| Von Restorff | Exactly one accent primary button per view; never colour alone. |
| Working memory | Keep context in place (job title in the simulation header); show entered data on review steps. |
| Zeigarnik | "Continue where you left off" cards; never fake incompleteness. |
| Cognitive bias | See §5. |

## 2. Nielsen's 10 heuristics

| Heuristic | TalkUp check |
|---|---|
| 1 System status | Upload/analysis progress, saved indicator, Tali's state in words (thinking, acting, done), current nav item. |
| 2 Real-world match | Job-seeker vocabulary; statuses as candidates think (Sent → Interview → Offer / Rejected); FR dates in FR. |
| 3 User control | Undo after delete, stop AI generation, back without losing form data. |
| 4 Consistency | One term per concept, one component per job, sibling screens identical (login ↔ sign-up). |
| 5 Error prevention | Constraints stated upfront (PDF only, 5 MB), confirm destructive actions. |
| 6 Recognition over recall | Visible options, recent items, suggested prompts, company autocomplete. |
| 7 Flexibility | Shortcuts and bulk actions that don't burden novices. |
| 8 Minimalist design | Every element serves the task; no duplicated info. |
| 9 Error recovery | Plain language, specific cause, a fix, input preserved. |
| 10 Help | Contextual help ("How is the score calculated?") over a manual. |

## 3. NN/g by topic

**Forms.** One column; labels above fields; **never placeholder as label**; mark optional fields ("(optional)"); right input types (email, tel, date); validate on blur, not while typing; no error on untouched fields; error summary on submit for long forms; specific verb on the button ("Analyse my CV"); weaker secondary action; ask only what is needed now; autosave long forms. Pair with design.numerique.gouv.fr "Checklist Formulaires".

**Empty states.** Never blank (is it loading, broken or empty?). Skeleton while loading, not "no records". Explain what goes here and how to fill it; one primary action; optionally sample data. Three kinds: first use, user-cleared (celebrate), no results (offer to clear filters).

**Onboarding.** Learn by doing over upfront tours; if a tour, short, skippable, re-openable; first value fast (upload CV → see analysis); a setup checklist.

**Dashboards.** At a glance: 3–5 metrics that matter, answer "what do I do next?" (follow-ups due, next interview, latest score and trend); most important top-left; a designed zero-data state.

**Errors.** Next to the source; colour + icon + text; severity-matched (inline < banner < modal); plain language, specific cause, constructive fix; no blame ("invalid"), no humour; keep the input; suggest likely fixes ("Did you mean gmail.com?").

**Microcopy.** People scan: front-load keywords; verb + object CTAs; one term per concept; links meaningful out of context (no "click here"); friendly but not cute in stressful moments (job search is stressful); personality in success states; instructions before the error, not after.

**AI assistants:** see `ai-assistant-ux.md`.

## 4. UX myths to unlearn

| Myth | Reality |
|---|---|
| People read | They scan: headings, keywords, short paragraphs. |
| 3-click rule | Clicks don't matter; information scent does. |
| People don't scroll | They do; avoid false bottoms; don't cram above the fold. |
| Design is making it look good | Design is how it works and communicates. |
| Accessibility is ugly / expensive | Built in from the start, it costs little and helps everyone. |
| Graphics make things visible | Flashy emphasis triggers banner blindness; use contrast and placement. |
| Design must be original | Reuse conventions; be original on value. |
| Details don't matter | Microcopy, errors and labels move outcomes. |
| More features = more satisfaction | Choice overload and bloat reduce it. |
| Icons enhance usability | Unlabelled icons are ambiguous: label them (except search, close, home). |
| You are like your users | You are not the user. |
| Search fixes navigation | It complements a clear structure. |
| Design without content | Real content reveals length and layout problems. |
| If it works for big product X, it works here | Copy the reasoning, not the pixels. |
| 7 ± 2 items max | Miller is about memory, not menus. |
| White space is wasted | It drives comprehension and hierarchy. |
| Mobile users are distracted | Much mobile use is at home: don't dumb it down. |
| Simple = minimal | Simple means easy to understand; removing labels makes it harder. |

## 5. Cognitive biases: ethical use and red lines

Rule: use a bias only when it helps the user reach **their own** goal (getting hired) and the design would survive being explained to them. Never exploit job-search anxiety. EU law (DSA art. 25, GDPR, CNIL, DGCCRF) bans deceptive interfaces: pre-ticked consent and asymmetric refuse buttons are illegal.

| Bias | Ethical use | Red line |
|---|---|---|
| Anchoring | Score with a benchmark ("62/100, average for this role 55") | Fake "was" prices |
| Default effect | Smart defaults (reminder 2 days before an interview) | Pre-checked consent or marketing |
| Framing | Strengths before improvements | Confirmshaming ("No, I don't want a job") |
| Loss aversion | "Your draft will be lost", only when true | Fear-based upsells, fake expiry |
| Zeigarnik | "3/5 questions, continue" | Artificial incompleteness |
| Goal-gradient | Progress credited for done steps | Moving goalposts |
| IKEA effect | Users edit AI drafts and rename entities | Locking their data to stop them leaving |
| Peak-end | Celebrate the first analysis; clear end of a session | Confetti over a bad outcome |
| Social proof | Real, verifiable testimonials | Fake counters and reviews |
| Scarcity | Real deadlines (offer closing date) | Fake countdowns |
| Reciprocity | Free CV analysis before sign-up | Forced registration as a "gift" |
| Labour illusion | Show the real analysis steps | Fake delays |
| Decoy | ≤ 3 honest plans | A decoy plan |
| Fresh start | "New week: 3 applications" on Mondays | Shaming streaks |
