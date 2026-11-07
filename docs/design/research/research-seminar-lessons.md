# TalkUp UI/UX seminar: before/after lessons

Source: `/home/barnaud/Downloads/TalkUp-avant-apres.pdf`, 50 pages, 960x550 pt. Every page is a single raster JPEG and there is no text layer (`pdftotext` returns nothing), so I read all text below from the images. The deck has 22 numbered screens, each with an Avant (before) and an Après (after) page, plus a cover/summary page and a final "À développer" page. Pages 18-19 (L1) and 20-21 (L2) are full landing scrolls 1920x4853 px.

**Status badges on the slides** (top right of each "Changements" panel):
- **Fait**: the change is done in the mockup, and in code as well where the deck says so.
- **Proposition à valider**: a proposal still awaiting approval.
- **Maquette · pas dans le code · à valider**: mockup only, not in code, awaiting approval.

| Code | Title | Status |
|---|---|---|
| G1 | Navigation | Fait |
| G2 | Assistant qui agit (assistant that acts) | Maquette, à valider |
| G3 | Organisation et bouton désactivé (organization and disabled button) | Fait |
| G4 | Thème sombre bleuté et pastels (bluish dark theme and pastels) | Fait |
| G5 | Illustration d'un état vide (empty-state illustration) | Proposition |
| G6 | Assistant : avatar et accueil (avatar and welcome) | Proposition |
| B | Assistant à droite, page poussée (right-side assistant that pushes the page) | Maquette |
| L1 | Landing illustrée (illustrated landing) | Proposition |
| L2 | Landing en sombre bleuté (bluish dark landing) | Proposition |
| L3 | Landing de teasing | Maquette |
| A1 | Connexion (login) | Fait |
| A2 | Inscription (sign-up) | Fait |
| C1 | Compatibility Analysis | Fait |
| C3 | CV analysis en 3 étapes (in 3 steps) | Maquette |
| Ap1 | Détail d'une application (application detail) | Maquette |
| Ap2 | Menu avec recherche (menu with search) | Maquette |
| Ap3 | Recherche et filtres (search and filters) | Maquette |
| Ap4 | Vue tableau (table view) | Maquette |
| R1 | Roadmap | Fait |
| R2 | Talking points sous la roadmap (under the roadmap) | Maquette |
| M1 | Mobile : navigation et liste (navigation and list) | Maquette |
| M2 | Mobile : simulations | Maquette |

Each "after" page marks its changes with numbered magenta circles (about `#d4006c`, white numeral). These belong to the deck's own chrome and are not part of the product palette.

---

## Per-screen analysis

### G1 Navigation (Fait)
**Before**
- The sidebar was filled with mid lavender-grey `#ecedf6` and had no separating border. It looked heavy, like a second page.
- The top of the sidebar held a "Link Integrations" row with G and in logos. This is a settings concern that took up the most valuable nav slot.
- The assistant was reached two ways: a nav item called "Assistant" with an outline chat icon, and a floating green/teal round FAB in the bottom-right corner, with a gradient from about `#207090` to `#187060`. The FAB overlapped the content.
- The active nav item ("Notes") had a light fill, but its icon was outline like every other icon, so the active page was weakly signalled.
- The assistant had no name ("TalkUp AI").

**After**
1. **Ask Tali** is a white, bordered, button-like entry at the very top of the nav, with the blue smiley avatar on its left. It replaces Link Integrations, which moves to Settings. The floating bubble is removed.
2. The selected item's icon switches from outline to **filled** (and turns accent blue). The `#e2e4f0` pill fill stays.
3. The sidebar is lighter: `#f8f9fe` (≈ `--color-surface`) with a **1px right border** instead of a grey fill.
4. The assistant gets a first name, **Tali** (name not final).

**Principles**
- The AI assistant is a first-class nav destination at the top of the sidebar, not a floating support bubble.
- Mark the active state with a change of icon form (outline → filled) in addition to a background tint.
- Separate chrome from content with a hairline, not a block of tint.
- Integrations belong in Settings, not in primary nav.
- Give the AI a persona and a name.

### G2 Assistant qui agit (Maquette)
**Before**
- A floating chat popover (about 235x300 px) sat on top of the kanban's Accepted and Rejected columns.
- Its header was a saturated blue→green gradient with "TalkUp AI · Online, ready to help". Below that came a bubble chat with a timestamp, an "Ask a question..." input and "Powered by TalkUp AI".
- It was purely conversational: it hid the page and could not do anything.

**After**
1. Ask Tali in the nav, and no floating bubble.
2. A **right-side collapsible column** (header "Tali" plus a `>` collapse chevron) sits flush against the page. It has a white background and a left border. The page stays visible.
3. **The assistant acts on the site.** The user writes "Rename my Qonto application and add the interview to my agenda". Tali answers "Done. Here is what I changed:" followed by two **action result cards**:
   - "✓ Application renamed": a green check, `Qonto → "Qonto · Backend Go"`.
   - "→ Add to Agenda?": "added after you confirm", with a primary **Confirm** button and a secondary **Undo** button.

   On the board, the renamed card gets an **accent-blue border highlight**, so the change is visible in place. The input placeholder is "Ask, or tell me what to do…".

