# TalkUp.AI — Web design system

This document describes how the **TalkUp** product should look and feel in the browser. It is aligned with the **implemented tokens** in `src/styles/tailwind.css` (Tailwind v4 `@theme`). When in doubt, **the CSS variables win** — update this file if tokens change.

The foundations follow the post-seminar Figma (UI/UX seminar of 2026-11-06), file **TalkUp — App & Design System** (`N0oUi7zzoaQHvkMVYh2wLM`), pages "Avant / Après", "Foundations" and "Audit". Decisions from that file that the code does not implement yet are listed in [`docs/design/figma-backlog.md`](../docs/design/figma-backlog.md): for those items the Figma is the reference, for everything else the code is.

How to design a change (method, visual options, measurements): [`docs/design/METHODE.md`](../docs/design/METHODE.md), and the `talkup-design` agent skill in `.agents/skills/`.

TalkUp is a career and interview preparation product (applications, CV analysis, roadmap, simulations, agenda, notes, organizations). The UI should feel **clear, professional, and calm**: plenty of whitespace, readable type, a **cool blue** accent in light and a **navy** theme with **pastel** accents in dark.

---

## 1. Visual theme and atmosphere

- **Light canvas**: white page (`--color-background`) with cool-tinted surfaces (`--color-surface` `#f8f9ff`, `--color-surface-raised` `#ecedf6`).
- **Dark canvas**: tinted brand navy, never neutral black. Elevation reads by lightness: inset cards `#111c31` < sidebar `#16223a` < page `#18253f` < raised columns `#1f2e4d` < selected `#24345a`.
- **Accent**: interactive blue `#2b70c9` in light; pastel `#8fb8f4` with **dark labels** in dark ("pastel fill, dark text beats saturated fill, white text").
- **Status colours** go pastel in dark (mint `#8fdba4`, butter `#f2d488`, salmon `#f4a093`).
- **Depth**: borders and surface steps, not shadows. Chrome is separated with hairlines, not tint blocks (the light sidebar is the page surface plus a 1 px right border).
- **Contrast is measured, not eyeballed**: every text tier ≥ 4.5:1 on the surfaces it sits on, disabled labels included; input borders ≥ 3:1. Ratios are written next to the adjusted tokens in `tailwind.css`.
- **Colour carries meaning**: green means success only, accent means interactive only. Non-interactive labels (eyebrows, the org name in the nav) stay neutral.

---

## 2. Color palette and roles

Use **semantic tokens** (`bg-background`, `text-text`, `border-border`, `bg-accent`, …), never hex. Values below: light / dark.

### Brand and interactive

| Role | Token | Light | Dark | Notes |
| --- | --- | --- | --- | --- |
| Accent | `--color-accent` | `#2b70c9` | `#8fb8f4` | Links, primary actions, focus ring |
| Accent hover / active | `--color-accent-hover`, `-active` | `#205497`, `#163865` | `#a6c8f7`, `#bcd6fa` | Use `text-accent-hover` for accent **text on tinted backgrounds** (light accent is only 4.1–4.4:1 there) |
| Accent tints | `--color-accent-weak`, `-weaker` | `#eff1f6`, `#f0f4fa` | `#24345a`, `#1b2a47` | |
| Primary | `--color-primary` | `#29457a` | `#8fb8f4` | Default `Button` fill; same pastel as accent in dark |
| Label on fills | `--color-on-accent` | `#ffffff` | `#111c31` | Text/icons on accent, primary and status fills (8.37:1 on dark accent) |
| Label on media | `--color-on-media` | `#ffffff` | `#ffffff` | Constant white over video, photos, user-picked avatar colours |
| Text link | `--color-text-link` | `#2b70c9` | `#8fb8f4` | |

> `text-white` / `bg-white` use the **theme-flipping** `--color-white` (`#fff` light, `#111c31` dark). Do not use `text-white` for a label on a coloured fill: use `text-on-accent`, or `text-on-media` when it must stay white.

### Surfaces

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--color-background` | `#fff` | `#18253f` |
| Soft panel / inset well | `--color-surface` | `#f8f9ff` | `#111c31` |
| Card that sits inside a raised column | `--color-surface-card` | `#fff` | `#111c31` |
| Raised (kanban column, cards) | `--color-surface-raised` | `#ecedf6` | `#1f2e4d` |
| Sidebar | `--color-surface-sidebar` (+ `border-r border-border`) | `#f8f9ff` | `#16223a` |
| Sidebar hover / selected | `--color-surface-sidebar-hover`, `-active` | `#e2e4f0` | `#24345a` |
| Note card | `--color-note-card` | `#ecedf6` | `#1f2e4d` |
| Scrim | `--color-scrim` (`bg-scrim/50`) | `#000` | `#000` |

