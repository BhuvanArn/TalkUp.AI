# TalkUp.AI — Web design system

This document describes how the **TalkUp** product should look and feel in the browser. It is aligned with the **implemented tokens** in `src/styles/tailwind.css` (Tailwind v4 `@theme`). When in doubt, **the CSS variables win** — update this file if tokens change.

TalkUp is a career and interview preparation product (simulations, agenda, notes, profile). The UI should feel **clear, professional, and calm**: plenty of whitespace, readable type, and a **cool blue / indigo** accent — not a warm “marketing brochure” palette.

---

## 1. Visual theme and atmosphere

- **Canvas**: White (`--color-background`) with **subtle cool-tinted surfaces** (`--color-surface` `#f8f9ff`, `--color-surface-raised` `#ecedf6`) so sections and sidebars feel layered without heavy chrome.
- **Accent**: Interactive blue `--color-accent` `#2b70c9` (links, focus, primary actions). Deeper navy **`--color-primary` `#29457a`** supports brand-weight elements where used in the app.
- **Contrast**: Body text is near-black violet-gray (`--color-text` `#24242d`), not pure black — slightly softer for long sessions (interviews, calendar, editors).
- **Depth**: Prefer **borders** (`--color-border` `#d9dbeb`) and light surface steps over dramatic shadows. Elevation is modest; the product is tool-like, not a landing-page spectacle.
- **Dark mode**: The `.dark` class on the document flips the full palette (see `tailwind.css`). New UI must remain usable in both schemes.

**Key characteristics**

- Cool lavender-gray surfaces, blue accent, high legibility.
- Structured layouts (dashboards, tables, forms) over full-bleed gradient marketing blocks.
- French copy is common in settings flows; layout should tolerate longer labels.

---

## 2. Color palette and roles

Use **semantic CSS variables** in components (Tailwind: `bg-background`, `text-text`, `border-border`, `bg-accent`, etc., per your class conventions). Hex values below are the **light theme** defaults from `@theme`.

### Brand and interactive

| Role                   | Variable                                        | Light default        | Usage                                               |
| ---------------------- | ----------------------------------------------- | -------------------- | --------------------------------------------------- |
| Accent                 | `--color-accent`                                | `#2b70c9`            | Links, primary buttons, focus rings, key highlights |
| Accent hover / active  | `--color-accent-hover`, `--color-accent-active` | `#205497`, `#163865` | Pressed / hover states                              |
| Primary (brand weight) | `--color-primary`                               | `#29457a`            | Strong brand moments (varies by screen)             |
| Text link              | `--color-text-link`                             | `#2b70c9`            | Inline links                                        |

### Surfaces

| Role                     | Variable                                            | Light default |
| ------------------------ | --------------------------------------------------- | ------------- |
| Page background          | `--color-background`                                | `#fff`        |
| Soft panels              | `--color-surface`                                   | `#f8f9ff`     |
| Raised / cards / sidebar | `--color-surface-raised`, `--color-surface-sidebar` | `#ecedf6`     |
| Note cards               | `--color-note-card`                                 | `#ecedf6`     |

### Text

| Role      | Variable                                     | Light default         |
| --------- | -------------------------------------------- | --------------------- |
| Primary   | `--color-text`                               | `#24242d`             |
| Secondary | `--color-text-weak` … `--color-text-weakest` | `#383850` → `#a4a4b2` |
| Muted UI  | `--color-text-idle`                          | `#57585e`             |

### Borders and icons

| Role           | Variable                | Light default |
| -------------- | ----------------------- | ------------- |
| Default border | `--color-border`        | `#d9dbeb`     |
| Strong border  | `--color-border-strong` | `#c8c8d4`     |
| Icons          | `--color-icon`          | `#5f5f77`     |

### Status (use full scale: base + weak/weaker + hover/active)

- **Success**: `--color-success` (e.g. confirmations, positive states)
- **Warning**: `--color-warning`
- **Error / danger**: `--color-error`, `--color-danger` (aliases)

### User-chosen accents (profile / appearance)

Some flows (e.g. profile appearance) allow a **user accent** such as `#2B70C9`, `#1D9E75`, etc. Treat these as **overrides on top of** the system accent for that user’s preview only; core chrome should still respect theme tokens where possible.

---

## 3. Typography

### Font families

| Role      | Variable / stack                          | Usage                                                   |
| --------- | ----------------------------------------- | ------------------------------------------------------- |
| Display   | `--font-display`: **Saira**, `sans-serif` | Headings (`text-h1` … `text-h6`), button text utilities |
| Body / UI | `--font-body`: **Inter**, `sans-serif`    | Body copy, labels, dense UI                             |

Google Fonts are loaded from `index.html` (Inter + Saira, variable weights).

### Scale (implemented utilities)

Sizes are defined as `@theme` variables and applied via classes in `@layer utilities` in `tailwind.css`:

| Utility                             | Font  | Size        | Weight (typical) |
| ----------------------------------- | ----- | ----------- | ---------------- |
| `text-h1` … `text-h4`               | Saira | 40px … 24px | 700              |
| `text-h5`                           | Saira | 20px        | 500              |
| `text-h6`                           | Saira | 18px        | 400              |
| `text-body-xl-strong`               | Inter | 18px        | 700              |
| `text-body-l`, `text-body-l-strong` | Inter | 16px        | 400 / 700        |
| `text-body-m`, `text-label-*`       | Inter | 14px        | 400              |
| `text-body-s`, `text-body-s-strong` | Inter | 12px        | 400 / 700        |
| `text-button-m`, `text-button-s`    | Saira | 14px / 12px | 400              |