**Principles**
- The assistant is an agent. Its replies are structured action receipts (done, or pending confirmation), not just prose.
- Reversible actions are applied and shown with Undo. Actions with side effects (agenda) ask for explicit confirmation first.
- When the AI changes something, highlight the changed object in the page itself.
- The chat must never cover the work it is talking about.

### G3 Organisation et bouton désactivé (Fait)
**Before**
- The "Organization" eyebrow above "TalkUp Demo School" was green, so it read as a link.
- The "Upload logo" button used a light mint green that looked like a success toast.
- The disabled "Save changes" button was grey text on grey with a contrast of 1.7:1, which made it illegible.
- The org name in the sidebar had a green-tinted pill, which drew too much attention.

**After**
1. The eyebrow is grey (text-weaker), because a non-interactive label should not look like a link.
2. The org green is darker (deeper emerald outline and text on the upload button) so it no longer looks like a success message.
3. The disabled button is readable: contrast goes from 1.7:1 to **5.0:1** (light grey fill, dark-enough grey label).
4. The org name in the nav is neutral grey, with no green.

**Principles**
- Colour carries meaning: brand green must never be mistaken for semantic success green.
- Disabled is not invisible. Disabled labels still have to reach about 4.5:1 so users can read what they cannot do yet.
- Only interactive elements get the accent colour.
- Context labels (workspace or org name) should be quiet.

### G4 Thème sombre bleuté et pastels (Fait)
**Before** (neutral black theme, colours sampled)
- page `#1a1a1a`, sidebar `#232429`, columns `#2a2a2a`, cards `#2b2b2d`
- saturated button `#5790e9` with white text
- vivid status dots: blue `#406088`→`#6080c0`, amber `#c8b050`, green `#309838`, red `#c04848`
- some secondary text at 2.55:1

**After** (navy theme, colours sampled)
1. The background is very dark blue instead of black:
   - sidebar `#16223a`
   - page `#17253f`
   - kanban columns `#1f2e4d`
   - cards `#111c30` (cards are *darker* than the column, like inset wells)
   - active nav pill `#25345b`
   - landing hero `#111c30`, with a darker band `#0c1526`

   The deck's reason: navy "goes better with the blue buttons".
2. Buttons are softened: a **pastel fill `#90b8f0`** with **dark navy text**, contrast 8.4:1. Primary buttons are light-on-dark-text, not white-on-blue.
3. Statuses are pastel (soft periwinkle, butter, mint around `#8ad8a2`, and salmon), because "vivid colours were too harsh on this background".
4. Secondary text is lighter: the minimum contrast goes from 2.55:1 to **over 6:1**.

**Principles**
- Dark mode is a tinted brand navy, never neutral black.
- In dark mode, invert the button logic: a pastel fill with dark text beats saturated fill with white text.
- Semantic colours go pastel in dark mode, desaturated with higher lightness.
- Every text tier must stay at or above about 4.5:1. Measure it; do not eyeball it.

### G5 Illustration d'un état vide (Proposition)
**Before**: A grey circle with a grey outline note icon above "No notes of this kind", a description, and "+ Show all notes".
**After**: A colourful **3D-ish illustration**: a yellow notepad with lines and a purple pencil, plus small confetti dots in pink and green. The copy and the CTA are unchanged.
**Principle**: An empty state fills a real void, so give it a playful illustration together with a one-line explanation and one clear action. Use a grey icon only for small or inline empties.

### G6 Assistant : avatar et accueil (Proposition)
**Before**: The generic "T" initial avatar in a green gradient header, with the greeting "Hello! I'm TalkUp AI. Ask me anything…".
**After**
1. The **bot avatar is a smiley**: a rounded-square tile (radius about 22%) in accent blue `#2870c8`, with two white closed-eye arcs and a smile. It is meant to have **states** that adapt to context.
2. A **welcome screen** in the empty panel shows:
   - a large avatar (about 60 px)
   - "Hi, I'm Tali"
   - one line of capabilities: "Your AI coach. I can prepare your interviews and act in TalkUp for you."
   - **3 suggestion chips**, full width, bordered, left-aligned: "Rename an application", "Add my interview to the agenda", "What should I prepare for Qonto?"
3. **Tali coaches, Sophie recruits.** The two AIs have distinct roles so users do not confuse them.

**Principles**
- An AI's empty state teaches what it can do, using concrete, context-aware suggested prompts.
- Distinct AI roles get distinct names and personas: the coach is Tali, the interviewer is Sophie.
- An expressive avatar with states gives the agent a recognizable face.

### B Assistant à droite, page poussée (Maquette, supersedes the G2 panel position)
**Before**: The floating popover hid the four kanban columns.
**After**
1. The right panel **pushes the page**, so all 4 columns stay visible (they get narrower).
2. When the panel opens, the nav **collapses to an icon rail** of about 48 px holding the logo, an expand toggle, the Tali icon (active, blue tile), Applications, CV, Agenda and Notes, and the user avatar. The nav can be expanded again. This keeps the page wide and labels within click reach.
3. The **page sits in a bordered, rounded "window"** (light border, about 12 px radius) next to the assistant column, so the tool and the assistant are clearly separate.

