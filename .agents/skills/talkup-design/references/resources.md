# Resources: where a designer looks

**Read this when:** gathering references (phase 1), and whenever a piste needs a "why".
**What it is:** the seminar's resource list, mapped to design phases, with how an agent can actually reach each one (tested 2026-11-07). Access changes: if a route fails, say so and use the next resource, do not invent what a page shows.
**Full notes:** `docs/design/research/research-resources-ux-laws.md` §0–1.

Access legend: **fetch** = readable with a plain web fetch; **browser** = needs browser automation (JS or bot wall), look at screenshots; **paid** = needs the human's account; **search** = only titles/snippets via web search.

## Contents
1. Which resource for which phase
2. Real product flows
3. Visual inspiration
4. Guides and knowledge
5. Accessibility
6. People to follow (for humans)
7. How to cite a reference in a piste

## 1. Which resource for which phase

| Phase | Reach for |
|---|---|
| 0 Frame: understand the user and question the concept | NN/g study guide on the topic, UX Myths (kill bad assumptions), growth.design/psychology, AI UX Playground for AI features |
| 1 References: how real products solve it | Real product flows (Refero, Mobbin if the human has them; otherwise screenshots of products you know via browser), AI UX Playground teardowns, UI-Patterns |
| 2 Pistes: patterns and art direction | UI-Patterns, Laws of UX; Collect UI / Dribbble for components; Awwwards / Httpster / Siteinspire for marketing pages only |
| 5 Build | TalkUp tokens and components win over any inspiration |
| 6 Critique and audit | Nielsen's 10, Laws of UX, bias ethics (`ux-laws.md`); design.numerique.gouv.fr checklists; `run-audit.mjs`, axe, Lighthouse |

Operate screens (app UI): look at **products** (flows, real screens), not at award sites. Persuade screens (landing): award sites help.

## 2. Real product flows

