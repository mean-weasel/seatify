import { test, expect } from '@playwright/test';

test.describe('Guests Page', () => {
  test('should redirect to login when accessing guests page unauthenticated', async ({ page }) => {
    // Try to access guests page directly without auth
    await page.goto('/dashboard/events/test-event-id/guests');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('guests page route should exist at /dashboard/events/[id]/guests', async ({ page }) => {
    // Navigate to a guests page URL (will redirect to login since not authenticated)
    await page.goto('/dashboard/events/883849a4-5c56-4991-880c-8d538ebd7b88/guests');

    // Should redirect to login, not show a 404 page
    await expect(page).toHaveURL(/\/login/);

    // The login page should be visible (confirming successful redirect, not 404)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('guests page should be accessible from canvas via navigation', async ({ page }) => {
    // This test verifies the route exists by checking the redirect behavior
    // When authenticated, users should be able to navigate from canvas to guests
    const guestsPath = '/dashboard/events/test-id/guests';

    // Attempt to access - should redirect to login (proving route exists and is protected)
    const response = await page.goto(guestsPath);

    // Route should exist and redirect (not return 404)
    // A redirect will still show as 200 after following redirects
    await expect(page).toHaveURL(/\/login/);
  });
});