The panel itself:
- header "New chat with Tali", with expand and `>>` collapse icons
- centered avatar, then "How can I help?"
- a composer card with "Ask, or tell me what to do…", a paperclip attach button and a square blue send ↑ button
- the subtitle "Tali can prepare your interviews and act in TalkUp for you."
- a contextual **suggestion card pinned at the bottom**: "Prepare my Qonto interview · Interview on 12 Nov 2026 ↗"

**Principles**
- Side panels push content, they do not overlay it.
- Auto-collapse secondary chrome to make room.
- Frame the workspace as a card to separate "the tool" from "the agent".
- Proactive, context-derived suggestions should be anchored in the panel.

### L1 Landing illustrée (Proposition)
**Before**
- The hero product mockup (prep path card plus a 72 % ring) had an **offset shadow**, which added nothing visually.
- The "From job offer to interview" section used big blue **numerals 1-4**.

**After**
1. A **soft blue halo** (glow) around the mockup replaces the offset shadow.
2. A small **"Tali, your AI coach"** card hangs under the mockup. It has the smiley avatar and the copy "Your CV only mentions MongoDB. Let's prepare a PostgreSQL example." The avatar comments on the product and shows what it does. The deck's reason: the floating illustrations were distracting.
3. **Illustrations replace the numerals** for the 4 steps:
   - Analyze: a document with a check
   - Prepare: a green hill with a flag
   - Rehearse: a microphone character
   - Adjust: a bar chart

   They are "more telling and more playful".

**Principles**
- Use a brand-tinted glow (light) rather than a hard offset shadow.
- Mascot speech-cards that comment on a product screenshot say more than floating decoration.
- Swap ordinal numerals for meaningful spot illustrations.

### L2 Landing en sombre bleuté (Proposition)
**Before**: The dark landing was neutral black (`#111`/`#1a1a1a` sections), had vivid status chips, and its secondary text was too dim.
**After**
1. A **light glow on big headings**: a text-shadow of the same white, low radius. The deck's reason: the old large halos were too strong, and the glow should follow the letters.
2. A **light glow under the microphone** illustration so it stands out on the dark background.
3. The illustrations are more playful, coloured and volumetric, and visible in dark mode.
4. The Tali card sits under the mockup. It used to touch the buttons above, so it now has spacing.
5. Secondary text is lighter, matching G4.

Section backgrounds alternate between navy `#111c30` and a darker `#0c1526` band. The pricing "Candidates" card has a navy-tinted fill with an accent border.

**Principles**
- Glow is the dark-mode replacement for shadow, kept subtle and tight.
- Alternate section bands by darkness, not by hue.
- Spot illustrations must be designed to survive both themes.

### L3 Landing de teasing (Maquette)
**Before**: The hero carried the full product demo card (prep path, HIGH/MED/LOW chips, Start simulation, My notes, Sources), which was too much for a hero.
**After**: A separate **teasing page** titled "Is this offer made for you?":
1. The demo moves to its own page, framed as a marketing operation. It has a card with the Tali avatar, "Try it: is this offer for you?", a URL input, and a big **74 % Match score** on a green tint.
2. The **score is explained** right under it: "AI estimate of how well the CV fits this offer, from 0 to 100… It is not a chance of being hired."
3. **Key info is blurred** (Your strengths, Gaps to close, Talking points), with **a single CTA**: "Create a free account to see everything". Still to decide: allowing a CV without an account, and the AI cost.

**Principles**
- Give a taste of the real output, blur the rest, and keep one CTA (a progressive-disclosure paywall).
- Every AI score ships with a plain-language "what this number is and is not".
- A hero is not a product tour.

### A1 Connexion (Fait)
**Before**
- The fields had **placeholder-as-label** ("What email did you use?").
- The gap between fields was large and the gap before the button was tight.
- The right panel was a saturated blue (about `#3d7fd6`) with faint diamond shapes and an italic quote floating directly on the blue.

**After**
1. **Visible labels** above the fields ("Email", "Password"), with *example* placeholders such as `you@example.com` and "Your password".
2. **16 px** between fields.
3. **32 px** before the primary button, so the main button has room.
4. The quote sits in a **quieter translucent card**:
   - white at about 10-15 % alpha, with a 1px light border and about 12 px radius
   - centred pale-yellow ★★★★★
   - an avatar initial and name row
   - a **chat-bubbles illustration** above the title, made of a pale blue bubble with "…" and a peach bubble

   The carousel dots are kept.

**Principles**
- Labels always stay visible and placeholders hold examples.
- Use a consistent rhythm of 16 px between fields and 32 px before the primary CTA.
- Testimonials go in contained cards, not loose italic text on a brand fill.

