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
  set `VITE_UMAMI_SCRIPT_URL=https://<your-umami-host>/script.js`.

Because these are `VITE_` variables they are baked in at build time: redeploy after
changing them. Leave them unset in dev and preview builds to keep data clean.

## What is tracked

Page views (path, referrer, browser, OS, device, country) are recorded only on
the public pages listed in `TRACKED_PATHS` (`web/src/utils/analytics.ts`): `/`,
`/about`, `/privacy`, `/login`, `/register`, `/register-organization` and
`/verify-email`. Automatic tracking is disabled (`data-auto-track="false"`) so
in-app navigation does not consume the Umami Hobby quota (100K events/month,
where each event data property also counts as one event). Custom events fire
on every page:

| Event                  | Fired when                                    | Data                                                                                        |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cta_click`            | A landing CTA is clicked                      | `location`: `hero`, `orgs`, `pricing_candidates`, `pricing_orgs`, `final`, `nav`; `target`: `/register`, `/register-organization`, `/login`, `#how` |
| `signup_completed`     | `POST /auth/register` succeeds                | `withOrganizationCode`: boolean                                                             |
| `email_verified`       | OTP email verification succeeds               | none                                                                                        |
| `organization_created` | `POST /auth/register-organization` succeeds   | none                                                                                        |
| `contact_click`        | A `contact@talkup.ai` mailto link is clicked  | `location`: `footer`, `about`                                                               |

No personal data (email, name, ids) is ever sent with an event.

## Landing conversion table

In Umami, set the date range, then build the funnel (Reports → Funnel, or read
the counts from the Events tab):

| Step | Source                                                     | Metric                       |
| ---- | ---------------------------------------------------------- | ---------------------------- |
| 1    | Page views, URL = `/`                                      | Unique visitors on landing   |
| 2    | Event `cta_click` (optionally filter by `location`)        | Unique visitors who clicked  |
| 3    | Event `signup_completed`                                   | Accounts created (tracked)   |
| 4    | Event `email_verified`                                     | Verified accounts            |
| ref  | `GET /v1/api/stats/public` → `totalAccounts` (server)      | Ground-truth account total   |

Conversion rates: step N / step 1 (overall) and step N / step N-1 (per step). The
`cta_click` breakdown by `location` shows which section converts best. Compare the
delta of `totalAccounts` over the same period with `signup_completed`: the gap is
roughly the share of visitors who block the tracker (ad blockers), so treat Umami
numbers as a lower bound.

## Privacy

Umami sets **no cookies** and stores no personal data (visitors are counted with a
salted, rotating hash), so no consent banner is required under GDPR / ePrivacy.
Query strings are stripped before sending (`data-exclude-search="true"`):
`/verify-email?email=…` and `/register?code=…` would otherwise leak emails and
invite codes to Umami.
It should still be disclosed: add a short "Analytics" paragraph to the privacy
page (`web/src/routes/privacy.tsx`) when enabling it in production.
