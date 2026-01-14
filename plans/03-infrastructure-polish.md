# Phase 3: Infrastructure & Polish

**Priority:** 🟠 High
**Estimated Effort:** 1-2 days
**Status:** ✅ Complete

## Overview

This phase addresses infrastructure improvements, code quality, and CI/CD enhancements that improve developer experience and production reliability.

---

## Task 3.1: Add Dependabot Configuration

### Problem
No automated dependency vulnerability scanning. Security issues in npm packages may go undetected.

### Solution

**File:** `.github/dependabot.yml` (NEW FILE)

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Los_Angeles"
    open-pull-requests-limit: 10
    commit-message:
      prefix: "chore(deps)"
    labels:
      - "dependencies"
      - "automated"
    # Group minor/patch updates to reduce PR noise
    groups:
      minor-and-patch:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    commit-message:
      prefix: "chore(ci)"
    labels:
      - "ci"
      - "automated"
```

### Acceptance Criteria
- [ ] Dependabot config file created
- [ ] Weekly npm dependency updates enabled
- [ ] GitHub Actions updates enabled
- [ ] PR grouping configured to reduce noise

---

## Task 3.2: Add Node Version File

### Problem
CI uses Node 20, but no `.nvmrc` file enforces this locally. Developers might use different Node versions.

### Solution

#### Step 1: Create .nvmrc

**File:** `.nvmrc` (NEW FILE)

```
20
```

#### Step 2: Add engines to package.json

**File:** `package.json`

Add after "name" field:

```json
{
  "name": "seatify-next",
  "version": "0.1.0",
  "engines": {
    "node": ">=20.0.0"
  },
  ...
}
```

### Acceptance Criteria
- [ ] `.nvmrc` file created with version 20
- [ ] `engines` field added to package.json
- [ ] `nvm use` works in project directory

---

## Task 3.3: Fix ESLint Warnings

### Problem
53 ESLint warnings exist. 32 are auto-fixable unescaped entities.

### Solution

#### Step 1: Auto-fix what's possible

```bash
npm run lint -- --fix
```

This will fix 32 unescaped entity warnings automatically.

#### Step 2: Manually fix remaining warnings

**Unused Variables (7):**

Find and remove or use these variables:
1. `response` - Remove if unused
2. `router` - Remove if unused
3. `fireEvent` - Remove unused import
4. `NextLinkProps` - Remove or use
5. Others - Check each file

**React Hook Dependencies (1):**

**File:** `src/components/MainToolbar.tsx:134`

Fix the useCallback dependency:
```typescript
// Before
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // uses 'event' but it's not in deps
}, []);

// After - add missing dependency
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // ...
}, [event]); // Add 'event' to deps if used
```

**Explicit Any (2):**

These are intentional for migration but should be documented:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

### Verification

```bash
npm run lint
# Should output: 0 errors, 0 warnings
```

### Acceptance Criteria
- [ ] Run `npm run lint -- --fix`
- [ ] Manually fix remaining warnings
- [ ] Lint passes with 0 warnings
- [ ] No `// eslint-disable` comments added

---

## Task 3.4: Remove Console.log Statements

### Problem
Debug logging left in production code at:
- `src/store/useStore.ts:2168`
- `src/store/useStore.ts:2174`
- `src/store/useStore.ts:2187`

### Solution

**File:** `src/store/useStore.ts`

Remove or conditionally wrap these lines:

```typescript
// Option 1: Remove entirely (recommended)
// Delete lines 2168, 2174, 2187

// Option 2: Wrap in development check
if (process.env.NODE_ENV === 'development') {
  console.log('Optimization complete:', { ... });
}
```

### Verification

```bash
# Search for console.log in source
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v test
# Should return empty or only intentional logs
```

### Acceptance Criteria
- [ ] All debug console.log removed from store
- [ ] No unintentional console output in production
- [ ] Build and tests still pass

---

## Task 3.5: Add metadataBase to Layout