### A2 Inscription (Fait)
**Before**: Same issues as login. The field list was Username, Email, Password with a 4-segment strength meter, and "Organization code (optional)" as a placeholder.
**After**
1. Same labels and spacing as login.
   - Examples are `e.g. camille_dev`, `you@example.com`, "8+ characters, with a symbol" (the rule is in the placeholder), and `e.g. TALKUP-2026`.
   - The **optional field is marked in its label**.
2. 32 px before the button.
3. Same carousel card as login.

**Principles**
- Sibling screens must be strictly consistent.
- Mark optional fields in the label, not only in the placeholder.
- State password rules up front.

### C1 Compatibility Analysis (Fait)
**Before**
- The title was cramped against the top.
- The upload icon was a **green** upload glyph that signalled success too early.
- The disabled "Start TalkUp Analysis" button was illegible.

**After**
1. More air above the title.
2. The import icon is kept but turned **blue**, inside a soft grey rounded tile. The deck's reason: an icon reads clearer than an illustration in this spot, and green means success.
3. The disabled button is readable.

**Principle**: Reserve green for completed or success states. Small functional affordances, such as an upload target, use a neutral or accent icon and not an illustration.

### C3 CV analysis en 3 étapes (Maquette; 5 after-states)
**Before**: One page showed a 3-tab stepper inside the CV card (Upload, Analysis, Confirmation) that didn't map to the user's actions. The job-offer card sat beside it, and the consent box and a disabled CTA sat below. Everything was visible at once.
**After**
1. **The steps become the 3 inputs.** A horizontal stepper card reads "① Job offer → ② Your CV → ③ Interview date (optional)". The current step is a blue filled circle with blue label text. Done steps get a green ✓ circle. One decision is shown at a time, and the stepper finally tells you where you are.
2. **Link or PDF for the offer.** There is a URL input with the helper "TalkUp will automatically extract details…", then an "or" divider, then a dashed drop row "Upload the offer as a PDF · Max 5 MB". The PDF is a fallback when an offer page can't be read.
   - When a PDF is chosen, it shows as a **green-tinted file chip**: "qonto-backend-offer.pdf · 0.42 MB • Ready" with a red "Remove" link.
   - The URL input becomes **disabled-tinted**, with the hint "Remove the PDF to use a link instead."
3. **"Use my current CV"**, PDF only.
   - The default is a radio card with a selected accent border and a light fill ("The CV saved on your profile").
   - Below it is "or", then a dashed dropzone "Drag and drop a new CV here · PDF · Max 5 MB".
   - Footnote: "A new CV replaces the one saved on your profile."
4. **The date is optional and consent comes last.** Step 3 has a date input plus the consent checkbox card, and the CTA "Start TalkUp Analysis" (enabled, blue). A Back button (outlined, with ←) sits on the left and Next/Start on the right, aligned under the card.
5. **A link error lands on step 1.**
   - The stepper shows step 1 as current, with steps 2 and 3 already green-checked.
   - The input has a red border, and red text below it: "We couldn't read this page. Check the link, or upload the offer as a PDF."
   - It reassures the user with "Your CV has been saved to your profile."
   - The CTA stays "Start TalkUp Analysis", so you fix the problem in place without re-entering everything.

**Principles**
- Stepper steps equal user decisions, one per screen.
- Always offer a fallback input path (link or file).
- Reuse saved data by default ("use current").
- Optional steps are labelled "(optional)".
- Consent sits next to the commit button.
- Errors route the user back to the step at fault and keep everything already entered.
- Next starts out in a muted state and turns accent when the step is valid.

### Ap1 Détail d'une application (Maquette)
**Before**: There was no way back to the list. The title was the long raw offer title, "Ingénieur Logiciel Backend (Go) at Qonto".
**After**
1. A "← All applications" back link above the title.
2. The **application name is editable**. The title becomes the custom "Qonto · Backend Go" with a pencil icon. Clicking it opens a popover with an "Application name" input, the hint "Original offer: Ingénieur Logiciel Backend (Go) at Qonto", and Save/Cancel. The original title stays visible.

**Principles**
- Every detail page has an explicit way back up.
- Let users rename AI- or scrape-generated entities, and keep the source visible.

### Ap2 Menu avec recherche (Maquette)
**Before**: The sidebar listed every application (Capgemini, OVHcloud, …) with coloured status dots and chevrons. The selected application expanded into Roadmap, Simulations and Analytics. The column scrolled and the hover colour was too strong.
**After**
1. A **selector plus counter** replaces the list: "42 applications", then a dropdown showing the current item "● Qonto · Backend Go ⌄". Below 3 applications, the simple list is enough.
2. **Search by name** inside the dropdown (a search input with an accent focus border). The results show the status dot, a bold name, and a sub-line such as "Interview · 12 Nov".
3. **Lighter hover**, a soft grey row.

**Principles**
- Lists that scale (more than about 3 items) become a searchable combobox.
- Hover states are subtle.
- A counter tells the user the scale.

