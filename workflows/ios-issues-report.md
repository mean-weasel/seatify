# iOS Workflow Testing - Issues Report

> Tested on: iPhone 16 Simulator
> Date: 2026-01-14
> App Version: v0.10.0

---

## Summary

**Critical Issues Found:** 5
**Minor Issues Found:** 4
**Documentation Issues:** 2

---

## Critical iOS Convention Violations

### 1. Hamburger Menu Throughout App
- **Severity:** Critical
- **Location:** All pages (landing, events, canvas header)
- **iOS Requirement:** "Tab bar for primary navigation (not hamburger menu)"
- **Current:** Uses hamburger menu (☰) icon in top-right corner
- **Fix:** Replace with iOS tab bar at bottom of screen with icons for: Events, Canvas, Guests, Settings

### 2. No Tab Bar Navigation
- **Severity:** Critical
- **Location:** Entire app
- **iOS Requirement:** Primary navigation should use tab bar
- **Current:** No tab bar exists; navigation relies on hamburger menu
- **Fix:** Add iOS-style tab bar with 4-5 primary destinations

### 3. Web-Style Modal Presentation
- **Severity:** Critical
- **Location:** Create Event modal, likely other modals
- **iOS Requirement:** "Modals slide up from bottom"
- **Current:** Modals appear centered like web dialogs
- **Fix:** Use iOS-style bottom sheet presentation with drag-to-dismiss

### 4. Web-Style Form Controls
- **Severity:** Critical
- **Location:** Create Event form
- **Issues:**
  - Event Type uses HTML `<select>` dropdown with chevron
  - Event Date uses web date input (`mm/dd/yyyy` placeholder)
- **iOS Requirement:** "iOS-style pickers (not web dropdowns)"
- **Fix:**
  - Replace dropdown with iOS action sheet or wheel picker
  - Replace date input with iOS date picker (wheel or calendar style)

### 5. No Swipe Actions on List Items
- **Severity:** Critical
- **Location:** Event cards on dashboard
- **iOS Requirement:** Lists should use swipe-to-reveal for actions
- **Current:** Edit/Delete shown as visible buttons on cards
- **Fix:** Hide Edit/Delete, reveal via swipe-left gesture

---

## Minor iOS Convention Issues

### 6. Textarea Resize Handle
- **Severity:** Minor
- **Location:** Venue Address field in Create Event form
- **Issue:** Web-style resize grip visible in bottom-right corner
- **Fix:** Hide resize handle via CSS (`resize: none`)

### 7. Card View Toggle Style
- **Severity:** Minor
- **Location:** Events dashboard (Cards/List toggle)
- **Issue:** Uses web-style icon toggle
- **Better Pattern:** iOS segmented control style

### 8. Missing Pull-to-Refresh
- **Severity:** Minor
- **Location:** Event list
- **Issue:** No pull-to-refresh indicator (may exist but not visually tested)
- **Fix:** Add iOS-style pull-to-refresh on list views

### 9. Back Navigation
- **Severity:** Minor
- **Location:** Canvas and detail views
- **Issue:** Unable to verify swipe-back gesture support
- **Requirement:** Left edge swipe should navigate back

---

## Documentation Issues

### 10. Incorrect Base URL in Workflow File
- **Location:** `workflows/ios-workflows.md` line 5
- **Current:** `http://localhost:5173/`
- **Actual:** App runs on dynamic port (5173, 5174, or 5175 depending on availability)
- **Fix:** Update to note port may vary, or specify running `npm run dev` first

### 11. Missing App Name Consistency
- **Location:** Various
- **Issue:** Workflow doc references "Seatify" but page title showed "Party Queue" on port 5173 (different app)
- **Fix:** Ensure port 5173 is clear or use explicit port in documentation

---

## iOS Platform Verification Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| Tab bar for primary navigation | ❌ FAIL | Uses hamburger menu |
| Back button or swipe-back navigation | ⚠️ UNTESTED | Cannot verify without tap/swipe |
| No breadcrumb navigation | ✅ PASS | Not present |
| Modals slide up from bottom | ❌ FAIL | Centered web-style modals |
| All buttons at least 44x44pt | ⚠️ LIKELY PASS | CTA buttons appear adequate |
| No hover-dependent interactions | ⚠️ UNTESTED | Cannot verify without interaction |
| iOS-style pickers | ❌ FAIL | Uses web dropdowns |
| Toggle switches (not checkboxes) | ⚠️ UNTESTED | Need to verify in settings |
| iOS action sheets | ❌ FAIL | Uses web patterns |
| SF Pro or system font feel | ✅ PASS | Uses Nunito, acceptable |
| Safe area insets respected | ✅ PASS | Content within safe areas |
| NO hamburger menu | ❌ FAIL | Hamburger present |
| NO floating action button | ✅ PASS | Not present |
| NO Material Design components | ✅ PASS | Not present |

---

## Testing Limitations

The following could not be fully tested due to `idb` compatibility issues with Python 3.14:

- Tap interactions
- Swipe gestures (scroll, swipe-back, swipe-to-delete)
- Form input behavior
- Keyboard interactions
- Pinch-to-zoom on canvas
- Drag-and-drop functionality

**Recommendation:** Install `idb` with Python 3.12 or 3.13 for full interaction testing.

---

## Priority Recommendations

### High Priority (Critical for iOS native feel)
1. Add iOS tab bar navigation
2. Convert modals to bottom sheets
3. Replace web dropdowns with iOS pickers
4. Implement swipe-to-delete on list items

### Medium Priority
5. Add pull-to-refresh on lists
6. Verify swipe-back navigation works
7. Update workflow documentation with correct URLs

### Low Priority
8. Hide textarea resize handles
9. Convert Cards/List toggle to segmented control
