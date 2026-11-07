# Code pitfalls in `web/`

**Read this when:** implementing a piste (phase 4) and when an audit finding surprises you.
**What it is:** traps in the current code that silently break a design, from the Figma "Audit" page (node 7:235, written 2026-11-05) **re-checked against the code after #208 on 2026-11-08**. Re-check an item before relying on it: the code moves. When you fix one, delete it here.

## Still true

| Pitfall | Effect | Do |
|---|---|---|
| `--color-white` is redefined in `.dark` (to the darkest surface) | `text-white` / `bg-white` invert in dark: white labels on fills turn dark | `text-on-accent` on fills, `text-on-media` over media, `bg-background` / `bg-surface-*` for surfaces |
| `atoms/checkbox-input` styles a native checkbox, but `@tailwindcss/forms` is not installed | Border / radius / colour classes have no effect; the browser draws its default box | Use `accent-color` (`accent-accent`) or build the box with `appearance-none`; check it in both themes |
| `atoms/toaster` hardcodes `#fff` / `#24242d` / `#29457a` | Toasts stay light in dark mode | New toasts: tokens; flag it if your task shows a toast |
| `organisms/sidebar/ContextNavigation.tsx` `STATUS_COLORS` hardcodes hex | Status dots stay saturated in dark (backlog G4) | Use `accent` / `warning` / `success` / `error` tokens when you touch it |
| Two confirm dialogs: `molecules/confirm-modal` and `atoms/confirmation-modal` | Parallel patterns drift | Use `molecules/confirm-modal` for new confirmations |
| Modal shells re-implemented with `fixed inset-0` in ~8 places (event-modal, cv-import overlay, invite-create-modal, member-detail, roadmap-sources-modal, notes-editor…) | Inconsistent overlays, focus handling, scrim | Reuse an existing modal molecule; question whether a modal is needed at all (side panel, inline) |
| Icons mix `react-icons/fa` (filled FontAwesome) and `react-icons/pi` (Phosphor outline) in `atoms/icon/icon-map.ts` | Mixed stroke styles on one screen | Outline (Phosphor) by default; filled only for the selected state (seminar G1) |
| Form atoms (`BaseInput`, `TextArea`, `SelectorInput`, `CheckboxInput`) set `aria-label={name}` after spreading props (issue #206) | Overrides visible labels and callers' `aria-label`; screen readers read machine names | Until #206 lands, check the accessible name in the audit (axe `label` rules) |
| `BaseInput` has no error state; errors are a sibling span | No `aria-invalid`, no red boundary | Add the error style + `aria-invalid` + `aria-describedby` when you build a form |
| Login / sign-up use placeholders as labels, 12 px between fields | Seminar A1/A2 not implemented (backlog) | Visible labels, 16 px between fields, 32 px before the button |
| `.bg-brand-gradient` still exists for the old chatbot surfaces | Obsolete per seminar; `tells.mjs` flags new uses | Do not use; the assistant redesign removes it (backlog B/G2) |
| `web/src` files are CRLF | Whole-file rewrites change every line | Edit in place, preserve line endings |

## Fixed by #208 (no longer pitfalls)

- `body` now sets Inter; buttons use Saira at every size.
- `text-*` type utilities use `var(--tw-font-weight, …)`: `font-semibold` next to them now works.
- `cn()` (tailwind-merge) knows `text-h3`, `text-h6`, `*-strong`, `text-button-l` and the radius tokens.
- Focus styles on IconAction, SwitchButton, NavLink, sidebar buttons (`focus-ring` utility).
- Disabled buttons readable (`text-text-disabled`), no opacity fade.
- Navy dark theme, pastel accents, input boundary token `border-input` (≥ 3:1).
