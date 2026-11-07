# AGENTS.md

Repo guide for coding agents (and humans) working on TalkUp.AI. Tool-neutral: any agent that reads `AGENTS.md` should follow it.

## Project shape

Monorepo (npm workspaces) + Python AI services. Three top-level dev surfaces:

| Path | Stack | Purpose |
|------|-------|---------|
| `web/` | React 19, Vite, TypeScript, Tailwind v4, TanStack Router/Query/Form, TipTap, Zustand, i18next, Vitest, Playwright | User-facing SPA |
| `server/` | NestJS 11, TypeORM 0.3 (Postgres), ioredis, JWT, bcrypt, nodemailer, throttler, Swagger, Jest | REST + WebSocket API |
| `ai/` | Python microservices (`speech-to-text`, `text-to-speech`, `behavior-analyzer`, `emotional-analyzer`, `verbal-analyzer`, `llm-core`) + C++ core orchestrator | Conversation analysis pipeline |

Workspaces are `web` and `server`. `ai/` is independent (Docker Compose).

## Commands

Run from repo root unless noted.

```bash
# Dev
npm run dev:web        # Vite on :8081
npm run dev:server     # NestJS watch mode

# Quality (CI mirrors these — run before pushing)
npm run lint:check     # oxlint, all workspaces
npm run format:check   # prettier
npm run tsc:check      # tsc --noEmit
npm run test           # Jest (server) + Vitest (web)

# Auto-fix
npm run lint
npm run format

# E2E
npm run e2e:web        # Playwright
npm run e2e:web:ui     # Playwright UI mode

# Build
npm run build:web
npm run build:server
```

Server tests enforce **80% coverage** (branches/functions/lines/statements) — `server/package.json` `jest.coverageThreshold`.

**Running the app locally and driving it end to end** (Postgres + Redis + server + web, a seeded verified user, browser automation): see `LOCAL_DEV.md` at the repo root when present (it is a local, per-developer file).

## Conventions

### Branching & PRs

- Trunk-based. Branch from `staging` (default base for PRs).
- Branch name: `<id>-<nature>-<description>` kebab-case, ≤80 chars. Example: `182-task-architecture-speech-to-speech-test`.
- **Issue = PR = branch.**
- **Squash-and-merge only.** Final squash commit format: `[issue-id] short description (#pr-id)`. Do not generate per-commit changelogs — only the squash message lands on `staging`.
- Conventional Commit types used inside the branch: `feat`, `bug`, `anomaly`, `refactor`, `build`, `tests`, `docs`, `chore`, `ci`. Imperative present tense, no leading capital, no trailing period, ≤80 chars. No description or co-author lines in individual commits.

### Code style

- TypeScript strict. No `any` across API boundaries.
- Lint: `oxlint` (not ESLint). Web uses `--react-plugin --jsx-a11y-plugin --import-plugin --promise-plugin`. Server uses `--jest-plugin --promise-plugin --node-plugin`. Configs at `web/oxlintrc.json` and `server/oxlintrc.json`.
- Format: `prettier` 3 with `@trivago/prettier-plugin-sort-imports` on web.
- File names: kebab-case for files, PascalCase for React components / Nest classes.
- `web/src` files use CRLF line endings: preserve them when editing.

### Server (NestJS)

- Modules under `server/src/modules/<name>/` with `controller`, `service`, `module`, `dto/`, optional `events/`.
- Entities under `server/src/entities/`. PKs are `uuidv7`.
- Every controller route: `@ApiTags`, `@ApiOperation`, `@ApiResponse`. Every DTO field: `@ApiProperty(Optional)?` + `class-validator` decorator.
- Guards from `modules/auth` (`JwtAuthGuard`). Apply at controller level when all routes are protected.
- Throttler: keep global default; override stricter on auth-adjacent routes.
- Cookie-based auth with refresh-token rotation (Redis-backed).
- Specs colocated as `*.spec.ts`. Mock repos with `getRepositoryToken`. Mock services in controller specs.

### Web (React)

- **Design: any task that changes what a user sees or does in `web/` follows the `talkup-design` skill** (`.agents/skills/talkup-design/SKILL.md`): frame, references, visual options (*pistes*) for a human to choose, implement, measured audit. The human version of the method is `docs/design/METHODE.md`.
- **Source of truth for the design.** An item listed in `docs/design/figma-backlog.md` follows the Figma file (`N0oUi7zzoaQHvkMVYh2wLM`). Everything else follows the code: tokens in `web/src/styles/tailwind.css` (they win over docs) and `web/DESIGN.md`. A PR that implements a backlog item removes it from the backlog.
- Use semantic CSS variables / Tailwind classes (`bg-accent`, `text-text`, `border-border`, etc.) — no hardcoded hex. Saira for headings/buttons, Inter for body. Verify dark mode (`.dark` class) for any new persistent UI.
- **i18n**: the app is bilingual (FR/EN, i18next). New copy goes through keys in both `web/src/locales/en/*.json` and `web/src/locales/fr/*.json`; see `web/I18N.md` once the i18n PRs land.
- Routing: TanStack Router file-based, generated tree at `src/routeTree.gen.ts` — do not hand-edit.
- Data: TanStack Query for server state, Zustand for client state.
- Forms: TanStack Form. Validation alongside form definition.
- Sanitize any HTML from rich-text (TipTap) with `dompurify` before render.
- Tailwind v4 (CSS-first config). No `tailwind.config.js`.
- Tests: Vitest + Testing Library in `web/tests/` and colocated `*.test.tsx`. E2E in `web/tests/` Playwright suite.

### API contract — Bruno

`server/talkup-backend-bruno/` is the source-of-truth API collection. **Every route change must update the matching `.bru` file.**

## Protected paths

Do not edit (some agent setups enforce this with hooks):
- `*.env`, `*.env.*`
- `**/package-lock.json`
- `**/.git/**`, `**/node_modules/**`

Lockfile changes belong to dependency-bump PRs only — let `npm install` regenerate, do not hand-edit.

## CI

`.github/workflows/`:
- `code-quality.yml` — lint + format + tsc
- `unit-tests.yml` — Jest + Vitest (with coverage gates)
- `e2e-tests.yml` — Playwright
- `discord-notifications.yml`, `teams-notifications.yml` — status pings
- `mirror-push.yml` — mirror to secondary remote

Always run `npm run lint:check && npm run tsc:check && npm run test` before pushing.

## Agent tooling

- **Skills** live in `.agents/skills/<name>/SKILL.md` (Agent Skills format). Tools that look elsewhere get a symlink, e.g. `.claude/skills/<name>` → `../../.agents/skills/<name>`.
  - `talkup-design` — design methodology for any user-visible change in `web/`.
- Helpful capabilities, when your agent has them: browser automation (Playwright) to run the app and audit pages, a live-docs server for NestJS / TanStack / TipTap / Tailwind / TypeORM, read access to the Figma file. Per-developer agent configuration (reviewer agents, MCP config, local skills) is not versioned.

## Out of scope unless asked

- Do not touch `ai/` Python services from web/server tasks; they have their own ownership.
- Do not edit generated files: `web/src/routeTree.gen.ts`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`.
- Do not push, force-push, or close PRs without explicit ask. Squash-and-merge is the human's call.