### Ap3 Recherche et filtres (Maquette)
**Before**: The kanban had no search and no filters, and the cards showed company names only.
**After**
1. A **search field at the top of the list**, with the result count "3 of 42 applications match 'qonto'" in the subtitle.
2. **Filter dropdown buttons**: Status ⌄, Company ⌄, Interview date ⌄.
3. **Custom names** on the cards ("Qonto · Data Eng.", "Qonto · Backend Go") distinguish several offers at the same company.
4. **The Rejected column is collapsible.** It becomes narrow, with "1 hidden: rejected applications stay out of the way. Show", and the other columns gain width.

**Principles**
- Plan for dozens of items: search plus filters plus a live match count.
- Collapse the low-value column so negative outcomes don't take up space.

### Ap4 Vue tableau (Maquette)
**Before**: Kanban only, which fits about 6 cards on screen.
**After**
1. A **Board / Table segmented toggle** next to the search.
2. A **sortable table with 40 px rows** fits about 16 applications on screen. The columns are Name, Role, Status (pastel pill: Interview amber, Sent blue, Rejected pink, Accepted green), Interview, Match %, and Last update. It uses zebra striping and a light header row.

**Principle**: Offer a dense alternative view for scanning (cards for flow, table for volume). 40 px row height is the density target.

### R1 Roadmap (Fait)
**Before**
- A horizontally scrolling node timeline with step cards placed alternately above and below the line.
- The score ring was tucked bottom-left ("74 % Match score"), and the ring arc did not match the value.
- The long subtitle ran on one line.
- Several font variants were mixed.
- The buttons were very rounded pills.

**After**
1. The **score sits in a card at the top right**:
   - green-tinted card (`success-weaker`)
   - ring arc at 74 %
   - "Strong match" in bold
   - "How is it calculated?" link
2. **The score is explained in one click** with a popover: "TalkUp's AI compares your CV with the requirements… estimates a score from 0 to 100. It is an estimate, not a chance of being hired. The topics below show what to work on first."
3. **Grey background, white cards, linear path.**
   - Steps ①②③✓ sit on a straight connector line inside a grey container (`#e4e8f0`-ish).
   - The white step cards ("Step 1 · HIGH", title, description, red "Gap to close") sit in a row.
   - The last step is the green-tinted "Job-ready by 12 Nov 2026".
   - The path reads in one stroke.
4. Fewer font variants.
5. **The ring is faithful to the score.** The arc stops at 74 %, and at 0 % a small **starter stub** avoids showing an empty circle.
6. The subtitle is split into two lines.
7. **Buttons use an 8 px radius** ("were too round and different from the rest of the site").

The action bar (Start simulation [primary], My notes [outline accent], Sources, Regenerate [neutral outline]) moves into a white strip inside the grey container.

**Principles**
- Put the headline metric top right in its own card, and pair it with a "how is this calculated" disclosure.
- Data visualisations must be truthful, and the zero state still needs a visible affordance.
- A linear path beats a zig-zag timeline.
- Use one button radius everywhere (8 px).
- Limit font variants.
- Keep lines short (two-line subtitles).

### R2 Talking points sous la roadmap (Maquette)
**Before**: Talking points lived in a separate tab ("Interview talking points"), with a single big lavender card and an empty lower page.
**After**
1. **Talking points sit under the roadmap** on the same page, under the header "Talking points · 3 to bring to your interview · 1 hidden" with "Show hidden (1) ⌄" on the right. The path keeps its place and the bottom of the page is no longer empty.
2. **Title only, plus "See more"**: three white bordered cards in a row. Expanding one shows the full sentence and a "See less" link.
3. Each card has **"Got it" ✓ and "Hide" (eye-slash) icons**, so everyone keeps only the useful points.
4. Two-line subtitle.
5. 8 px buttons.

**Principles**
- Avoid tabs that hide content when there is room to stack.
- Progressive disclosure (title first, detail on demand).
- Let users triage AI output (acknowledge or hide) and show a hidden count.

### M1 Mobile : navigation et liste (Maquette)
**Before** (390 px)
- The desktop sidebar was rendered at full width and crushed the content into a sliver. The text wrapped one word per line ("Drop a card here, or start a new analysis").
- The FAB overlapped the content.

**After**
1. A **bottom tab bar**: Applications (active, filled accent icon and label), CV, Agenda, Notes, and **Tali** (the smiley icon). Still to be approved.
2. A **top bar** with the logo, a search icon and an avatar initial circle. The search is the same as on desktop.
3. **Status tabs replace columns**: 4 equal segmented tiles, each with a count over its label (2 Sent / **2 Interview** active blue fill / 1 Accepted / 1 Rejected). Below them is a single list of full-width cards, one list at a time, with no truncation.

**Principles**
- On mobile, the sidebar becomes a bottom nav with the assistant as a tab.
- Multi-column kanban becomes tabbed single lists.
- The search entry stays the same across breakpoints.

### M2 Mobile : simulations (Maquette)
**Before**: The simulation screen was crammed: a cut-off call bar, a "Transcription" empty state, and a FAB.
**After**
1. **Simulation is desktop-only** ("you don't do an interview phone in hand"). Still to be approved.
   - A microphone mascot illustration with a face, a pink bow tie, a gold stand and confetti dots.
   - "Simulations run on a computer".
   - The copy: "A real interview happens at a desk, with your camera and microphone set up. Open TalkUp on your computer when you are ready."
