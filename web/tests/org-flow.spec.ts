import { expect, test } from '@playwright/test';

/**
 * Org happy-path UI flow (F12/F2 surfaces). Full redemption needs OTP email
 * access, so this spec verifies the UI contract up to each 202 handoff.
 * Skips when the dev stack isn't running.
 */
test.describe('organization flows', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/').catch(() => null);
    test.skip(!response || !response.ok(), 'dev stack not running');
  });

  test('landing routes org CTAs correctly', async ({ page }) => {
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
