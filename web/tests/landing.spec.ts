import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders landing nav and hero on /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('link', { name: /talkup home/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /^log in$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /get started/i }).first(),
    ).toBeVisible();
  });

  test('does not render the app sidebar on /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside')).toHaveCount(0);
  });
});

test.describe('Auth pages shell', () => {
  for (const path of [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]) {
    test(`renders logo + back-to-home link on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole('link', { name: /talkup home/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /back to home/i }),
      ).toBeVisible();
    });

    test(`back-to-home link navigates to / from ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('link', { name: /back to home/i }).click();
      await expect(page).toHaveURL('/');
    });

    test(`does not render the app sidebar on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('aside')).toHaveCount(0);
    });
  }
});
