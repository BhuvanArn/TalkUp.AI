# Figma backlog

Decisions validated in the Figma file **TalkUp — App & Design System**
(`N0oUi7zzoaQHvkMVYh2wLM`) that the code does **not** implement yet.

**Rule.** For an item listed here, the Figma is the reference. For everything
else, the code (`web/src/styles/tailwind.css` + `web/DESIGN.md`) is the source
of truth. A PR that implements an item removes it from this file in the same
PR.

Status comes from the 2026-11-06 UI/UX seminar deck: **Fait** (done in the
mockup), **Proposition** (proposal to validate), **Maquette** (mockup only, the
feature does not exist in code, to validate). Figma links use
`https://www.figma.com/design/N0oUi7zzoaQHvkMVYh2wLM/?node-id=<id>` with `:`
written as `-`.

Created by #208 (foundations). Items that #208 implemented are not listed.

## Screens marked "Fait" but only partly in code

| Item | What is still missing | Figma node |
|---|---|---|
| G1 Navigation | "Ask Tali" entry at the top of the nav (avatar + label, bordered); "Link Integrations" moves to Settings; the selected nav icon switches from outline to filled, in accent. #208 did the light sidebar surface and its hairline border. | 164:6, after 164:227 |
| G3 Organisation | Org dark palette has no Figma value: the code keeps `#2fc48f` (7.63:1 with `on-accent`). Needs a designer decision so dark org green does not read as the dark success mint `#8fdba4`. | 168:736, after 168:931 |
| G4 Dark theme | Status dots in the sidebar application list still use hard-coded hex (`STATUS_COLORS` in `organisms/sidebar/ContextNavigation.tsx`), so they stay saturated in dark. They should use `accent` / `warning` / `success` / `error` (NavSelector builds `${color}CC`, so it needs `color-mix` first). | 168:1147, after 168:1459 |
| A1 Login | Visible labels above fields ("Email", "Password") with example placeholders (`you@example.com`); 16 px between fields; 32 px before the primary button; testimonial in a translucent bordered card (white 10-15 %, 12 px radius) with centred stars and a chat-bubbles illustration. Code still uses placeholder-as-label. | 172:112, after 172:169 |
| A2 Register | Same as A1; optional field marked in its label ("Organization code (optional)"); password rule in the placeholder. | 172:274, after 172:343 |
| C1 Compatibility Analysis | 64 px above the title, 40 px under the header. #208 did the readable disabled CTA and the blue upload icon. | 172:456, after 172:653 |
| R1 Roadmap | Score in its own card top right (`success-weaker`, "Strong match", "How is it calculated?" popover); linear path of white cards on a grey track instead of the zig-zag timeline; 8 % starter stub on the ring at 0 %; two-line subtitle. #208 did the 8 px / 40 px buttons. | 185:137, after 185:460, ring 206:200 / 206:207 |

## Maquette (features not in code)

