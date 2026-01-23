# iOS Workflow Findings - next-migration Branch

**Timestamp:** 2026-01-17T21:45:00Z
**Branch:** cherry-pick/ios-mobile-ux (based on next-migration)
**Test URL:** https://seatify-git-next-migration-jermwatts-projects.vercel.app
**Device:** Seatify-Workflow-iPhone16 (iOS 18.6)

---

## Summary

The next-migration branch is **missing iOS HIG compliance improvements** that were merged to main (PRs 104-108). These need to be ported to this branch.

---

## Issues Found

### Issue 1: Hamburger Menu Instead of Gear Icon (HIGH)

**Location:** Landing page header (top-right)
**iOS Anti-Pattern:** Hamburger menu icon (☰) for settings
**Problem:**
- The hamburger icon implies navigation/menu
- But it opens Settings content (Version, Theme, What's New)
- iOS users expect a gear icon (⚙️) for settings

**iOS-Native Solution:** Replace hamburger with gear icon
**Reference:** This was fixed in PR #108 on main branch

---

### Issue 2: Floating Action Button (FAB) on Canvas (HIGH)

**Location:** Canvas view (bottom-right)
**iOS Anti-Pattern:** Material Design FAB with speed dial
**Problem:**
- FAB is a Material Design pattern, not iOS
- The speed dial expansion is also Material Design
- iOS users don't expect this interaction pattern

**iOS-Native Solution:**
- Use an action sheet (slides up from bottom)
- Or use toolbar buttons at bottom of screen
- Or use navigation bar buttons

**Reference:** This was fixed in PR #105 on main branch

---

### Issue 3: Logo Styling Inconsistency (MEDIUM)

**Location:** Landing page, login page
**Problem:** The "Seatify" logo styling may not match the fully cursive branding

**Reference:** This was fixed in PR #104 on main branch

---

## Comparison with Main Branch

| Feature | Main (seatify.app) | next-migration |
|---------|-------------------|----------------|
| Settings icon | Gear (⚙️) | Hamburger (☰) |
| Canvas add actions | iOS-style | FAB + speed dial |
| Logo | Fully cursive | Partial cursive |
| Checkboxes | iOS toggles | Needs verification |
| Touch targets | Optimized | Needs verification |

---

## Recommended Actions

1. **Port iOS styling changes from main to next-migration:**
   - Apply gear icon change (PR #108)
   - Apply iOS HIG compliance changes (PR #105)
   - Apply toggle/checkbox changes (PR #106)
   - Apply toolbar overflow fixes (PR #107)
   - Apply cursive logo changes (PR #104)

2. **Since cherry-picking caused conflicts (Vite vs Next.js architecture), manual porting is required:**
   - Identify equivalent components in Next.js app
   - Apply the same styling/UX patterns
   - Test on iOS Simulator

---

## Screenshots Captured

- Landing page with hamburger menu
- Canvas with FAB
- FAB speed dial expanded
- Settings popup from hamburger menu

---

## Next Steps

- [ ] Manually apply iOS HIG fixes to Next.js components
- [ ] Re-test on iOS Simulator
- [ ] Create PR to next-migration
