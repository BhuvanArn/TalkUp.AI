# Analytics (Umami)

The web app can report page views and a handful of custom events to
[Umami](https://umami.is), a cookie-less, privacy-friendly analytics tool.
It is **off by default**: nothing loads unless `VITE_UMAMI_WEBSITE_ID` is set.

Code: `web/src/utils/analytics.ts` (`initAnalytics()` runs in `web/src/main.tsx`;
`trackEvent(name, data?)` is a safe no-op when Umami is absent or blocked).

## Enabling it

Set these build-time variables (Vercel project settings, or `web/.env` locally):

| Variable                | Required | Meaning                                                                  |
| ----------------------- | -------- | ------------------------------------------------------------------------ |
| `VITE_UMAMI_WEBSITE_ID` | yes      | Website id from the Umami dashboard (Settings → Websites).               |
| `VITE_UMAMI_SCRIPT_URL` | no       | Tracker URL. Defaults to Umami Cloud: `https://cloud.umami.is/script.js`. |

- **Umami Cloud**: create a website at cloud.umami.is, copy its id into
  `VITE_UMAMI_WEBSITE_ID`, leave `VITE_UMAMI_SCRIPT_URL` unset.
- **Self-hosted**: deploy Umami (Docker + Postgres), create the website there and
  set `VITE_UMAMI_SCRIPT_URL=https://<your-umami-host>/script.js`. The tracker
  must support `data-auto-pageview` (Umami Cloud does): check that the instance's
  `/script.js` contains `auto-pageview`. An older tracker ignores it and records
  every page view on every page, twice on public pages.

Because these are `VITE_` variables they are baked in at build time: redeploy after
changing them. Leave them unset in dev and preview builds to keep data clean.

## What is tracked

Page views (path, referrer, browser, OS, device, country) are recorded only on
the public pages listed in `TRACKED_PATHS` (`web/src/utils/analytics.ts`): `/`,
`/about`, `/privacy`, `/login`, `/register`, `/register-organization` and
`/verify-email`. Automatic page views are disabled (`data-auto-pageview="false"`)
so in-app navigation does not consume the Umami Hobby quota (100K events/month,
where each event data property also counts as one event). Do not use
`data-auto-track="false"` instead: it also stops Umami from following route
changes, so every page view and event would be reported with the first URL
loaded. Custom events fire on every page:

| Event                  | Fired when                                    | Data                                                                                        |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cta_click`            | A landing CTA is clicked                      | `location`: `hero`, `orgs`, `pricing_candidates`, `pricing_orgs`, `final`, `nav`; `target`: `/register`, `/register-organization`, `/login`, `#how` |
| `signup_completed`     | `POST /auth/register` succeeds                | `withOrganizationCode`: boolean                                                             |
| `hero_view`            | The landing hero renders                      | `heroVariant`: `a`, `b`                                                                     |
| `email_verified`       | OTP email verification succeeds               | `flow`: `candidate`, `organization` (admin of a new organization)                           |
| `organization_created` | `POST /auth/register-organization` succeeds   | none                                                                                        |
| `contact_click`        | A `contact@talkup.ai` mailto link is clicked  | `location`: `footer`, `about`                                                               |

No personal data (email, name, ids) is ever sent with an event.

`cta_click` and `signup_completed` also carry `heroVariant` when the visitor has
seen the landing hero (see below). Events fired before the deferred tracker has
loaded are queued and sent on load.

## Hero headline A/B test

The landing H1 is split 50/50 between two headlines (`HERO_HEADLINES` in
`web/src/components/organisms/landing-page/index.tsx`). Both are new: the
redesign drops the previous headline, so the test picks between the two
candidates for it. It does not measure the gain over the old headline.

| Variant | Headline                              |
| ------- | ------------------------------------- |
| `a`     | The interview before the interview.   |
| `b`     | Speak right. Land the job.            |

The variant is drawn on the first landing visit and stored in `localStorage`
(`talkup.heroVariant` = `<variant>:<timestamp>`), so a returning visitor keeps
the same headline. It holds no personal data; a value older than 13 months is
ignored and deleted on the next visit (localStorage has no expiry of its own,
so the key stays on the device of a visitor who never comes back). A
`sessionStorage` flag (`talkup.heroViewCounted`, cleared when the tab closes)
makes `hero_view` fire once per session.
Storage is still a "similar technology" under ePrivacy, like a cookie: see
[Privacy](#privacy).

**Reading the results.** In Umami → Events, open each event and break it down
by the `heroVariant` property. Umami shows *event counts* per property value,
not unique visitors; `hero_view` fires once per browser session, so the unit is
the session (close to a visit). The headline targets candidates, so both rates
leave organizations out:

- **CTA rate** = `cta_click` with `target` = `/register` (variant X) /
  `hero_view` (variant X). Several clicks in one session count several times.
- **Signup rate** = `signup_completed` with `withOrganizationCode` = `false`
  (variant X) / `hero_view` (variant X). Invited members came for the invite,
  not the headline.

During the test, search engines (no storage) may index either headline: both
say the same thing and the test is short, so this is accepted.

Check the exact path once in the live dashboard and update this section if
Umami offers per-visitor counts for a property.

**When to conclude.** Decide the length before looking: at least 4 weeks, and
aim for about 1,500 `hero_view` per variant (enough to detect a CTA rate moving
from 5% to 7.5%). Do not stop at the first gap seen along the way. Then compare
the two rates with a two-proportion z-test; below that traffic, report the
result as indicative only.

**Quota.** Each event data property counts as one Hobby event: `hero_view`
(+1 property) and the extra `heroVariant` on `cta_click` and
`signup_completed` make a landing visit without a click cost about three events
instead of one (page view, `hero_view`, its property).

**Ending the test.** Keep the winning headline as a plain H1 and remove
`HERO_HEADLINES`, `getHeroVariant` / `peekHeroVariant` / `heroVariantData` /
`trackHeroView`,
the `hero_view` event and the `heroVariant` tags, the A/B sentence of the
privacy policy, and this section. Add a one-off
`localStorage.removeItem('talkup.heroVariant')` for returning visitors.

## Landing conversion table

In Umami, set the date range, then build the funnel (Reports → Funnel, or read
the counts from the Events tab):

| Step | Source                                                     | Metric                       |
| ---- | ---------------------------------------------------------- | ---------------------------- |
| 1    | Page views, URL = `/`                                      | Unique visitors on landing   |
| 2    | Event `cta_click`, `target` = `/register` or `/register-organization` | Unique visitors who clicked a signup CTA |
| 3    | Event `signup_completed`                                   | Accounts created (tracked)   |
| 4    | Event `email_verified`, `flow` = `candidate`               | Verified accounts            |
| ref  | `GET /v1/api/stats/public` → `totalAccounts` (server)      | Ground-truth verified total  |

Conversion rates: step N / step 1 (overall) and step N / step N-1 (per step). The
`cta_click` breakdown by `location` shows which section converts best. Step 2
leaves out the `/login` and `#how` targets: they are not signups. Organization
signups are a parallel branch: `organization_created`, then `email_verified`
with `flow` = `organization`.
`totalAccounts` only counts verified emails, so compare its delta over the same
period with all `email_verified` (both flows, not `signup_completed`): the gap is roughly the
share of visitors who block the tracker (ad blockers), so treat Umami numbers as
a lower bound.

## Privacy

Umami sets **no cookies** and stores no personal data (visitors are counted with a
salted, rotating hash). The hero A/B test stores one `localStorage` key on the
visitor's device (variant + date, no personal data, ignored and deleted on the
next visit after 13 months), plus a session-only flag. No
consent banner is used on the basis of the CNIL exemption for audience
measurement (strictly measurement, no cross-site tracking, limited lifetime);
whether an A/B test falls under it is a judgement call, so confirm before
relying on it for anything beyond the beta.
Query strings are stripped before sending (`data-exclude-search="true"`):
`/verify-email?email=…` and `/register?code=…` would otherwise leak emails and
invite codes to Umami.
It is disclosed in the privacy policy (`web/src/routes/privacy.tsx`, "Cookies and
similar technologies"): update that paragraph if the tracked pages or events change.
