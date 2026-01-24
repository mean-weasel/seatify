import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show profile page elements for authenticated user', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to profile
    await page.goto('/profile');

    // Check profile page elements
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
    await expect(page.getByText(/account/i).first()).toBeVisible();
    await expect(page.getByText(/subscription/i).first()).toBeVisible();
    await expect(page.getByText(/preferences/i).first()).toBeVisible();
  });

  test('should navigate to profile from user menu', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Click user menu
    await page.locator('.user-menu-button').click();

    // Click profile settings
    await page.getByRole('link', { name: /profile settings/i }).click();

    // Should be on profile page
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
  });

  test('should show back link to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to profile
    await page.goto('/profile');

    // Check back link exists
    await expect(page.getByRole('link', { name: /back to events/i })).toBeVisible();

    // Click back link
    await page.getByRole('link', { name: /back to events/i }).click();

    // Should be back on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
