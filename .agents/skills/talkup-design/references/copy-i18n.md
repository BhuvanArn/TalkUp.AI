# Copy, French typography and i18n

**Read this when:** writing any visible string in a piste or in code.
**Why:** copy is as visible as any pixel, and generic copy is the fastest AI tell. TalkUp is bilingual (FR/EN): French is 20–30 % longer and breaks layouts that were only checked in English.
**Sources:** `web/I18N.md` (from the i18n work, issue #199), NN/g UX writing, `docs/design/research/research-taste-ai-look.md` §1.6 and §2.6.

## Contents
1. Copy rules
2. French typography
3. i18n mechanics
4. In pistes

## 1. Copy rules

- **Say what it does for this user, concretely.** "Compare your CV with the offer in 2 minutes", not "Unlock your potential". No buzzwords (see `ai-tells.md`).
- **Buttons: verb + object**, the same verb through the flow (button "Save note" → toast "Note saved"). No "Submit", no "Click here", no arrow on every CTA.
- **Labels describe what will happen**, not abstract stages (seminar C1: "Upload / Analysis / Confirmation" said nothing).
- **Errors: the problem + how to fix it**, no blame ("invalid"), no humour, no codes; keep the user's input.
- **Empty states: why it is empty + the first action.**
- **Long sentences under titles are split**: the finding, then the advice (seminar R1).
- **Tone:** calm and encouraging; job search is stressful. Personality in success moments, never in errors.
- **Sentence case** everywhere, in both languages.
- **Real content at real length**: "Ingénieur logiciel backend (Go) chez Qonto", a 3-line job title, 42 applications, an empty list, a 99+ count. Never lorem ipsum, never John Doe.
- **Numbers that change or align**: `tabular-nums`.
- **Name things the user's way:** candidature / application, entretien / interview, relance / follow-up, offre / job offer.

## 2. French typography

| Rule | Example |
|---|---|
| Narrow no-break space (U+202F) before `; ! ?` and no-break space (U+00A0) before `:` | « Prêt ? », « Statut : envoyée » |
| Guillemets with no-break spaces inside | « Envoyer » |
| No-break space between number and unit | 10 min, 3 h, 12 €, 5 Mo |
| Euro after the number | 12 € |
| Dates | 7 nov. 2026, jeudi 12 novembre |
| Time | 14 h 30 or 14:30, 24-hour |
| Sentence case, no Title Case | « Toutes les candidatures » |
| Ellipsis character | Chargement… |
| Apostrophe | ’ (typographic) in copy, consistent with existing locale files |
| **Vous** | The existing `fr` strings use *vous* ("Veuillez réessayer", "Vérifiez votre connexion"). Read the locale files of the area you touch and follow them; with no `fr` file on your branch, use *vous*. Never mix tu and vous on one screen. |

## 3. i18n mechanics (from `web/I18N.md`)

- Strings live in `web/src/locales/{en,fr}/<namespace>.json`; namespaces `common`, `landing`, `auth`, `app`, `settings`. `en` is the source; add every key to `fr` in the same change (a unit test fails otherwise; unknown keys fail `tsc`).
- Keys: nested camelCase, by role not by text: `applications.detail.backLink`, not `applications.allApplications`.
- `useTranslation('<ns>')`, `t('key')`; plurals `_one` / `_other` only, pass `count`; inline markup with `<Trans components={{…}}>`, never a sentence split into several keys; user or URL values as component children, never in `values`.
- Translate `aria-label`, `alt`, `title`, `placeholder` too.
- Dates and numbers: `useLocale()` / `getLocale()` for `date-fns` and `Intl`.
- If `web/I18N.md` is not on your branch yet, the i18n work has not merged: still write keys-ready copy (EN + FR) in the piste, and flag it in the PR.

## 4. In pistes

- Every string in a mockup exists in both languages: `<span data-lang="fr">…</span><span data-lang="en">…</span>`. The template's `L` key switches.
- Check the layout in **French** first: it is the longer one.
- List the new i18n keys (namespace, key, EN, FR) in the piste's notes when the piste is chosen.
