import { test, expect } from '@playwright/test';

/**
 * Demo experience E2E tests.
 *
 * Note: Tests for the /demo page content are skipped because they require
 * a seeded demo event in the database, which isn't available in CI.
 * The landing page modal tests work without database dependencies.
 */

test.describe('Landing Page Choice Modal', () => {
  test('should show choice modal when clicking Start Planning Free', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Find and click the main CTA button
    const ctaButton = page.getByRole('button', { name: /start planning free/i });
    await ctaButton.click();

    // Should show the choice modal
    const modal = page.locator('.landing-choice-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should display two options in choice modal', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Open the modal
    const ctaButton = page.getByRole('button', { name: /start planning free/i });
    await ctaButton.click();

    // Should have two options
    const demoOption = page.locator('.landing-choice-option--demo');
    const signupOption = page.locator('.landing-choice-option--signup');

    await expect(demoOption).toBeVisible();
    await expect(signupOption).toBeVisible();
  });

  test('should navigate to signup when Create Account is clicked', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Open the modal
    const ctaButton = page.getByRole('button', { name: /start planning free/i });
    await ctaButton.click();

    // Click Create Account option
    const signupOption = page.locator('.landing-choice-option--signup');
    await signupOption.click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Open the modal
    const ctaButton = page.getByRole('button', { name: /start planning free/i });
    await ctaButton.click();

    // Modal should be visible
    const modal = page.locator('.landing-choice-modal');
    await expect(modal).toBeVisible();

    // Click on the overlay (outside the modal)
    const overlay = page.locator('.landing-choice-overlay');
    await overlay.click({ position: { x: 10, y: 10 } });

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Open the modal
    const ctaButton = page.getByRole('button', { name: /start planning free/i });
    await ctaButton.click();

    // Click close button
    const closeButton = page.locator('.landing-choice-close');
    await closeButton.click();

    // Modal should be hidden
    const modal = page.locator('.landing-choice-modal');
    await expect(modal).not.toBeVisible();
  });
});