| Item | Summary | Figma node |
|---|---|---|
| G2 / B / G7 Assistant panel | Tali in a right-hand column that **pushes** the page; nav collapses to an icon rail while it is open; page framed in a bordered 12 px "window". Replies are action receipts (done / pending with Confirm + Undo); changed objects get an accent border in the page. Floating FAB, gradient header and `bg-brand-gradient` go away. | 168:6, after 168:345; brainstorm 235:272; G7 215:296 |
| G6 Assistant avatar and welcome | "Avatar Bot" squircle smiley with states (Repos, Sourire, Clin d'œil, Parle), light + dark; welcome screen "Hi, I'm Tali" + capabilities line + 3 suggestion chips. Tali coaches, Sophie recruits. | 201:353, after 201:692; component 230:429 |
| C3 CV analysis in 3 steps | Stepper card = the 3 inputs (offer, CV, interview date); link or PDF for the offer; "Use my current CV"; consent next to the CTA; link error returns to step 1 and keeps the rest. Needs back-end (offer PDF, current CV). | 248:308, after 248:715 / 248:885 / 248:1056 / 248:1227 / 248:1398 |
| Ap1 Application detail | "← All applications" back link; editable application name (popover, original title kept visible). Needs a custom-name field. | 179:137, after 179:460 |
| Ap2 Application menu with search | Above 3 applications, the sidebar list becomes a counter + searchable selector; lighter hover `#f0f4fa`. | 179:822, after 179:1145 |
| Ap3 Search and filters | Search at the top of the board with a live match count; Status / Company / Interview date filters; collapsible Rejected column. | 179:1511, after 179:1823 |
| Ap4 Table view | Board / Table toggle; sortable table, 40 px rows, pastel status pills, zebra rows. | 179:2232, after 179:2544 |
| R2 Talking points under the roadmap | Talking points stacked under the path; title + "See more"; "Got it" and "Hide" per point with a hidden count (persisted). | 185:918, after 185:1379 |
| M1 Mobile navigation and list | Bottom tab bar (Applications, CV, Agenda, Notes, Tali), 56 px targets; top bar with logo, search, avatar; status tabs instead of kanban columns. | 188:137, after 188:142 |
| M2 Mobile simulations | Simulations are desktop-only on mobile: illustrated explainer + "Email me the link" + "Review my talking points". | 188:239, after 188:244 |
| L3 Teasing landing | Separate "Is this offer made for you?" page: URL input, visible score with its explanation, key info blurred, one sign-up CTA. Open questions: CV without an account, AI cost per visitor. | 170:2406, after 170:2965 |

## Proposition (to validate)

| Item | Summary | Figma node |
|---|---|---|
| G5 Empty-state illustration | v3 illustration (volume, colour) for real empty states; functional affordances keep icons. | 168:1802, after 168:1951 |
| L1 Illustrated landing | Soft blue halo (layer blur) instead of the 18 px offset shadow on the hero mockup; Tali speech card under the mockup; v3 illustrations replace the 1-4 numerals. | 170:16, after 170:575 |
| L2 Dark landing | Tight text glow on large headings (not on buttons); light glow under the microphone illustration; sections alternate `#111c31` / band `#0c1526` (no token yet). | 170:1211, after 170:1770 |
| Illustration kit | v3 illustrations and avatars, light and dark. | "Kit d'illustrations et avatars — à valider" |

## Foundation debt left from the Audit page (7:235)

Not seminar decisions, but listed so they are not lost. The code wins until
someone picks them up.

- One-off radii in page-level components: `rounded-[10px]` (agenda, progression,
  notes, note-card, editor-toolbar, next-event-card, unsaved-changes-cta,
  AppearanceSettings), `rounded-[20px]` (agenda, progression, ChatWindow),
  `rounded-[5px]`/`[6px]` (calendar-list), `rounded-[15px]` (notes-editor).
  Map them to `rounded-button` / `rounded-card`.
- Toaster is hard-coded white with `#24242d` text in every theme
  (`atoms/toaster`).
- `LinkButton` label always renders `text-idle` (inner span) and uses `dark:`
  classes; `link-button` variant `hover` still uses `text-white`.
- `Icon` `color="white"` maps to the theme-flipping `text-white`.
- Two confirm dialogs (`ConfirmModal`, `ConfirmationModal`) and ~6 hand-rolled
  modal shells; `molecules/menu` is dead code.
- The delete-application confirmation (`ConfirmModal`) has no
  `role="dialog"` / `aria-modal` (found by the #209 smoke).
- Below ~1024 px the 256 px sidebar stays open and crushes the content (see
  M1 above).
- Input radius (`rounded-sm`, 4 px) vs Figma 6-8 px.
- Light `accent` `#2b70c9` used as small text on accent-tinted or
  `surface-raised` backgrounds drops to 4.1-4.4:1; #208 fixed the three
  occurrences it found (badge, interview pill, "Read more") with
  `text-accent-hover`. Prefer `text-accent-hover` for accent text on tints.
- Raw Tailwind palette in organisms (websocket-debug-panel, verbal-analysis-panel,
  editor-toolbar, notes-editor, stats-card, simulation-queue-banner,
  simulation-history-table, info-box, simulation-video-area `bg-gray-800/50`).
- `bg-brand-gradient` (chatbot only) and the spinning squares in
  `ConvincingBanner`.