### Text

| Tier | Token | Light | Dark | Min. contrast |
| --- | --- | --- | --- | --- |
| Primary | `--color-text` | `#24242d` | `#e8e8e8` | |
| Secondary | `--color-text-weak` | `#383850` | `#c8d0e0` | |
| Tertiary | `--color-text-weaker` | `#5f5f77` | `#b4bdd0` | 5.31 / 6.49 |
| Quaternary | `--color-text-weakest` | `#6a6a7e` | `#a3aec4` | 4.53 on `surface-raised` / 5.49 on selected |
| UI idle / active | `--color-text-idle`, `--color-text-active` | `#57585e`, `#1e2229` | `#b4bdd0`, `#f0f0f0` | |
| Disabled label | `--color-text-disabled` on `--color-disabled` | `#5f5f77` on `#e4e8f0` | `#a3aec4` on `#24345a` | 5.04 / 5.49 |

`--color-idle`, `--color-active`, `--color-hover`, `--color-weak`, `--color-weaker`, `--color-weakest` are aliases of the text tiers (they reference them, so they cannot drift).

Figma keeps light `text-weakest` at `#a4a4b2` (2.46:1); the code uses the closest passing value of the same hue, `#6a6a7e`.

### Borders and icons

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Hairline / card border | `--color-border` | `#d9dbeb` | `#2f3f63` |
| Strong (decorative, dashed drop zones) | `--color-border-strong` | `#c8c8d4` | `#3e5079` |
| **Input boundary** (inputs, selects, text areas, checkboxes) | `--color-border-input` | `#8f8fa7` (3.16:1) | `#5e76ad` (3.4:1) |
| Hover | `--color-border-hover` | `#5f5f77` | `#b4bdd0` |
| Icons | `--color-icon`, `--color-icon-hover` | `#5f5f77`, `#24242d` | `#b4bdd0`, `#e8e8e8` |

### Status

Each has base + `-hover` / `-active` + `-weak` / `-weaker` tints. `danger` aliases `error`.

| Status | Light | Dark | Dark tint (`-weak`) |
| --- | --- | --- | --- |
| Success | `#0f7b16` | `#8fdba4` | `#1d3b3a` |
| Warning | `#8a6a17` (5.05:1) | `#f2d488` | `#3b3a2e` |
| Error | `#c8322a` (5.32:1) | `#f4a093` | `#3f2c3a` |
| Neutral | `#383850` | `#c8d0e0` | `#2f3f63` |

Never signal status by colour alone (add an icon or a label).

### Organization view

`:root[data-view='organization']` (set by `NavigationProvider`) remaps **only** `accent`, `primary` and `text-link` to emerald. Light uses the deep `#0f6b4c` (6.51:1 with a white label) so it never reads as a success message; dark keeps `#2fc48f` (no Figma value yet, see the backlog). Surfaces are unchanged, and non-interactive org labels (the "Organization" eyebrow, the org name in the sidebar) use neutral text tokens.

### User-chosen accents

Profile appearance lets a user pick an avatar colour (`#2B70C9`, `#1D9E75`, …). These are literal hex in both themes: put `text-on-media` on them. The default avatar colour follows `var(--color-accent)` and therefore uses `text-on-accent`.

---

## 3. Typography

### Font families

| Role | Token | Usage |
| --- | --- | --- |
| Display | `--font-display`: **Saira** | Headings (`text-h1` … `text-h6`), **every button size** (`text-button-*`), the logo |
| Body / UI | `--font-body`: **Inter** | Everything else. `body` defaults to Inter, so text without a `text-*` utility no longer falls back to `ui-sans-serif` |

Both families load **once**, from `index.html` (variable fonts, weights 100–900). Do not `@import` them again in CSS.

### Scale

| Utility | Font | Size | Default weight |
| --- | --- | --- | --- |
| `text-h1` … `text-h4` | Saira | 40 / 32 / 28 / 24 px | 700 |
| `text-h5` | Saira | 20 px | 500 |
| `text-h6` | Saira | 18 px | 400 |
| `text-body-xl-strong` | Inter | 18 px | 700 |
| `text-body-l`, `text-body-l-strong` | Inter | 16 px | 400 / 700 |
| `text-body-m`, `text-label-m` | Inter | 14 px | 400 |
| `text-body-s`, `text-body-s-strong`, `text-label-s` | Inter | 12 px | 400 / 700 |
| `text-button-l` / `text-button-m` / `text-button-s` | Saira | 16 / 14 / 12 px | 400 |

