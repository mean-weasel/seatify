# Testing Expansion Plan for Seatify

## Executive Summary

This plan outlines the testing strategy expansion for Seatify, covering E2E tests, visual regression tests, and test infrastructure improvements.

---

## Current State Summary

**Test Framework Configuration:**
- **Unit Tests**: Vitest with jsdom, React Testing Library
- **E2E Tests**: Playwright (Chromium only in CI)
- **CI Pipeline**: GitHub Actions with lint, type-check, build, unit tests, and E2E tests
- **Database**: Local Supabase with seed data for E2E testing

**Current Test Files:**
- **Unit Tests (14 files)**: `optimizeSeating.test.ts`, `constraintViolations.test.ts`, `csvExport.test.ts`, `date.test.ts`, `qrCodeUtils.test.ts`, `shareableEventUtils.test.ts`, `events.test.ts`, `constraints.test.ts`, `profilePreferences.test.ts`, `venueElements.test.ts`, `migrateDemo.test.ts`, `usePreferencesSync.test.ts`, `useDemoGate.test.ts`, `EventListClient.test.tsx`, `ViewToggle.test.tsx`
- **E2E Tests (4 files)**: `auth.spec.ts`, `landing.spec.ts`, `demo.spec.ts`, `guests.spec.ts`

---

## E2E Test Expansion Plan

### 1. Canvas Interaction Tests (HIGH PRIORITY)

**What to test:**
- Table creation (all shapes: round, rectangle, square, oval, half-round, serpentine)
- Table positioning via drag and drop
- Table resizing and rotation
- Guest assignment to tables via drag and drop
- Seat swapping between tables
- Multi-select tables and guests
- Zoom and pan functionality
- Undo/redo operations

**Why important:**
The canvas is the core feature of Seatify. Any regression in drag-and-drop or positioning would severely impact user experience.

**Implementation approach:**
```typescript
// e2e/canvas.spec.ts
test.describe('Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/events/00000000-0000-0000-0000-000000000001/canvas');
    await page.waitForSelector('.event-layout');
  });

  test('should create and position a round table', async ({ page }) => {
    // Click add table button
    // Verify table appears on canvas
    // Drag table to new position
    // Verify position updated
  });

  test('should drag guest to table', async ({ page }) => {
    // Find unassigned guest in sidebar
    // Drag to table
    // Verify guest appears at table
  });
});
```

**Estimated effort:** 3-4 days

---

### 2. Guest Management Tests (HIGH PRIORITY)

**What to test:**
- Add single guest via form
- Bulk import guests (CSV upload)
- Edit guest details
- Delete guest
- Filter and search guests
- RSVP status changes
- Group assignment
- Relationship management (partner, family, avoid)

**Why important:**
Guest data is fundamental to the application. Import functionality is complex and error-prone.

**Implementation approach:**
```typescript
// e2e/guest-management.spec.ts
test.describe('Guest Management', () => {
  test('should add a new guest', async ({ page }) => {
    await page.goto('/dashboard/events/.../guests');
    await page.click('[data-testid="add-guest-btn"]');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Guest');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Guest')).toBeVisible();
  });

  test('should import CSV with guests', async ({ page }) => {
    // Upload CSV file
    // Map columns
    // Preview data
    // Complete import
    // Verify guests added
  });
});
```

**Estimated effort:** 2-3 days

---

### 3. Optimize Seating E2E Tests (MEDIUM PRIORITY)

**What to test:**
- Run optimization with various guest configurations
- Verify partners seated together
- Verify avoid relationships respected
- Verify constraints applied
- Animation and result display

**Why important:**
Core differentiating feature; complex logic that could regress.

**Implementation approach:**
```typescript
// e2e/optimize.spec.ts
test.describe('Seating Optimization', () => {
  test('should optimize seating and seat partners together', async ({ page }) => {
    await page.goto('/demo');
    // Clear existing assignments
    // Run optimize
    // Verify Emma & James Wilson are at same table
  });
});
```

**Estimated effort:** 1-2 days

---

### 4. Export Functionality Tests (MEDIUM PRIORITY)

**What to test:**
- Export guest list to CSV
- Generate PDF seating chart
- Share link generation
- QR code generation for tables

**Why important:**
Data export is critical for users planning real events.

**Implementation approach:**
```typescript
// e2e/export.spec.ts
test.describe('Export Features', () => {
  test('should export CSV with correct headers', async ({ page }) => {
    // Navigate to guest list
    // Click export CSV
    // Verify download triggered
  });

  test('should generate shareable link', async ({ page }) => {
    // Open share modal
    // Generate link
    // Verify link is valid
  });
});
```