### Principles

- **Headings**: Saira, bold display treatment — confident and product-like (not ultra-light display cut).
- **Body**: Inter, comfortable line-height (~1.5) for forms, notes, and interview UI.
- **Buttons**: Saira via `text-button-*` utilities keeps actions visually consistent with the brand.
- Do **not** introduce ad hoc font families for new screens unless there is a strong reason; extend the existing scale.

---

## 4. Component styling (product conventions)

### Buttons

- **Primary**: Filled with accent / primary tokens, white or high-contrast label text, clear hover/active (see existing button atoms and Tailwind classes).
- **Secondary / ghost**: Transparent or surface background, border from `--color-border`, text from secondary text tokens.
- **Destructive**: Use `--color-danger` and its hover/active variants.

Avoid ElevenLabs-style **full pill (9999px) everywhere** unless a specific screen already uses that pattern; match existing app buttons.

### Cards and panels

- Background: `--color-background` or `--color-surface` / `--color-surface-raised` depending on hierarchy.
- Border: `1px` or token border with `--color-border`; radius typically **8px–12px** in newer profile-style UI, consistent with surrounding components.
- Prefer spacing and alignment over heavy shadow stacks.

### Inputs and forms

- Borders and focus: use **accent-colored focus** (e.g. ring or border + soft glow) consistent with `--color-accent`.
- Labels: secondary text color, small/medium body scale.
- Always label controls for accessibility (`htmlFor` / `id`).

### Navigation and shell

- Sidebars often use `--color-surface-sidebar` and border separation.
- Sticky top bars: light background, bottom border; actions right-aligned where the app already does so.

### Atomic design

Shared UI lives under `src/components/` in **atoms → molecules → organisms**. Prefer extending existing pieces before adding parallel patterns.

---

## 5. Layout and spacing

- **Base unit**: 4px / 8px mental grid (Tailwind spacing scale is the practical reference).
- **Density**: Interview and calendar views may be denser; marketing-style “huge vertical gaps” are not the default.
- **Max width**: Centered content where it matches existing routes; dashboards are often full-width with internal max-width for readability.

---

## 6. Depth and elevation

TalkUp does **not** rely on a multi-layer, warm-tinted shadow language. Prefer:

- **Flat** surfaces with borders.
- **Optional** light shadow for modals / dropdowns only where already used in the codebase.

Focus rings should meet accessibility contrast; use accent or browser defaults wired through Tailwind focus utilities.

---

## 7. Do’s and don’ts

### Do

- Use **`tailwind.css` tokens** for colors, fonts, and semantic states (including dark mode).
- Use **Saira + Inter** via the provided utilities.
- Keep **accent blue** (`#2b70c9` light) as the default interactive color unless the screen is explicitly user-themed.
- Test **dark mode** when adding persistent UI.

### Don’t

- Don’t replace the palette with **achromatic warm stone** or black-only CTAs from third-party reference docs.
- Don’t add **Waldenburg / Geist** or other fonts not in the project without a deliberate design decision and `index.html` update.
- Don’t hardcode hex colors when a **CSS variable or Tailwind semantic class** exists.
- Don’t ship UI that only works in light mode.

---

## 8. Responsive behavior

Follow patterns already used in the app (TanStack Router layouts, existing breakpoints in components). Typical expectations:

- **Mobile**: stack sidebars / filters; preserve touch-friendly targets (min ~44px where possible).
- **Desktop**: multi-column dashboards, calendar grids, split editors.

There is no single “hamburger at 1024px” rule in this doc — match each route’s existing layout.

---

## 9. Agent prompt guide (TalkUp-aligned)

### Quick token reference

- Page: `var(--color-background)`; soft sections: `var(--color-surface)`.
- Text: `var(--color-text)` primary, `var(--color-text-weaker)` secondary.
- Actions: `var(--color-accent)`; borders: `var(--color-border)`.
- Headings: Saira; body: Inter; sizes from `text-h*` / `text-body-*`.

### Example prompts

- _“Build a settings card: background `var(--color-surface-raised)`, 10px radius, border `var(--color-border)`. Section title Saira 13px semibold, body Inter 13px `var(--color-text-weaker)`. Primary button filled `var(--color-accent)` white text.”_
- _“Create a form row: label Inter 12px `var(--color-text-idle)`, input border `var(--color-border)`, focus ring using `var(--color-accent)` at ~22% opacity.”_
- _“Hero for TalkUp: headline Saira `text-h1`, subcopy Inter `text-body-l`, CTA primary accent — cool white/lavender surfaces, not warm beige.”_

### Iteration checklist

1. Check `tailwind.css` for the latest variable values.
2. Use semantic tokens, not one-off hex, unless user-specific accent.
3. Verify **dark** class behavior for new surfaces and borders.
4. Reuse **atoms/molecules/organisms** before inventing new folders.

---

## 10. Relation to external inspiration

Earlier drafts referenced **ElevenLabs**-style marketing aesthetics (warm stone, Waldenburg, extreme pill buttons, layered shadows). **That is not the TalkUp baseline.** You may still borrow _ideas_ (clarity, whitespace, strong hierarchy) as long as **colors, fonts, and tokens** stay consistent with this file and `src/styles/tailwind.css`.
