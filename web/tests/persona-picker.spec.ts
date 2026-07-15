import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // /auth/status gates the /simulations route (createAuthGuard). Mirror the
  // real payload shape — see applications.spec.ts for why 'none' + null org
  // is the right stub for a route with no role gate.
  await page.route('**/v1/api/auth/status', (route) =>
    route.fulfill({
      json: { authenticated: true, role: 'none', organizationId: null },
    }),
  );
  // The sidebar's account switcher mounts on every authenticated page and
  // fetches the current user. Left unmocked it hits the real backend (e2e CI
  // runs one since #151), gets a 401, and the axios interceptor's
  // failed-refresh path redirects the whole app to /login — so /simulations
  // never renders. Serve a stub profile so the switcher is satisfied.
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
});

test('asks for a persona on first entry and remembers the choice', async ({
  page,
}) => {
  await page.goto('/simulations');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Choose your interviewer');

  // Four personas are offered as radio cards.
  await expect(dialog.getByRole('radio')).toHaveCount(4);
  await expect(
    dialog.getByRole('radio', { name: /sophie martin/i }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('radio', { name: /thomas leroy/i }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('radio', { name: /claire dubois/i }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('radio', { name: /marc bernard/i }),
  ).toBeVisible();

  // Picking a card highlights it and re-labels the primary footer button.
  await dialog.getByRole('radio', { name: /marc bernard/i }).click();
  const startButton = dialog.getByRole('button', {
    name: /start with marc bernard/i,
  });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Committing closes the modal and the chosen name appears on the page
  // (InfoBox renders unconditionally; the avatar panel only mounts once a
  // media stream is active, which this test does not grant).
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Marc Bernard' }),
  ).toBeVisible();

  // sessionStorage survives a reload, so the picker must not re-ask.
  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Marc Bernard' }),
  ).toBeVisible();

  // The choice is keyed under 'persona-storage' in sessionStorage.
  const stored = await page.evaluate(() =>
    window.sessionStorage.getItem('persona-storage'),
  );
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored as string)).toMatchObject({
    state: { selectedPersonaId: 'marc-bernard' },
  });
});

test('dismissing with Escape falls back to the default recruiter', async ({
  page,
}) => {
  await page.goto('/simulations');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sophie Martin' }),
  ).toBeVisible();

  const stored = await page.evaluate(() =>
    window.sessionStorage.getItem('persona-storage'),
  );
  expect(JSON.parse(stored as string)).toMatchObject({
    state: { selectedPersonaId: 'sophie-martin' },
  });
});
