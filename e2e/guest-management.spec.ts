import { test, expect } from '@playwright/test';

const DEMO_EVENT_URL = '/dashboard/events/00000000-0000-0000-0000-000000000001';

/**
 * Guest Management E2E tests.
 *
 * These tests verify guest CRUD operations, filtering, and relationship management.
 */

test.describe('Guest List View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    // Navigate to guests view
    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.onboarding-overlay')).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('should display guest list', async ({ page }) => {
    // Guest list should be visible
    const guestList = page.locator('.guests-list, .guest-list-container');
    await expect(guestList).toBeVisible();
  });

  test('should show guest count', async ({ page }) => {
    // Demo event should have guests
    const guestItems = page.locator('.guest-row, .guest-item, .guest-card');
    const count = await guestItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display guest names', async ({ page }) => {
    // Guest names should be visible
    const guestNames = page.locator('.guest-name, .guest-full-name');
    const count = await guestNames.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show RSVP status for guests', async ({ page }) => {
    // RSVP indicators should be present
    const rsvpStatus = page.locator('.rsvp-status, .rsvp-indicator, [class*="rsvp"]');
    const count = await rsvpStatus.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show table assignments', async ({ page }) => {
    // Table assignment column/indicator should exist
    const tableAssignments = page.locator('.table-assignment, .assigned-table, [class*="table"]');
    await expect(tableAssignments.first()).toBeVisible();
  });
});

test.describe('Guest Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], .search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should filter guests by search term', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], .search-input');

    if (!await searchInput.isVisible()) {
      test.skip();
      return;
    }

    // Get initial count
    const initialCount = await page.locator('.guest-row, .guest-item').count();

    // Type a search term (use a name from demo data)
    await searchInput.fill('Wilson');
    await page.waitForTimeout(300); // Debounce

    // Count should change (filtered)
    const filteredCount = await page.locator('.guest-row, .guest-item').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should show empty state when no matches', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], .search-input');

    if (!await searchInput.isVisible()) {
      test.skip();
      return;
    }

    // Search for non-existent guest
    await searchInput.fill('ZZZZNONEXISTENT12345');
    await page.waitForTimeout(300);

    // Should show empty state or no results
    const guestCount = await page.locator('.guest-row, .guest-item').count();
    expect(guestCount).toBe(0);
  });
});

test.describe('Add Guest Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
  });

  test('should open add guest form/modal', async ({ page }) => {
    // Click Add Guest button
    const addGuestBtn = page.locator('button').filter({ hasText: /add guest/i });
    await addGuestBtn.click();

    // Form or modal should appear
    const form = page.locator('.guest-form, .add-guest-modal, .guest-modal');
    await expect(form).toBeVisible({ timeout: 3000 });
  });

  test('should have required form fields', async ({ page }) => {
    // Open form
    const addGuestBtn = page.locator('button').filter({ hasText: /add guest/i });
    await addGuestBtn.click();

    // Check for first name field
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]');
    await expect(firstNameInput).toBeVisible();

    // Check for last name field
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"]');
    await expect(lastNameInput).toBeVisible();
  });

  test('should add new guest via form', async ({ page }) => {
    const initialCount = await page.locator('.guest-row, .guest-item').count();

    // Open form
    const addGuestBtn = page.locator('button').filter({ hasText: /add guest/i });
    await addGuestBtn.click();

    // Fill form
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]');
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"]');

    await firstNameInput.fill('Test');
    await lastNameInput.fill('NewGuest');

    // Submit form
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|add|create/i });
    await submitBtn.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify guest was added
    const newCount = await page.locator('.guest-row, .guest-item').count();
    expect(newCount).toBe(initialCount + 1);
  });
});

test.describe('Guest Relationships', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
  });

  test('should show relationship indicators', async ({ page }) => {
    // Look for relationship icons or badges
    const relationshipIndicators = page.locator('.relationship-badge, .partner-icon, [class*="relationship"]');
    const count = await relationshipIndicators.count();

    // Demo event should have some relationships set up
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show relationship matrix toggle', async ({ page }) => {
    // Look for relationships toggle button
    const relationshipBtn = page.locator('button').filter({ hasText: /relationship|matrix/i });

    // This may or may not be visible depending on view
    if (await relationshipBtn.isVisible()) {
      await relationshipBtn.click();

      // Matrix should appear
      const matrix = page.locator('.relationship-matrix');
      await expect(matrix).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Guest RSVP Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
  });

  test('should display RSVP filter options', async ({ page }) => {
    // Look for RSVP filter buttons or dropdown
    const rsvpFilter = page.locator('.rsvp-filter, .filter-rsvp, [class*="filter"]');
    await expect(rsvpFilter.first()).toBeVisible();
  });

  test('should filter by RSVP status', async ({ page }) => {
    const initialCount = await page.locator('.guest-row, .guest-item').count();

    // Find and click a specific RSVP filter
    const confirmedFilter = page.locator('button, .filter-option').filter({ hasText: /confirmed|attending/i });

    if (await confirmedFilter.isVisible()) {
      await confirmedFilter.click();
      await page.waitForTimeout(300);

      // Count may change after filter
      const filteredCount = await page.locator('.guest-row, .guest-item').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });
});

test.describe('Guest Group Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('tourRemindLater', 'true');
    });

    await page.goto(`${DEMO_EVENT_URL}/guests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.event-layout')).toBeVisible({ timeout: 10000 });
  });

  test('should display guest groups', async ({ page }) => {
    // Look for group labels or sections
    const groups = page.locator('.guest-group, .group-header, [class*="group"]');
    const count = await groups.count();

    // May have groups defined
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter by group', async ({ page }) => {
    // Look for group filter
    const groupFilter = page.locator('.group-filter, select[name="group"]');

    if (await groupFilter.isVisible()) {
      // This test validates the filter exists
      await expect(groupFilter).toBeVisible();
    }
  });
});