| Resource | Best for | Access | How |
|---|---|---|---|
| **Refero** refero.design | Real web/iOS screens and end-to-end flows (onboarding, empty state, cancellation…) | browser; MCP `https://api.refero.design/mcp` is **paid** | Ask the human if they have an account; queries like "empty state for list with CTA", "web onboarding B2C SaaS" |
| **Mobbin** mobbin.com | Largest library of shipped screens and flows | **paid** for flows and search (free tier: no search) | Only if the human has Pro; otherwise skip and say so |
| **AI UX Playground** aiuxplayground.com | AI feature patterns, teardowns of ChatGPT / Claude / Perplexity / Gemini, failure states, trust, human-in-the-loop | **fetch**; start from `/llms.txt` | `/patterns`, `/frameworks/chat-ux`, `/frameworks/trust-scaffolding`, `/frameworks/agentic`, `/teardowns/<job>`, `/ai-failure-states`, `/human-in-the-loop-ai`. The go-to for Tali. |
| **UI-Patterns** ui-patterns.com | Problem / solution / usage / rationale of a pattern | **fetch** | `/patterns/<Slug>` (`BlankSlate`, `Wizard`, `undo`, `ProgressiveDisclosure`, `TableFilter`, `InplaceEditor`, `GoodDefaults`, `StepsLeft`…), `/patterns/<section>/list` |
| Products you know | Linear, Notion, Airtable (the designer's own reference for kanban and the assistant), Google Calendar, Welcome to the Jungle, LinkedIn, Indeed | browser | Screenshot the relevant screen; describe precisely what you take from it |

## 3. Visual inspiration

| Resource | Best for | Access | How |
|---|---|---|---|
| **Collect UI** collectui.com | One component or screen type (Daily UI challenges) | browser (images load by JS; unknown slugs still return 200, check images appear) | `/challenges/<slug>`: `sign-up`, `dashboard`, `onboarding`, `calendar`, `settings`, `file-upload`, `search`, `notifications`… |
| **Dribbble** dribbble.com | Component and visual exploration | browser (bot wall) | `/search/<term>`, `/tags/<tag>`. Shots are often unrealistic: never copy their contrast or density. Has an AI filter. |
| **Behance** behance.net | Full case studies, branding systems | browser (403 to fetch) | `/search/projects/<term>` |
| **Designspiration** designspiration.com | Colour and type moodboards (Dribbble alternative) | fetch (results are images: view in browser) | `/search/saves/?q=<term>` |
| **Awwwards** awwwards.com | High-craft marketing sites, motion, type | fetch | `/websites/<category>/` (`startups`, `education`), `/websites/<tag>/`, colour `/websites/%23<HEX>/`. Not for app UI. |
| **Httpster** httpster.net | Curated, less noisy showcase | fetch | `/type/<slug>/`, `/style/<slug>/` (read slugs from the menu) |
| **Siteinspire** siteinspire.com | Restrained, editorial, minimal sites | fetch (throttle: 429 on repeated hits) | `/websites/category/<slug>` (`minimal`, `typographic`, `grid-layout`) |
| **Muzli** muz.li | Trends digest, articles | fetch (search.muz.li needs browser) | Scan trends, don't reference patterns from it |

## 4. Guides and knowledge

| Resource | Best for | Access | How |
|---|---|---|---|
| **Laws of UX** lawsofux.com | The 30 laws, with origins | fetch | `/<slug>/` (`fittss-law`, `hicks-law`, `law-of-proximity`…). Digest in `ux-laws.md`. |
| **NN/g** nngroup.com | The reference in UX research | fetch | Start from the topic's study guide (`/articles/designing-ai-study-guide/`, `/topic/forms/`); web search restricted to nngroup.com |
| **UX Myths** uxmyths.com | Frequent UX mistakes | search only (Cloudflare) | All 34 summarised in `ux-laws.md` |
| **Cognitive biases** | The seminar's "cognitive bias index" | fetch | growth.design/psychology (106 entries), thedecisionlab.com/biases, Wikipedia "List of cognitive biases" (codex) |
| **Shape of AI** shapeof.ai | AI interaction pattern catalogue | fetch | Wayfinders, governors, trust builders |
| **Microsoft HAX / Google PAIR** | Human-AI interaction guidelines | fetch | HAX 18 guidelines; PAIR Guidebook chapters |

## 5. Accessibility

| Resource | Use | Access |
|---|---|---|
| **design.numerique.gouv.fr** (the seminar's "design.gouv"; `design.gouv.fr` does not exist) | Checklist Formulaires, checklist dev, Diagnostic Flash, Audit rapide, mémos design/dev | fetch: `/outils/checklist-forms/`, `/outils/checklist-dev/`, `/outils/diagnostic-flash/` |
| RGAA accessibilite.numerique.gouv.fr | French criteria (WCAG-based) | fetch |
| Ara ara.numerique.gouv.fr, Assistant RGAA extension | Full audits (humans) | browser |
| **Lighthouse** | Second-opinion accessibility score | `npx lighthouse <url> --only-categories=accessibility` (PageSpeed web cannot reach localhost). A score of 100 is not "accessible": it misses focus order, focus visibility, target spacing, rhythm. |
| axe-core | WCAG rules in the page | `run-audit.mjs --axe` |

## 6. People to follow (for humans)

Mostly video or social posts: useful to train the team's eye, not fetchable doctrine.
- **Basti UI** (Bastien Marécaux): Twitch, YouTube, Instagram. Live UI reviews and redesign challenges; builds on Refactoring-UI-style tips.
- **Cléa Cassutti** (two t's): Instagram, LinkedIn. Product designer who also builds (Framer); SaaS and landing pages grounded in behavioural psychology.
- **The Cacatoès Theory** (Cacatoès studio, Romain Dao): LinkedIn, Instagram. Community of ~4,000 designers, Figma tutorials, design challenges, live UI reviews.

## 7. How to cite a reference in a piste

Each reference in a piste states **what you take** and **what you leave**: "Linear's issue view: the back link sits above the title, quiet, with the parent's name; we keep that, not their monospace IDs." A bare link proves nothing. If you could not open a resource (paid, blocked), say which and what you used instead.