2. **Two follow-ups** so the user isn't blocked: a primary full-width "**Email me the link**" and a secondary outlined "**Review my talking points**".

**Principles**
- When a feature doesn't fit a device, say so honestly with an illustration.
- Every dead end offers two ways forward: hand off to the right device, and do something useful here.

---

## 1. Post-seminar TalkUp visual identity

### Palette
**Light (mostly unchanged, refined)**

| Role | Colour |
|---|---|
| Canvas | `#ffffff` |
| App sidebar | `#f8f9fe`/`#f8f9ff` (light, with a 1px border `#d9dbeb`; no longer `#ecedf6`) |
| Active nav pill | `#e2e4f0` |
| Kanban columns / roadmap container / stepper grey | about `#e4e8f0`/`#ecedf6` |
| Cards | white, with a 1px border |
| Accent | `#2b70c9` (Tali avatar sampled at `#2870c8`, primary buttons, current step, links) |
| Brand navy | `#29457a`, for big landing headlines and the problem band |
| Success | Green `#0f7b16` text/✓ on a `#def7e3`/`#ebfbec` tint (match card, Job-ready card, file-ready chip) |
| Priority chips | HIGH pink/red, MED butter, LOW mint, as pastel pills with darker text |

Org view: a darker emerald, applied only to interactive elements. The non-interactive org label and nav item go neutral.

**Dark, "bleuté" (sampled from G4/L2 after)**

| Role | Colour |
|---|---|
| Deepest band (landing alt section) | `#0c1526` |
| Cards / hero / inset wells | `#111c30` |
| Sidebar | `#16223a` |
| Page | `#17253f` |
| Raised column / surface | `#1f2e4d` |
| Active nav / selected | `#25345b` |
| Primary button | Pastel periwinkle `#90b8f0` fill with dark navy label (8.4:1) |

- Status dots and pills go pastel: periwinkle, butter yellow, mint (about `#8ad8a2`) and salmon.
- Secondary text is light enough for 6:1 or better.
- Borders are subtle navy lines, a step lighter than the surface.

### Typography
- Saira stays the display face: heavy and condensed-feeling for headings, and also the button text. The landing H1 is Saira Black/ExtraBold in navy.
- Inter is the body face.
- **Fewer variants**: the R1 note asks to reduce font mixing.
- Long subtitles break into 2 lines with a capped measure.
- Uppercase small tracked labels are used for column headers (SENT, INTERVIEW).
- Eyebrow labels are small grey Inter.

### Illustration style
- Glossy, soft-3D, toy-like spot illustrations with gentle gradients, plus confetti dots in pink and green.
- Examples: a yellow notepad with a purple pencil; a microphone character with a face, a pink bow tie and a gold stand; a document with a check; a hill with a flag; a bar chart; and chat bubbles in pale blue and peach.
- Used in empty states, step explainers, the auth side panel and the mobile blockers. They are "v3" illustrations that must read in dark mode, with a light glow under them on dark backgrounds.
- **Not** used for small functional affordances such as upload targets, which keep icons.

### Iconography
- Lucide-style 1.5 px outline icons.
- The **selected nav item switches to the filled variant** in accent.
- Small icons sit inside soft rounded tiles (the upload ↑ in a grey tile, the file icon in a white tile).
- Status is shown by coloured dots with an icon (paper-plane, calendar, check-circle, ×).

### Radii and shape
- **Buttons are 8 px**, explicitly standardised and no longer pill.
- Cards and panels are about 12 px.
- Inputs are about 6-8 px.
- Suggestion chips and option cards are about 8 px.
- The Tali avatar is a rounded square (squircle) at about 22 %.
- Segmented controls and filters are 8 px.
- Small badges and pills are fully rounded.

### Density and spacing
- **Forms**: 16 px between fields and 32 px before the primary CTA.
- **Tables**: 40 px rows, with a target of about 16 rows per screen.
- More breathing room above page titles.
- Content is grouped in grey containers holding white cards (roadmap) or white cards on a white page.
- Hover is subtle.

### Elevation
- Light theme: borders over shadows.
- Hero mockups get a **soft brand halo** instead of an offset shadow.
- Dark theme: **tight text glow** on large headings and a light glow beneath illustrations. Glow replaces shadow.

### Motion hints (implied, not animated in the deck)
- The assistant panel slides in from the right and **pushes** the content.
- The nav collapses to a rail when the panel opens and can expand again.
- The renamed card flashes an accent border.
- The score ring arc fills to its value.
- "See more" expands inline, and Rejected collapses.
- The avatar has emotional states.

