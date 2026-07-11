import { expect, test } from '@playwright/test';

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

test.describe('applications kanban', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/api/auth/status', (route) =>
      route.fulfill({ json: { authenticated: true } }),
    );
    // The sidebar's account switcher mounts on every authenticated page and
    // fetches the current user. Left unmocked it hits the real backend (now
    // running in e2e CI), gets a 401, and the axios interceptor's failed-refresh
    // path redirects the whole app to /login — so the page under test never
    // renders. Serve a stub profile so the switcher is satisfied and we stay on
    // /applications.
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

  test('shows the empty state with a single CTA and no add button', async ({
    page,
  }) => {
    await page.route('**/v1/api/applications', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.goto('/applications');
    await expect(page.getByText('No applications yet')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Start a CV + offer analysis' }),
    ).toBeVisible();
    // The top-left "+ New application" button only appears once an application
    // exists; the empty state's own CTA is the sole entry point.
    await expect(
      page.getByRole('link', { name: '+ New application' }),
    ).toBeHidden();
  });

  test('renders a card in its column and persists a menu status change', async ({
    page,
  }) => {
    let current = { ...app };
    await page.route('**/v1/api/applications', (route) =>
      route.fulfill({ json: [current] }),
    );
    await page.route(`**/v1/api/applications/${app.applicationId}`, (route) => {
      const body = route.request().postDataJSON() as { status: string };
      current = { ...current, status: body.status };
      return route.fulfill({ json: current });
    });

    await page.goto('/applications');
    const sentColumn = page.getByTestId('kanban-column-sent');
    await expect(sentColumn.getByText('Datadog Paris')).toBeVisible();

    await page.getByLabel('Application actions').click();
    await page.getByRole('menuitem', { name: 'Interview' }).click();

    const interviewColumn = page.getByTestId('kanban-column-interview');
    await expect(interviewColumn.getByText('Datadog Paris')).toBeVisible();

    // Reload: the mocked list now serves the updated status — the card stays.
    await page.reload();
    await expect(
      page.getByTestId('kanban-column-interview').getByText('Datadog Paris'),
    ).toBeVisible();
  });

  test('moves a card to another column with a keyboard drag', async ({
    page,
  }) => {
    let current = { ...app };
    let patchBody: { status: string } | null = null;
    await page.route('**/v1/api/applications', (route) =>
      route.fulfill({ json: [current] }),
    );
    await page.route(`**/v1/api/applications/${app.applicationId}`, (route) => {
      patchBody = route.request().postDataJSON() as { status: string };
      current = { ...current, status: patchBody.status };
      return route.fulfill({ json: current });
    });

    await page.goto('/applications');
    await expect(
      page.getByTestId('kanban-column-sent').getByText('Datadog Paris'),
    ).toBeVisible();

    // dnd-kit KeyboardSensor: focus the draggable handle, Space to pick up,
    // arrows to move toward the next column, Space to drop.
    const handle = page.getByTestId('kanban-column-sent').getByRole('button', {
      name: 'Datadog Paris',
    });
    await handle.focus();
    await page.keyboard.press('Space');
    // Move right across columns; several steps to clear the 25px keyboard delta.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Space');

    // The status PATCH fired and the card landed in a later column.
    await expect
      .poll(() => patchBody?.status, { timeout: 5000 })
      .not.toBeUndefined();
    await expect(
      page
        .getByTestId(`kanban-column-${current.status}`)
        .getByText('Datadog Paris'),
    ).toBeVisible();
    expect(current.status).not.toBe('sent');
  });

  test('rolls the card back to its column when the status update fails', async ({
    page,
  }) => {
    await page.route('**/v1/api/applications', (route) =>
      route.fulfill({ json: [app] }),
    );
    // The PATCH always fails — the optimistic move must roll back.
    await page.route(`**/v1/api/applications/${app.applicationId}`, (route) =>
      route.fulfill({ status: 500, json: { message: 'boom' } }),
    );

    await page.goto('/applications');
    await page.getByLabel('Application actions').click();
    await page.getByRole('menuitem', { name: 'Interview' }).click();

    // After the failed PATCH, onError restores the snapshot: card is back in
    // "sent" and absent from "interview".
    await expect(
      page.getByTestId('kanban-column-sent').getByText('Datadog Paris'),
    ).toBeVisible();
    await expect(
      page.getByTestId('kanban-column-interview').getByText('Datadog Paris'),
    ).toBeHidden();
  });
});