- The default weight can be changed with `font-medium`, `font-semibold`, `font-bold` next to the utility (the utilities read `--tw-font-weight`). Prefer the `-strong` variants; Figma asks for few variants (Saira Bold + Regular, Inter Regular + Bold).
- `cn()` (`src/utils/cn.ts`) knows every utility above as a font size, so `cn('text-h3', 'text-text')` keeps both.
- Only these class names exist: there is no `text-body-sm` / `text-body-md`.
- Long subtitles break into two short lines rather than one long one.

---

## 4. Component styling

### Radius

| Token / class | Value | Use |
| --- | --- | --- |
| `rounded-button` (`--radius-button`) | 8 px | **Every button**, segmented controls, nav items, dropdown menus |
| `rounded-card` (`--radius-card`) | 12 px | Cards, panels, kanban columns |
| `rounded-full` | — | Badges, dots, avatars only |

No pill buttons, no one-off `rounded-[Npx]` in shared components.

### Buttons (`atoms/button`)

- Sizes `xs` 24 px, `sm` 32 px, `md` 40 px, `lg` 48 px, all Saira (`text-button-*`), all `rounded-button`.
- **Contained**: fill from the colour token, label `text-on-accent` (white in light, navy in dark on pastel fills).
- **Outlined / text**: border and label in the colour token, tinted `-weaker` hover.
- **Disabled**: `bg-disabled` + `text-text-disabled` (≥ 5:1), no opacity fade. These classes are scoped `disabled:` / `aria-disabled:`, so colours passed through `className` cannot override them. Icons inside a button use `color="inherit"` so they follow the label. **Loading** keeps the colour, dimmed, with a spinner.
- **Focus**: the shared `focus-ring` utility, same for all variants.
- Use the `Button` atom for every action, including links styled as buttons (`<Button asChild><Link …/></Button>`), instead of hand-rolled class strings.

### Focus

Every interactive atom shows a visible keyboard focus: Button, IconAction, LinkButton, NavLink, NavSelector, SwitchButton, the account menu. Buttons, links and nav items use the **`focus-ring`** utility (`tailwind.css`): keyboard-only (`:focus-visible`) 2 px `accent` ring with a 2 px offset; inside tight segmented controls add `focus-visible:ring-offset-1`. Text fields keep their own `focus:` ring so it also shows on click. Ring contrast: 4.93:1 light, 8.37:1 dark.

`NavLink` is a single `<a>` styled through `Button asChild`: never nest a `<button>` inside a link.

### Icon-only controls

- Every icon-only button has an accessible name (`ariaLabel` on `IconAction`, `aria-label` on `Button`) and a hit area of at least 24×24 px (`IconAction` enforces `min-h-6 min-w-6`; WCAG 2.5.8).
- The logo mark (`LogoSvg`) is decorative next to the "TALKUP" wordmark and named "TalkUp" when it stands alone (`label` prop).
- Looping decoration uses `motion-safe:` so it stops under `prefers-reduced-motion`; carousels do not auto-advance then.

### Inputs and forms

- Boundary `border-border-input`, focus ring `ring-accent`, disabled `bg-disabled text-text-disabled`, placeholder `text-text-weakest`.
- Labels stay visible above fields (`label` prop of `InputMolecule` / `PasswordField`: `text-label-m text-text-weak`, 8 px above the field); placeholders hold **examples** (`you@example.com`, `e.g. camille_dev`), never the label. An optional field says so in its label ("Organization code (optional)"); a rule goes in a hint under the field (`hint` prop of `PasswordField`: `text-label-s text-text-weaker`, linked with `aria-describedby`), never in the placeholder, which gets cut off and disappears on typing. Reference: login and register (Figma A1/A2).
- Errors use `text-error` (`#c8322a` light, `#f4a093` dark): field errors via `FieldErrors`, the form-level server error as `text-label-m text-error` with `role="alert"`. No `text-red-*`: it ignores the theme and drops to 3.2:1 on the dark page.
- Rhythm: 16 px between fields, 32 px before the primary button (`gap-4` + `mt-4` on the button).
- A borderless input inside a decorated wrapper (icon + input, e.g. the CV job link): the wrapper carries `border-border-input` and the focus ring, the input carries the vertical padding so the label stays 8 px above it.
- Always label controls (`htmlFor` / `id`).

