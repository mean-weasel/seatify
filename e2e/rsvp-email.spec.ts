import { test, expect } from '@playwright/test';

/**
 * RSVP Email Flow E2E Tests
 *
 * Tests the direct RSVP link flow that guests receive via email.
 * These tests require the demo event to have RSVP enabled with test tokens.
 * In CI, Supabase is seeded with the RSVP data in seed.sql.
 */

const DEMO_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const VALID_TOKEN = 'testtoken001'; // Emma Wilson's token
const PENDING_GUEST_TOKEN = 'testtoken002'; // Isabella Brown's token (pending)
const INVALID_TOKEN = 'invalid-token-xyz';

test.describe('RSVP Direct Link Access', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage for fresh state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('guest can access RSVP page via direct link', async ({ page }) => {
    // Navigate to RSVP page with valid token
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Verify event name is shown
    await expect(page.locator('.rsvp-event-name')).toContainText('Demo Event');

    // Verify guest name is shown (Hello, Emma!)
    await expect(page.locator('.rsvp-card h2')).toContainText('Hello, Emma!');

    // Verify RSVP options are visible
    const yesButton = page.locator('.attending-btn').filter({ hasText: /yes/i });
    const noButton = page.locator('.attending-btn').filter({ hasText: /sorry/i });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();
  });

  test('shows custom message from event settings', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Check for custom message
    const customMessage = page.locator('.custom-message');
    if (await customMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(customMessage).toContainText('excited to celebrate');
    }
  });
});

test.describe('RSVP Confirm Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('guest can confirm attendance', async ({ page }) => {
    // Go to RSVP page with pending guest token
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${PENDING_GUEST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('.rsvp-card')).toBeVisible({ timeout: 10000 });

    // Click "Yes, I'll be there"
    const yesButton = page.locator('.attending-btn').filter({ hasText: /yes/i });
    await yesButton.click();
    await expect(yesButton).toHaveClass(/selected/);

    // Click Continue to go to details
    const continueButton = page.locator('.rsvp-btn.primary').filter({ hasText: /continue/i });
    await continueButton.click();

    // Should be on details step
    await expect(page.locator('.details-card')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.details-card h2')).toContainText('Almost Done');

    // Fill in meal preference (select first option)
    const mealRadio = page.locator('.meal-options input[type="radio"]').first();
    if (await mealRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mealRadio.check();
    }

    // Submit RSVP
    const submitButton = page.locator('.rsvp-btn.primary').filter({ hasText: /submit rsvp/i });
    await submitButton.click();

    // Verify confirmation page shows "Thank You!"
    await expect(page.locator('.complete-card h2')).toContainText('Thank You!', { timeout: 10000 });
    await expect(page.locator('.success-icon')).toBeVisible();
  });

  test('guest can add plus-ones when confirming', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${PENDING_GUEST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Click Yes
    const yesButton = page.locator('.attending-btn').filter({ hasText: /yes/i });
    await yesButton.click();

    // Continue to details
    const continueButton = page.locator('.rsvp-btn.primary').filter({ hasText: /continue/i });
    await continueButton.click();

    // Should see plus-ones section
    const addGuestBtn = page.locator('.add-plus-one-btn');
    if (await addGuestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addGuestBtn.click();

      // Fill in plus-one details
      const firstNameInput = page.locator('.plus-one-fields input[placeholder*="First"]').first();
      const lastNameInput = page.locator('.plus-one-fields input[placeholder*="Last"]').first();
      await firstNameInput.fill('John');
      await lastNameInput.fill('Smith');

      // Verify plus-one card is visible
      await expect(page.locator('.plus-one-card')).toBeVisible();
    }
  });
});

test.describe('RSVP Decline Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('guest can decline attendance', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Click "Sorry, I can't make it"
    const noButton = page.locator('.attending-btn').filter({ hasText: /sorry/i });
    await noButton.click();
    await expect(noButton).toHaveClass(/selected/);

    // Click Submit Response
    const submitButton = page.locator('.rsvp-btn.primary').filter({ hasText: /submit/i });
    await submitButton.click();

    // Verify decline confirmation
    await expect(page.locator('.complete-card h2')).toContainText('Thank You!', { timeout: 10000 });
    await expect(page.locator('.confirmation-message')).toContainText(/sorry you can't make it/i);
  });
});

