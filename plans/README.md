# Seatify Production Readiness Plan

## Overview

This directory contains detailed implementation plans to bring Seatify to production readiness. The plans are organized by priority and should be executed in order.

## Current Status

- **Overall Readiness:** 🟡 NOT PRODUCTION READY
- **Estimated Total Effort:** 2-3 weeks
- **Test Coverage:** 200 tests across 11 test files (significantly improved)

## Plan Index

| # | Plan | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 1 | [Critical Data Integrity](./01-critical-data-integrity.md) | 🔴 Critical | 1-2 days | ✅ Complete |
| 2 | [Test Coverage](./02-test-coverage.md) | 🔴 Critical | 3-5 days | ✅ Complete |
| 3 | [Infrastructure & Polish](./03-infrastructure-polish.md) | 🟠 High | 1-2 days | ✅ Complete |
| 4 | [Feature Completion](./04-feature-completion.md) | 🟡 Medium | 3-5 days | Not Started |

## Issue Summary

### 🔴 Critical Issues (4)
1. Constraint guest IDs not loading from database
2. No server actions for constraints/venue elements/surveys
3. Survey system has no database tables
4. Seating optimization algorithm has ZERO tests

### 🟠 High Priority Issues (6)
5. Bidirectional relationships not loaded properly
6. Test coverage at ~4%
7. `near_front` and `accessibility` constraints not implemented
8. Missing `updateConstraint` store method
9. No dependency vulnerability scanning
10. No `.nvmrc` file for Node version

### 🟡 Medium Priority Issues (5)
11. Console.log statements in production code
12. 53 ESLint warnings
13. Missing index on `guest_profiles.guest_id`
14. Cookie handling bug in middleware
15. E2E tests only cover Chromium

### 🔵 Low Priority Issues (3)
16. No generated Supabase types
17. Missing `metadataBase` in layout
18. No real-time sync

## Execution Order

```
Week 1:
├── Phase 1: Critical Data Integrity (Days 1-2)
│   ├── Fix constraint guestIds loading
│   ├── Create constraints server actions
│   ├── Create venue elements server actions
│   ├── Fix bidirectional relationships
│   └── Add survey database tables
│
└── Phase 2: Test Coverage - Part 1 (Days 3-5)
    ├── optimizeSeating() tests
    └── Server action tests

Week 2:
├── Phase 2: Test Coverage - Part 2 (Days 1-2)
│   ├── CSV export/import tests
│   └── Constraint violation tests
│
├── Phase 3: Infrastructure & Polish (Days 3-4)
│   ├── Add Dependabot
│   ├── Add .nvmrc
│   ├── Fix ESLint warnings
│   └── Remove console.logs
│
└── Phase 4: Feature Completion (Days 5+)
    ├── Implement spatial constraints
    ├── Create survey server actions
    └── Add updateConstraint method
```

## How to Use These Plans

1. Read the plan file for the current phase
2. Each plan contains:
   - Detailed problem description
   - Step-by-step implementation guide
   - File locations and code snippets
   - Verification steps
   - Acceptance criteria
3. Mark tasks as complete as you go
4. Run tests after each major change
5. Create a PR for each completed phase

## Verification Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/actions/constraints.test.ts

# Run build to check for errors
npm run build

# Run linting
npm run lint

# Check types
npx tsc --noEmit
```

## Success Criteria

The app is production ready when:
- [ ] All critical issues are resolved
- [ ] Test coverage is above 40%
- [ ] All CI checks pass
- [ ] No console.log statements in production code
- [ ] All ESLint warnings are resolved
- [ ] Constraints, venue elements, and surveys persist to database
- [ ] Seating optimization algorithm is thoroughly tested