### Assistant presentation
- **Tali** is the coach: a blue squircle smiley.
- **Sophie** is the AI recruiter in simulations.
- Entry points: "Ask Tali" at the top of the nav (desktop) and the Tali tab (mobile).
- Panel: a right column that pushes the page (the page sits in a bordered window), titled "New chat with Tali", with expand/collapse.
- Empty state: avatar, "How can I help?" (or "Hi, I'm Tali" plus a capabilities line), a composer with attach and send, and context suggestions (chips, plus a pinned "Prepare my Qonto interview" card).
- Replies contain action-receipt cards (✓ done, or → pending with Confirm/Undo).
- On marketing pages, Tali appears as a speech card commenting on the product.
- The blue→green gradient FAB, the "TalkUp AI" header and "Powered by" are gone.

---

## 2. Generalizable principles (ranked by impact)

1. **The AI is an agent in a persistent, page-pushing side column**, reached from a top-of-nav entry. It is never a floating bubble that covers content. (G1, G2, B, M1)
2. **Agent replies are structured action receipts.** Reversible actions apply with Undo; side-effect actions wait for an explicit Confirm. Highlight the changed object in the page. (G2)
3. **Every AI number comes with an explanation** of what it is and isn't (an estimate, not a hiring probability), one click away. Visualisations must be truthful to the value. (R1, L3)
4. **Dark mode is tinted brand navy, not black.** It uses pastel primary fills with dark labels and pastel semantic colours, and glow instead of shadow. (G4, L2)
5. **Contrast is measured**: every text tier, including disabled labels, reaches 4.5:1 or better (deck targets: disabled 5:1, secondary 6:1, buttons 8.4:1). (G3, G4, C1)
6. **Colour is semantic.** Green means success only, accent means interactive only. Non-interactive labels and context names stay neutral. (G3, C1)
7. **Wizards: one decision per step**, and the steps are the user's inputs. A stepper shows where you are; optional steps say "(optional)"; consent sits next to the commit button. (C3)
8. **Errors return to the step at fault and keep everything else.** Reassure the user about what was saved and offer a fallback path (link or PDF). (C3)
9. **Plan for scale**: search, filters, a match count, a searchable combobox instead of long lists, and a dense table view next to the board. (Ap2, Ap3, Ap4)
10. **Empty states and dead ends** get a playful illustration, one line of why, and one or two clear next actions. They are never a grey icon alone and never a blocked screen. (G5, M2)
11. **The assistant's empty state teaches its capabilities** through concrete, contextual suggested prompts. (G6, B)
12. **Persona clarity**: distinct names and roles for distinct AIs (Tali coaches, Sophie recruits) and a recognizable avatar with states. (G1, G6)
13. **Responsive by restructuring, not shrinking**: bottom tab nav, status tabs instead of columns, and the same search on every breakpoint. (M1)
14. **Respect device fit honestly.** If a task needs a desk, say so and offer a handoff (email the link) plus a useful alternative. (M2)
15. **Forms use visible labels and example placeholders**, a 16 px field gap and 32 px before the CTA. Mark optional fields in the label and state rules up front. (A1, A2)
16. **Strict consistency across sibling screens** (login and sign-up share labels, spacing and side panel). (A2)
17. **Put the headline metric in its own card, top right**, so it isn't buried or watermarked. (R1)
18. **Linear over zig-zag**: show a process as one straight path of white cards on a grey track. (R1)
19. **Stack instead of tab** when there is room. Progressive disclosure (title, then See more) beats walls of text. (R2)
20. **Let users triage AI output** with Got it and Hide, and show a hidden count. (R2)
21. **Let users rename generated entities** and keep the original source visible. (Ap1, Ap3)
22. **Every detail page has a way back** ("← All applications"). (Ap1)
23. **Collapse low-value groups** (Rejected) so the useful ones gain space. (Ap3)
24. **One radius system**: 8 px buttons everywhere, no stray pills. Limit font variants. (R1, R2)
25. **Separate chrome with hairlines, not tint blocks.** The active nav uses a filled icon. Hover is subtle. (G1, Ap2)
26. **Integrations and settings stay out of primary nav.** (G1)
27. **Marketing: tease real output, blur the rest, one CTA.** The hero is not a product tour. (L3)
28. **Brand glow over offset shadow.** Mascot speech cards beat decorative floating shapes. Spot illustrations beat ordinal numerals. (L1, L2)
29. **Functional affordances get icons, emotional moments get illustrations.** (C1 vs G5)
30. **Reuse saved data by default** ("Use my current CV") and make replacement explicit. (C3)

---

## 3. "Ce qu'on devra ajouter dans le code" (verbatim-ish, translated)

Tags: **F** = Front, **B+F** = Back + front.

**Assistant**
- F: Right-hand panel that pushes the page.
- F: Nav collapsed when the panel opens (collapse already exists).
- B+F: Actions on the site (rename, add to agenda), with confirmation.
- F: Bot avatar and welcome screen.

**CV analysis**
- F: 3-step flow, link error on step 1.
- B+F: Offer PDF (route, extraction, duplicates without a URL).
- B+F: "Use my current CV" (read the CV from the profile).
- F: PDF-only CV (copy and checks).

**Applications**
- F: Back link from the detail page.
- B+F: Custom name (new field and update).
- F: Menu with search, list filters.
- F: Collapsible Rejected column.
- F: Table view.