**Estimated effort:** 1-2 days

---

### 5. Authenticated User Flow Tests (HIGH PRIORITY)

**What to test:**
- Full signup flow with email
- Login with existing account
- Create new event
- Switch between events
- Delete event
- Logout

**Why important:**
Auth flows are critical; any issues block user access entirely.

**Implementation approach:**
```typescript
// e2e/authenticated-flows.spec.ts
test.describe('Authenticated User Flows', () => {
  const testEmail = `test-${Date.now()}@example.com`;

  test('should complete full signup flow', async ({ page }) => {
    await page.goto('/signup');
    // Fill form and submit
    // Verify redirect to dashboard
  });

  test('should create and manage events', async ({ page }) => {
    // Login
    // Create event
    // Verify event appears in list
    // Delete event
  });
});
```

**Estimated effort:** 2 days

---

### 6. Mobile Responsiveness E2E Tests (MEDIUM PRIORITY)

**What to test:**
- Landing page on mobile viewport
- Canvas navigation with touch gestures
- Mobile bottom sheet interactions
- Hamburger menu navigation
- FAB (Floating Action Button) interactions

**Why important:**
Mobile users are a significant segment; mobile UX differs significantly from desktop.

**Implementation approach:**
```typescript
// e2e/mobile.spec.ts
import { devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 14'] });

  test('should show mobile-optimized landing page', async ({ page }) => {
    await page.goto('/');
    // Verify mobile layout
    // Check hamburger menu works
  });

  test('should navigate canvas with gestures', async ({ page }) => {
    await page.goto('/demo');
    // Test pinch-to-zoom
    // Test pan gestures
    // Test bottom sheet
  });
});
```

**Estimated effort:** 2-3 days

---

### 7. Constraint Violation UI Tests (LOW PRIORITY)

**What to test:**
- Violation indicators on tables
- Violation panel display
- Auto-resolve suggestions

**Why important:**
Helps users fix seating issues; complex UI state.

**Estimated effort:** 1 day

---

## Visual Regression Testing Plan

### 1. Tool Recommendation

**Recommended: Playwright Built-in Screenshots**

Reasons:
- Already using Playwright for E2E
- No additional service cost
- CI-native, simple configuration
- Sufficient for component/page-level regression

**Alternative for Future: Percy or Chromatic**
- Better for pixel-perfect comparisons
- Provides visual diffs in PR reviews
- Consider when team grows or visual consistency becomes critical

---

### 2. Key Pages/Components to Capture

| Component/Page | Breakpoints | Priority |
|---------------|-------------|----------|
| Landing page hero | Desktop (1280), Tablet (768), Mobile (375) | High |
| Demo canvas with tables | Desktop, Tablet | High |
| Guest list view | Desktop, Tablet, Mobile | High |
| Event dashboard | Desktop, Tablet | Medium |
| Signup/Login forms | Desktop, Mobile | Medium |
| Header navigation | Desktop, Mobile | Medium |
| Main toolbar | Desktop | Medium |
| Sidebar guest panel | Desktop | Medium |
| Mobile FAB menu | Mobile | Medium |
| Modal dialogs (signup, share, etc.) | Desktop, Mobile | Low |

---

### 3. Dark/Light Mode Coverage

Currently using system theme detection. Visual regression tests should capture:
- Light mode (default)
- Dark mode (via `prefers-color-scheme: dark`)

```typescript
// e2e/visual-regression.spec.ts
test.describe('Visual Regression - Light Mode', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-light.png');
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test.use({ colorScheme: 'dark' });

  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-dark.png');
  });
});
```

---

### 4. Implementation Structure

```
e2e/
  visual/
    landing.visual.spec.ts
    canvas.visual.spec.ts
    dashboard.visual.spec.ts
    mobile.visual.spec.ts
  visual.config.ts  # Shared visual test config
```

**Estimated effort:** 2-3 days for initial setup, ongoing maintenance

---

## Unit/Integration Test Expansion Plan

### 1. Missing Action Tests (HIGH PRIORITY)

**Files needing tests:**
- `src/actions/guests.ts` - CRUD operations
- `src/actions/tables.ts` - CRUD operations
- `src/actions/loadEvent.ts` - Event loading logic
- `src/actions/loadDemoEvent.ts` - Demo event loading

**Approach:** Follow existing patterns in `events.test.ts`

**Estimated effort:** 2 days

---

### 2. Component Tests (MEDIUM PRIORITY)

