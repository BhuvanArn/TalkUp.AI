# Contributing

Guidelines and workflows for the TalkUp.AI project.

## Development Strategy

We use **Trunk-Based Development** with Git and GitHub. All work happens in short-lived branches created from `staging`, which is the default base for pull requests.

📌 **Do not work on a branch after it has been merged and deleted.**

## Project Tracking

Work is tracked via a **GitHub Project** linked to this repository. Each unit of work is a GitHub Issue using one of the templates in [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE):

- `bug_report.yml`: Title prefix `[Bug]`, label `bug`
- `feature_request.yml`: Title prefix `[Feature]`, label `feature`
- `task.yml`: Title prefix `[Task]`, label `task`

Open issues from the GitHub UI so the template loads automatically. Assign yourself when you start work.

### Issue → Branch

Create the branch directly from the issue using GitHub's **Development** panel (right sidebar of the issue → "Create a branch"). This auto-links the branch to the issue and pre-fills the name.

Adjust the generated name to match the convention below before creating.

## Branching

### Naming Convention

```
<issue-id>-<nature>-<description>
```

- `issue-id`: numeric ID of the linked GitHub issue (e.g. `184`)
- `nature`: `feature`, `bug`, `anomaly`, `refactor`, `chore`, `docs`, `tests`, `build`, `ci`
- `description`: brief purpose, kebab-case

**Examples:**

- `184-feature-landing-page`
- `127-feature-customize-user-profile`
- `160-task-create-refreshtoken-handling-in-backend`

**Constraints:**

- Use **kebab-case**
- Keep names under 80 characters
- Ideally match the GitHub issue title

### Creating a Branch Manually

If not creating from the issue UI:

```bash
git checkout staging
git pull origin staging
git checkout -b <issue-id>-<nature>-<description>
```

## Commit Messages

Conventional Commits with project-specific types.

### Format

```
<type>(<optional-scope>): <description>
```

#### Types

- `feat`: New feature
- `anomaly`: Unexpected behavior that doesn’t break the app
- `bug`: Issue that breaks the app
- `refactor`: Code improvements without behavior changes
- `build`: Changes to build system/configuration
- `tests`: Adding or fixing tests
- `docs`: Documentation updates
- `chore`: Other changes not fitting above
- `ci`: Continuous integration changes

#### Guidelines

- Use **present** tense, imperative form (e.g., "add", not "added")
- Do not capitalize the first letter
- Do not end with a period
- Keep under 80 characters

#### Examples

- `feat(auth): add passport authentication`
- `bug(profile): correct display of full name`
- `refactor(database): improve user query performance`
- `docs: clarify installation instructions`

> Per-commit messages are squashed away on merge, so favor clarity for reviewers over a clean changelog.

## Pull Requests

### Creating a PR

1. Push your branch.
2. Open a PR with `staging` as the base.
3. Use the template in [`.github/pull_request_template.md`](.github/pull_request_template.md). Fill every section — PRs with template sections deleted will be marked invalid.
4. Title format:

   ```
   [issue-id] short description
   ```

   - `issue-id`: linked GitHub issue number
   - `short description`: imperative, no capitalization, no period

5. Link the issue in the **Linked GitHub Ticket** section using `Closes <org>/<repo>#<issue-id>` so it auto-closes on merge.
6. Add a screenshot for any visual change.

### Review

PRs require at least **1 reviewer approval** before merge. CI must be green:

- `code-quality` (lint + format + tsc)
- `unit-tests` (Jest server ≥ 80% coverage, Vitest web)
- `e2e-tests` (Playwright)

Run locally before pushing:

```bash
npm run lint:check && npm run tsc:check && npm run test
```

### Merging

**Squash and merge only.** Final squash commit format:

```
[issue-id] short description (#pr-id)
```

Example:

```
[184] add landing page (#192)
```

The human merging the PR sets the squash message — do not generate per-commit changelogs.

## Releases

### Versioning

Semantic Versioning:

```
MAJOR.MINOR.PATCH release-name
```

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes and minor changes

### Creating a release

1. Take the latest `staging` commit and make a PR to `main` with the same process as above.
2. Once merged, create a GitHub release from the merge commit on `main` with the version tag and release name.
3. The release description should summarize the changes since the last release, ideally with bullet points for key features and fixes.