**Roadmap**
- F: Talking points under the roadmap, "See more".
- B+F: "Got it" and "Hide" persisted.
- F: Score explanation, starter stub at 0 %.

**Mobile**
- F: Bottom nav, status tabs.
- F: "Simulation on a computer" screen.
- B+F: Send the link by email (the mail module exists).

**Landing**
- B+F: Teasing page (CV without an account and AI cost still to decide).
- F: Text-shadow glow, v3 illustrations.

Footnote, verbatim: *« Retouches visuelles non listées : thème sombre, couleurs, espacements, boutons. Portée estimée en lisant le code, pas un chiffrage. »* In English: unlisted visual touch-ups (dark theme, colours, spacing, buttons); scope estimated by reading the code, not a costed estimate.

---

## 4. Divergence from the current code tokens

Files compared: `web/src/styles/tailwind.css`, `web/DESIGN.md`.

| Area | Code today | Deck identity | Gap |
|---|---|---|---|
| Dark background | `.dark` `--color-background #121212`, `--color-surface #1e1e1e`, `surface-raised #2a2a2a`, `surface-sidebar #232429`, borders `#3a3a3a`, `white #1a1a1a` (neutral greys) | Navy: page `#17253f`, sidebar `#16223a`, raised `#1f2e4d`, inset cards `#111c30`, active `#25345b`, deep band `#0c1526` | **Largest gap.** The whole `.dark` neutral scale must be re-tinted navy. G4 is marked "Fait" in the deck, but these tokens are still the "before" values. |
| Dark accent / buttons | `--color-accent #5a8fe8` (dark) with `text-accent #2a2a3a` | Pastel `#90b8f0` fill with dark navy label (8.4:1) | The accent should get lighter and more pastel. `--color-text-accent` should be dark navy, not grey-violet. |
| Dark status | success `#2a9a32`, warning `#d8b040`, error `#d84a35`, with near-black `-weak` tints `#1a3a1a`… | Pastel mint, butter, salmon and periwinkle on navy | The semantic colours need dark-mode pastel variants. The `-weak` tints should be navy-based. |
| Dark secondary text | `text-weakest #606068` (~2.6:1 on #121212), `text-weaker #909098` | Secondary text 6:1 or better | `text-weakest` and `text-weaker` fail the deck's target. Lighten them. |
| Light sidebar | `--color-surface-sidebar #ecedf6` | `#f8f9ff` with a right border | Retoken `surface-sidebar` to the `surface` value and add a border. |
| Disabled | `--color-disabled #c7c7c7` (often used as a fill with grey text) | Readable disabled at 5:1 | A disabled-text token at 4.5:1 or better is needed. The current grey-on-grey pattern fails. |
| Brand gradient | `.bg-brand-gradient` accent→success "for the chatbot widget surfaces (FAB, header, send button, user bubble)" | Gradient FAB and header removed; solid accent squircle avatar; solid blue send button | The utility, and the floating chatbot it exists for, become obsolete. |
| Org view | `data-view='organization'` accent `#1d9e75` (light emerald) applied to accent, primary and links | "Darker green"; org label and nav name neutral | The light-mode org accent should go darker (closer to `#0f6b4c`) so it doesn't read as success. |
| Radii | No radius tokens. DESIGN.md says "8–12 px… avoid full pill unless already used" | Buttons 8 px exactly, cards about 12 px | Add `--radius-button: 8px` / `--radius-card: 12px` tokens. Pills existed on the roadmap. |
| Spacing | No form rhythm tokens | 16 px between fields, 32 px before CTA, 40 px table rows | Document these as rules (or add spacing tokens). |
| Elevation | DESIGN.md: "Flat… optional light shadow; no glow" | A brand halo on hero mockups; a text glow on dark-mode headings; a glow under illustrations | A new glow token or utility is needed (dark only, subtle). DESIGN.md §6 needs an update. |
| Illustrations | Not covered by DESIGN.md | Glossy soft-3D spot illustrations with confetti, theme-safe | Add an illustration section with rules: empty states and blockers yes, functional affordances no. |
| Icons | Not specified | Outline by default, filled when active | Add the rule. |
| Assistant identity | Not in DESIGN.md. Code uses "TalkUp AI", a gradient FAB and an "Assistant" nav item | Tali squircle smiley, Ask Tali at the top of the nav, push panel, Sophie as a separate persona | The design system needs an "Assistant" section, and an avatar asset with states is needed. |
| Typography | Saira 400-900 and Inter 400 only; button utilities Saira 400 | Fewer variants; bold Saira headings; buttons look medium | Inter loads only weight 400, but the deck uses bold Inter labels (consistent with `-strong` utilities, which would be faux-bold). Load Inter 500/600/700. |
| Light accent / primary | `#2b70c9` / `#29457a` | Same (Tali `#2870c8`, landing navy headlines) | **Aligned.** |
| Light surfaces / borders / success tints | `#f8f9ff`, `#ecedf6`, `#e4e8f0`, `#d9dbeb`, `#def7e3` | Same values observed | **Aligned.** |
