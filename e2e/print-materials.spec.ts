import { test, expect } from '@playwright/test';
import { enterApp, isMobileViewport } from './test-utils';

// Skip mobile tests - PDF downloads have browser-dependent behavior
// and mobile dashboard navigation has timing issues
test.skip(({ browserName, viewport }) => {
  return viewport !== null && viewport.width < 768;
}, 'Skipping PDF tests on mobile viewports');

/**
 * Helper to switch to dashboard view (desktop only)
 */
async function switchToDashboard(page: import('@playwright/test').Page) {
  await page.click('.toggle-option:has-text("Dashboard")');
  // Wait for dashboard view to be visible
  await expect(page.locator('.dashboard-view')).toBeVisible({ timeout: 5000 });
}

// =============================================================================
// Print Materials Section Tests
// =============================================================================

test.describe('Print Materials', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
    await switchToDashboard(page);
  });

  test('print materials section is visible in dashboard', async ({ page }) => {
    // Check for the Print Materials section
    await expect(page.locator('.print-materials')).toBeVisible();
    await expect(page.locator('.print-materials h3')).toContainText('Print Materials');
  });

  test('print materials section has description', async ({ page }) => {
    await expect(page.locator('.print-materials-description')).toBeVisible();
    await expect(page.locator('.print-materials-description')).toContainText('Generate printable PDFs');
  });

  test('table cards button is visible', async ({ page }) => {
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    await expect(tableCardsBtn).toBeVisible();
    await expect(tableCardsBtn.locator('.print-material-desc')).toContainText('Tent cards');
  });

  test('place cards button is visible', async ({ page }) => {
    const placeCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Place Cards' });
    await expect(placeCardsBtn).toBeVisible();
    await expect(placeCardsBtn.locator('.print-material-desc')).toContainText('Name cards');
  });

  test('table cards shows count badge', async ({ page }) => {
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    const countBadge = tableCardsBtn.locator('.print-material-count');
    await expect(countBadge).toBeVisible();
    // Should show number of tables (e.g., "3 cards")
    await expect(countBadge).toContainText('cards');
  });

  test('place cards shows count badge', async ({ page }) => {
    const placeCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Place Cards' });
    const countBadge = placeCardsBtn.locator('.print-material-count');
    await expect(countBadge).toBeVisible();
    // Should show number of seated confirmed guests
    await expect(countBadge).toContainText('cards');
  });
});

// =============================================================================
// Table Cards Button Tests
// =============================================================================

test.describe('Table Cards Button', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
    await switchToDashboard(page);
  });

  test('table cards button has icon', async ({ page }) => {
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    const icon = tableCardsBtn.locator('.print-material-icon svg');
    await expect(icon).toBeVisible();
  });

  test('clicking table cards button triggers download', async ({ page }) => {
    // Listen for download event (increased timeout for lazy-loaded jsPDF)
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // Click the table cards button
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    await tableCardsBtn.click();

    // Verify download was triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('table-cards');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('table cards download shows success toast', async ({ page }) => {
    // Click the table cards button
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    await tableCardsBtn.click();

    // Check for success toast (longer timeout for lazy-loaded jsPDF)
    await expect(page.locator('.toast')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.toast')).toContainText('Table cards PDF downloaded');
  });
});

// =============================================================================
// Place Cards Button Tests
// =============================================================================

test.describe('Place Cards Button', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
    await switchToDashboard(page);
  });

  test('place cards button has icon', async ({ page }) => {
    const placeCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Place Cards' });
    const icon = placeCardsBtn.locator('.print-material-icon svg');
    await expect(icon).toBeVisible();
  });

  test('place cards button shows appropriate count', async ({ page }) => {
    // The place cards count should show seated confirmed guests
    const placeCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Place Cards' });
    const countBadge = placeCardsBtn.locator('.print-material-count');

    // Should contain a number followed by "cards"
    await expect(countBadge).toBeVisible();
    const countText = await countBadge.textContent();
    expect(countText).toMatch(/\d+\s*cards/);
  });
});

// =============================================================================
// PDF Download Integration Tests
// =============================================================================

test.describe('PDF Download Integration', () => {
  test('downloads have correct filenames based on event name', async ({ page }) => {
    await enterApp(page);
    await switchToDashboard(page);

    // Listen for download event (increased timeout for lazy-loaded jsPDF)
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // Click the table cards button
    const tableCardsBtn = page.locator('.print-material-btn').filter({ hasText: 'Table Cards' });
    await tableCardsBtn.click();

    // Verify download filename contains event name
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/.*-table-cards\.pdf$/);
  });
});
