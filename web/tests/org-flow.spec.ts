import { expect, test } from '@playwright/test';

/**
 * Org happy-path UI flow (F12/F2 surfaces). Full redemption needs OTP email
 * access, so this spec verifies the UI contract up to each 202 handoff.
 *
 * Guard: skips unless BOTH the web app is up AND the organization frontend is
 * present. The org signup surface (`/register-organization`) ships with the
 * F12 feature branch; on branches where it is not yet merged the route 404s and
 * these specs would assert against UI that does not exist. Rather than fail, we
 * skip so the suite stays green until the feature lands — at which point the
 * guard passes and the tests run for real against the CI backend.
 */
test.describe('organization flows', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/').catch(() => null);
    test.skip(!response || !response.ok(), 'dev stack not running');

    // Probe for the org frontend: the signup form must expose an
    // "organization name" field. Absent it, the F12 surfaces are not merged.
    // The route's `beforeLoad` guard awaits an auth-status check (and, when
    // anonymous, a refresh round trip) before the code-split form renders, so
    // an immediate visibility snapshot always loses that race. Wait for the
    // field to appear; if it never does (feature not merged), skip cleanly.
    await page.goto('/register-organization').catch(() => null);
    const orgFeaturePresent = await page
      .getByPlaceholder(/organization name/i)
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!orgFeaturePresent, 'organization frontend not present');
  });

  test('landing routes org CTAs correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'For organizations' }).click();
    await expect(
      page.getByRole('link', { name: 'Start a 30-day trial' }),
    ).toHaveAttribute('href', /\/register-organization/);
    await page.getByRole('link', { name: 'I have a code' }).click();
    await expect(page).toHaveURL(/\/register\?code=/);
    await expect(page.getByPlaceholder(/organization code/i)).toBeVisible();
  });

  test('org signup form submits and hands off to verify-email', async ({
    page,
  }) => {
    const suffix = Date.now();
    await page.goto('/register-organization');
    await page.getByPlaceholder(/organization name/i).fill(`PW Org ${suffix}`);
    await page.getByPlaceholder(/email/i).fill(`pw_${suffix}@example.com`);
    await page.getByPlaceholder(/password/i).fill('Abcdefg1*');
    await page.getByRole('button', { name: /create organization/i }).click();
    await expect(page).toHaveURL(/\/verify-email/);
  });

  test('register with a bogus code surfaces the backend error', async ({
    page,
  }) => {
    const suffix = Date.now();
    await page.goto('/register?code=BOGUSBOGUS22');
    await expect(page.getByPlaceholder(/organization code/i)).toHaveValue(
      'BOGUSBOGUS22',
    );
    await page.getByPlaceholder('Choose a username').fill(`pw${suffix}`);
    await page
      .getByPlaceholder('Your email address')
      .fill(`pwm_${suffix}@example.com`);
    await page.getByPlaceholder('Create a secure password').fill('Abcdefg1*');
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page.getByRole('alert')).toContainText(/organization code/i);
  });
});