**Priority components:**
- `Canvas.tsx` - Core rendering logic
- `Table.tsx` - Table shape rendering
- `GuestForm.tsx` - Form validation
- `ImportWizard/` - Multi-step import flow
- `ConstraintsPanel.tsx` - Constraint management
- `DemoBanner.tsx` - Demo mode UI
- `DemoSignupModal.tsx` - Modal interactions

**Approach:**
```typescript
// src/components/GuestForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestForm } from './GuestForm';

describe('GuestForm', () => {
  it('should validate required fields', async () => {
    render(<GuestForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText(/first name is required/i)).toBeVisible();
  });
});
```

**Estimated effort:** 3-4 days

---

### 3. Hook Tests (LOW PRIORITY)

**Hooks needing tests:**
- `useResponsive.ts` - Breakpoint detection
- `useLongPress.ts` - Touch gesture handling
- `useMobileGuestPanel.ts` - Panel state management
- `useEmailCapture.ts` - Email capture flow
- `useSyncToSupabase.ts` - Data sync logic

**Estimated effort:** 1-2 days

---

### 4. Store Slice Tests (MEDIUM PRIORITY)

**Additional store logic to test:**
- Table CRUD operations
- Guest CRUD operations
- Canvas state management (zoom, pan, selection)
- Undo/redo stack

**Estimated effort:** 2 days

---

## Test Infrastructure Improvements

### 1. CI Integration Improvements

**Current Issues:**
- Single browser (Chromium only)
- Sequential worker execution in CI
- No test sharding for parallelization

**Recommendations:**

```yaml
# .github/workflows/ci.yml improvements
e2e-tests:
  strategy:
    matrix:
      shardIndex: [1, 2, 3, 4]
      shardTotal: [4]
  steps:
    - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

**Estimated effort:** 0.5 days

---

### 2. Test Data Seeding Improvements

**Current:** Single seed.sql file with demo event

**Recommendations:**
- Create test fixtures for different scenarios
- Add factory functions for test data generation
- Consider using test-specific seed scripts

```typescript
// src/test/fixtures/events.ts
export const createTestEvent = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Test Event',
  eventType: 'wedding',
  ...overrides,
});
```

**Estimated effort:** 1 day

---

### 3. Flaky Test Handling

**Strategies:**
- Implement retry logic (already configured: 2 retries in CI)
- Add explicit waits instead of fixed timeouts
- Use `networkidle` state carefully
- Create test isolation (clear localStorage before each test)

**Current good practices already in place:**
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});
```

---

### 4. Test Parallelization

**Playwright Config Updates:**
```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,  // Increase from 1
});
```

**Note:** Requires ensuring tests don't share state

**Estimated effort:** 0.5 days

---

## Priority Matrix

| Category | Test Area | Priority | Effort | Impact |
|----------|-----------|----------|--------|--------|
| E2E | Canvas Interactions | HIGH | 3-4 days | Critical |
| E2E | Guest Management | HIGH | 2-3 days | Critical |
| E2E | Authenticated Flows | HIGH | 2 days | Critical |
| Unit | Missing Action Tests | HIGH | 2 days | High |
| E2E | Optimize Seating | MEDIUM | 1-2 days | High |
| E2E | Export Functionality | MEDIUM | 1-2 days | High |
| Unit | Component Tests | MEDIUM | 3-4 days | Medium |
| Visual | Key Pages | MEDIUM | 2-3 days | Medium |
| E2E | Mobile Responsive | MEDIUM | 2-3 days | Medium |
| Unit | Store Slice Tests | MEDIUM | 2 days | Medium |
| Infra | CI Improvements | MEDIUM | 1 day | Medium |
| E2E | Constraint Violations | LOW | 1 day | Low |
| Unit | Hook Tests | LOW | 1-2 days | Low |

---

## Implementation Phases

### Phase 1 (Week 1-2): Critical Path Coverage
- Canvas interaction E2E tests
- Guest management E2E tests
- Authenticated flow E2E tests
- Missing action unit tests

### Phase 2 (Week 3-4): Core Feature Coverage
- Optimize seating E2E tests
- Export functionality E2E tests
- Component unit tests
- CI improvements

### Phase 3 (Week 5-6): Polish & Expansion
- Visual regression tests
- Mobile E2E tests
- Store slice tests
- Remaining hook tests

---

## Success Criteria

- [ ] All critical user flows covered by E2E tests
- [ ] Visual regression baseline established for key pages
- [ ] CI runs tests in parallel with sharding
- [ ] Test execution time < 10 minutes in CI
- [ ] Flaky test rate < 2%
- [ ] Code coverage > 50%