### Problem
Build warning: "metadataBase property in metadata export is not set for resolving social open graph or twitter images"

### Solution

**File:** `src/app/layout.tsx`

Update the metadata export:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://seatify.app'
  ),
  title: {
    default: 'Seatify - Smart Seating Arrangements Made Easy',
    template: '%s | Seatify',
  },
  description: 'Create beautiful seating plans with drag-and-drop simplicity.',
  openGraph: {
    title: 'Seatify',
    description: 'Smart seating chart maker for weddings and events',
    url: 'https://seatify.app',
    siteName: 'Seatify',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seatify',
    description: 'Smart seating chart maker for weddings and events',
  },
};
```

### Acceptance Criteria
- [ ] metadataBase set in layout.tsx
- [ ] Build warning resolved
- [ ] OG images resolve correctly

---

## Task 3.6: Add Missing Database Index

### Problem
`guest_profiles.guest_id` has no index, causing slow lookups.

### Solution

**File:** `supabase/schema.sql`

Add after the guest_profiles table definition:

```sql
-- Add missing index for guest_profiles
CREATE INDEX IF NOT EXISTS idx_guest_profiles_guest_id
  ON public.guest_profiles(guest_id);
```

Run in Supabase SQL editor or via migration.

### Acceptance Criteria
- [ ] Index added to schema.sql
- [ ] Index created in production database
- [ ] Query performance improved

---

## Task 3.7: Fix Cookie Handling in Middleware

### Problem
In `src/lib/supabase/middleware.ts:27`, `request.cookies.set()` doesn't properly persist cookie options.

### Solution

**File:** `src/lib/supabase/middleware.ts`

Remove the problematic line:

```typescript
// Before (around line 27)
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value, options }) => {
    request.cookies.set(name, value); // This line is ineffective
  });
  // ...
}

// After - just set on response
setAll(cookiesToSet) {
  // Remove request.cookies.set - it doesn't work properly
  // Only response cookies persist
  supabaseResponse = NextResponse.next({
    request,
  });
  cookiesToSet.forEach(({ name, value, options }) => {
    supabaseResponse.cookies.set(name, value, options);
  });
}
```

### Acceptance Criteria
- [ ] Problematic line removed
- [ ] Session refresh still works
- [ ] Auth flow tested and working

---

## Task 3.8: Add Workflow Concurrency Control

### Problem
Multiple concurrent CI runs on same branch could cause issues.

### Solution

**File:** `.github/workflows/ci.yml`

Add at the top level (after `on:` block):

```yaml
name: CI

on:
  push:
    branches: [main, next-migration]
  pull_request:
    branches: [main, next-migration]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ... existing jobs
```

### Acceptance Criteria
- [ ] Concurrency config added
- [ ] Duplicate runs cancelled
- [ ] PR builds use unique groups

---

## Summary Table

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| 3.1 | Infrastructure | 15 min | Security |
| 3.2 | Infrastructure | 10 min | Consistency |
| 3.3 | Code Quality | 1 hour | Maintainability |
| 3.4 | Code Quality | 15 min | Production cleanliness |
| 3.5 | Configuration | 15 min | SEO/Social |
| 3.6 | Database | 10 min | Performance |
| 3.7 | Bug Fix | 30 min | Auth reliability |
| 3.8 | CI/CD | 10 min | Build efficiency |

---

## Completion Checklist

- [ ] Task 3.1: Dependabot configuration added
- [ ] Task 3.2: .nvmrc and engines field added
- [ ] Task 3.3: All ESLint warnings fixed
- [ ] Task 3.4: Console.log statements removed
- [ ] Task 3.5: metadataBase added to layout
- [ ] Task 3.6: guest_profiles index added
- [ ] Task 3.7: Cookie handling fixed
- [ ] Task 3.8: Workflow concurrency added
- [ ] All CI checks pass
- [ ] Manually tested auth flow

## Next Phase

Once this phase is complete, proceed to [Phase 4: Feature Completion](./04-feature-completion.md).