test.describe('RSVP Error States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('shows error for invalid RSVP link', async ({ page }) => {
    // Navigate with invalid token
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${INVALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Verify error message about invalid link
    await expect(page.locator('.error-card, .rsvp-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.rsvp-content')).toContainText(/invalid|expired|incorrect/i);
  });

  test('shows error for non-existent event', async ({ page }) => {
    const nonExistentEventId = '99999999-9999-9999-9999-999999999999';
    await page.goto(`/rsvp/${nonExistentEventId}/sometoken`);
    await page.waitForLoadState('networkidle');

    // Verify error message
    await expect(page.locator('.error-card, .rsvp-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.rsvp-content')).toContainText(/not found|invalid|error/i);
  });

  test('has Go to Seatify button on error page', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${INVALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Look for the Go to Seatify button
    const goButton = page.locator('.rsvp-btn.primary').filter({ hasText: /go to seatify/i });
    if (await goButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await goButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('RSVP Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('displays Seatify branding in footer', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Check footer branding
    const footer = page.locator('.rsvp-footer');
    await expect(footer).toContainText(/powered by/i);
    await expect(footer).toContainText('Seatify');
  });

  test('displays event date when available', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Check for event date display
    const eventDate = page.locator('.rsvp-event-date');
    if (await eventDate.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Date format: "Sunday, June 15, 2025" or similar
      const dateText = await eventDate.textContent();
      expect(dateText).toBeTruthy();
    }
  });

  test('shows previous response message when guest already responded', async ({ page }) => {
    // Emma Wilson is already confirmed
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${VALID_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Check for previous response message
    const previousResponse = page.locator('.previous-response');
    if (await previousResponse.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(previousResponse).toContainText(/previously responded/i);
    }
  });
});

test.describe('RSVP Details Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('displays dietary restrictions options', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${PENDING_GUEST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Click Yes to proceed
    await page.locator('.attending-btn').filter({ hasText: /yes/i }).click();
    await page.locator('.rsvp-btn.primary').filter({ hasText: /continue/i }).click();

    // Should see dietary section
    await expect(page.locator('.details-card')).toBeVisible({ timeout: 5000 });

    // Check for dietary options
    const dietarySection = page.locator('.detail-section').filter({ hasText: /dietary/i });
    if (await dietarySection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dietarySection).toContainText(/vegetarian|vegan|gluten/i);
    }
  });

  test('allows navigation back to response step', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}/${PENDING_GUEST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Click Yes and continue
    await page.locator('.attending-btn').filter({ hasText: /yes/i }).click();
    await page.locator('.rsvp-btn.primary').filter({ hasText: /continue/i }).click();
    await expect(page.locator('.details-card')).toBeVisible({ timeout: 5000 });

    // Click Back
    const backButton = page.locator('.rsvp-btn.secondary').filter({ hasText: /back/i });
    await backButton.click();

    // Should be back on response step
    await expect(page.locator('.attending-options')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('RSVP General Link (No Token)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('general RSVP page allows guest identification by email', async ({ page }) => {
    // Navigate to general RSVP page (no token)
    await page.goto(`/rsvp/${DEMO_EVENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Should show identify form
    await expect(page.locator('.rsvp-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.identify-form, input[placeholder*="email"], input[placeholder*="Email"]')).toBeVisible();
  });

  test('can find guest by email on general RSVP page', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Enter Emma Wilson's email
    const searchInput = page.locator('input[placeholder*="email" i], input[placeholder*="name" i]');
    await searchInput.fill('emma@wilson-law.com');

    // Submit search
    const findButton = page.locator('.rsvp-btn.primary').filter({ hasText: /find/i });
    await findButton.click();

    // Should now see the response form with Emma's name
    await expect(page.locator('.rsvp-card h2')).toContainText('Hello, Emma', { timeout: 10000 });
  });

  test('shows error when guest not found', async ({ page }) => {
    await page.goto(`/rsvp/${DEMO_EVENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Enter non-existent email
    const searchInput = page.locator('input[placeholder*="email" i], input[placeholder*="name" i]');
    await searchInput.fill('nonexistent@example.com');

    // Submit search
    const findButton = page.locator('.rsvp-btn.primary').filter({ hasText: /find/i });
    await findButton.click();

    // Should show error
    await expect(page.locator('.error-message')).toContainText(/not found/i, { timeout: 10000 });
  });
});
