import { expect, test } from '@playwright/test';

// #195: from an application's simulation page, an in-app "Back to roadmap"
// control must return to that application's roadmap route, so the
// roadmap → simulate → back loop never needs the browser back arrow.
const app = {
  applicationId: '01890000-0000-7000-8000-000000000001',
  companyName: 'Datadog Paris',
  jobTitle: 'SRE Junior',
  status: 'sent',
  offerUrl: 'https://example.com/job',
  offerDetails: null,
  cvDetails: null,
  appliedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/api/auth/status', (route) =>
    route.fulfill({
      json: { authenticated: true, role: 'user', organizationId: null },
    }),
  );
  // The sidebar account switcher fetches the current user on every authed page;
  // stub it so an unmocked 401 doesn't redirect the app to /login mid-test.
  await page.route('**/v1/api/users/me', (route) =>
    route.fulfill({
      json: {
        username: 'qa',
        email: 'qa@talkup.ai',
        firstName: null,
        lastName: null,
        profilePicture: null,
        avatarAccentColor: null,
      },
    }),
  );
  await page.route('**/v1/api/applications', (route) =>
    route.fulfill({ json: [app] }),
  );
});

test('back control inside the persona picker returns to the application roadmap', async ({
  page,
}) => {
  await page.goto(`/applications/${app.applicationId}/simulations`);

  // The persona picker modal is up on first entry and its scrim covers the
  // page's own "Back to roadmap" link (#195 regression from PR #165) — so
  // the real user path back is the modal's own back control.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const back = dialog.getByRole('button', { name: /back to roadmap/i });
  await expect(back).toBeVisible();

  await back.click();

  await expect(page).toHaveURL(
    new RegExp(`/applications/${app.applicationId}/roadmap$`),
  );
});

test('back link on the page returns to the roadmap once the modal is dismissed', async ({
  page,
}) => {
  await page.goto(`/applications/${app.applicationId}/simulations`);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();

  const back = page.getByRole('link', { name: /back to roadmap/i });
  await expect(back).toBeVisible();

  await back.click();

  await expect(page).toHaveURL(
    new RegExp(`/applications/${app.applicationId}/roadmap$`),
  );
});