### Cards and panels

- Light: white or `surface` with a `border` hairline, `rounded-card`.
- Dark: cards inside a raised column are inset wells (`bg-surface-card` → `#111c31`) with a `border` hairline.

### Navigation and shell

- Sidebar: `bg-surface-sidebar border-r border-border`; selected item `bg-surface-sidebar-active`; hover is subtle.
- The selected nav icon switching to its filled variant, and "Ask Tali" at the top of the nav, are Figma decisions not implemented yet (backlog).

### Atomic design

Shared UI lives under `src/components/` in **atoms → molecules → organisms**. Prefer extending existing pieces before adding parallel patterns.

---

## 5. Layout and spacing

- **Base unit**: 4 px / 8 px grid (Tailwind spacing scale).
- **Forms**: 16 px between fields, 32 px before the primary CTA.
- **Dense lists / tables**: 40 px rows.
- More air above page titles than between sections.
- **Max width**: centred content where it matches existing routes; dashboards are full-width with an internal max-width for readability.

---

## 6. Depth and elevation

- **Light**: flat surfaces with borders; a light shadow only on menus, modals and dropdowns.
- **Dark**: elevation by lightness steps (section 1); shadows do not read on navy.
- **No offset shadows.** The landing glow / halo treatment (Figma L1/L2) is a proposal, see the backlog.

---

## 7. Do's and don'ts

### Do

- Use `tailwind.css` tokens for colours, fonts, radii and states, in both themes.
- Measure contrast for any new text/background pair (≥ 4.5:1 text, ≥ 3:1 input boundaries and focus rings).
- Use `text-on-accent` on coloured fills and `text-on-media` over media.
- Check light, dark **and** organization view for persistent UI.

### Don't

- Don't hardcode hex where a token exists, or use the raw Tailwind palette (`gray-400`, …).
- Don't use `text-white` as "white on a fill" (it flips in dark).
- Don't fade disabled controls with `opacity-50`: use the disabled tokens.
- Don't use green for anything but success, or accent for non-interactive labels.
- Don't add fonts other than Saira and Inter, or load them from CSS.
- Don't use pill buttons or one-off radii.

---

## 8. Responsive behavior

Follow patterns already used in the app (TanStack Router layouts, existing breakpoints). Touch targets ≥ 44 px where possible. The mobile bottom nav and status tabs (Figma M1/M2) are not implemented yet (backlog).

---

## 9. Agent prompt guide

### Quick token reference

- Page `bg-background`; soft section `bg-surface`; column `bg-surface-raised`; card in a column `bg-surface-card`.
- Text `text-text`, secondary `text-text-weaker`, quiet `text-text-weakest`.
- Action `bg-accent text-on-accent`; link `text-text-link`; accent text on a tint `text-accent-hover`.
- Border `border-border`; input `border-border-input`.
- Headings `text-h*` (Saira); body `text-body-*` (Inter); buttons `text-button-*` (Saira).
- Radius `rounded-button` / `rounded-card`.

### Example prompts

- _"Settings card: `bg-surface border border-border rounded-card`. Title `text-h5 text-text`, body `text-body-m text-text-weaker`. Primary `Button` (contained, accent)."_
- _"Form row: label `text-label-m text-text-idle`, use `BaseInput` (`border-border-input`, `focus:ring-2 ring-accent`), 16 px between rows, 32 px before the submit button."_
- _"Kanban column: `bg-surface-raised rounded-card p-3`; cards `bg-surface-card border border-border rounded-card`; status dot `bg-success` (pastel in dark)."_

### Iteration checklist

1. Read `tailwind.css` for current values; check `docs/design/figma-backlog.md` if the screen has a Figma decision pending.
2. Semantic tokens only.
3. Verify light, dark and org view; measure contrast.
4. Keyboard-tab through new controls: focus ring visible.
5. Reuse atoms/molecules/organisms.

---

## 10. Relation to external inspiration

Earlier drafts referenced ElevenLabs-style marketing aesthetics (warm stone, Waldenburg, extreme pill buttons, layered shadows). **That is not the TalkUp baseline.** Borrow ideas (clarity, whitespace, hierarchy) only as long as colours, fonts and tokens stay consistent with this file and `src/styles/tailwind.css`.
