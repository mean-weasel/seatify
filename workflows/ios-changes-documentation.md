# iOS Human Interface Guidelines (HIG) Compliance Changes

## Executive Summary

This document details the iOS Human Interface Guidelines (HIG) compliance work performed on the Seatify app. The changes address critical platform convention violations to provide iOS users with a native experience that aligns with Apple's design standards.

**Critical Issues Fixed:** 5 (out of 5 identified)
- iOS Tab Bar Navigation (replacing hamburger menu)
- FAB (Floating Action Button) Removal
- iOS Bottom Sheet Modals (replacing centered web modals)
- iOS Action Sheet for Dropdowns (replacing HTML select)
- iOS Swipe-to-Reveal Actions (replacing always-visible buttons)

**All Critical Issues Resolved!**

---

## Before/After Comparison Table

| Before Screenshot | After Screenshot | Issue | iOS Anti-Pattern | iOS-Native Fix | Impact |
|-------------------|------------------|-------|------------------|----------------|--------|
| `01-fab-button.png` | `03-canvas-no-fab.png` | Floating Action Button on canvas | Material Design FAB is an Android pattern | Removed FAB; add actions available via Settings tab | iOS users expect navigation bar buttons or action sheets, not floating buttons |
| `02-hamburger-menu.png` | `01-ios-tab-bar-events.png`, `02-ios-tab-bar-canvas.png` | Hamburger menu for navigation | Hamburger menus hide navigation and are not native iOS | iOS Tab Bar with Events, Canvas, Guests, Settings tabs | iOS users expect persistent bottom tab bars for primary navigation |
| `03-visible-action-buttons.png` | `05-ios-swipe-actions.png` | Visible Edit/Delete buttons on cards | Buttons always visible on list items | ✅ FIXED: Swipe-to-reveal actions | iOS lists use swipe gestures to reveal contextual actions |
| `04-web-modal-dropdown.png` | `04-ios-bottom-sheet-modal.png` | Web-style centered modal | Centered modals like web dialogs | ✅ FIXED: Bottom sheet presentation | iOS modals slide up from bottom with drag handle |
| `05-web-dropdown-expanded.png` | `06-ios-action-sheet.png` | HTML select dropdown | Web-native `<select>` element | ✅ FIXED: iOS action sheet | iOS uses native picker controls, not web dropdowns |
| `06-date-picker.png` | N/A | Web date input | `mm/dd/yyyy` text input style | (Minor) Native date input retained | Native date inputs work reasonably well on iOS Safari |

---

## Detailed Changes

### Fix 1: iOS Tab Bar Navigation

**Before:** `02-hamburger-menu.png`
- App used a hamburger menu icon in the top-right header area
- Navigation was hidden behind a tap, requiring users to discover it

**After:** `01-ios-tab-bar-events.png`, `02-ios-tab-bar-canvas.png`
- iOS-style tab bar fixed at bottom of screen
- Four persistent tabs: Events, Canvas, Guests, Settings
- Each tab has an icon and label following SF Symbol conventions

#### Why This Matters for iOS Users

The iOS Human Interface Guidelines explicitly state that tab bars should be used for primary navigation in apps with multiple distinct sections. Hamburger menus:
- Hide navigation from users
- Require extra taps to access core features
- Are not a native iOS pattern (originated from Android/web)

iOS users expect:
- Tab bars at the bottom of the screen
- Persistent access to main sections
- Visual indication of current location (active tab highlighting)

#### Files Changed

**New File: `src/components/IOSTabBar.tsx`**
- Created a new React component implementing the iOS tab bar pattern
- Uses `createPortal` from React DOM to render at document body level for proper z-index handling
- Implements navigation between Events, Canvas, Guests views
- Settings tab opens the shortcuts/help modal
- Integrates with Zustand store for `activeView` state management

**New File: `src/components/IOSTabBar.css`**
- iOS-native styling with:
  - `backdrop-filter: blur(20px)` for frosted glass effect
  - `env(safe-area-inset-bottom)` for iPhone notch/home indicator support
  - 49px minimum touch targets per HIG requirements
  - Proper dark mode support with translucent backgrounds
  - SF Symbol-inspired icon sizing and spacing

**Modified: `src/router/EventLayout.tsx`**
- Added `IOSTabBar` import and component rendering
- Tab bar only renders on mobile (`isMobile` check via `useIsMobile` hook)
- Settings click handler opens keyboard shortcuts modal
- Tab bar hidden during active tours to prevent UI conflicts

**Modified: `src/components/EventListView.tsx`**
- Added `IOSTabBar` import and rendering for event list view
- Ensures tab bar is visible across all main views

**Modified: `src/components/MobileToolbarMenu.tsx`**
- Refactored to work alongside new tab bar
- Bottom navigation now uses iOS tab bar pattern with `ios-tab-bar` class
- Menu sheet functionality retained for settings and canvas tools
- Component comment updated to reflect new architecture

---

### Fix 2: FAB (Floating Action Button) Removal

**Before:** `01-fab-button.png`
- Material Design Floating Action Button visible on mobile canvas view
- FAB was positioned in bottom-right corner
- Provided quick access to "add" actions

**After:** `03-canvas-no-fab.png`
- Clean canvas without floating button
- Add actions available through Settings tab in iOS tab bar
- Also accessible via MobileCanvasToolbar

#### Why This Matters for iOS Users

Floating Action Buttons (FABs) are a Material Design pattern from Google's Android design system. They are explicitly NOT part of iOS design:
- iOS uses navigation bar buttons (top) for add/create actions
- iOS uses action sheets (bottom slide-up menus) for multiple options
- FABs can obstruct content and conflict with iOS gesture areas

iOS users expect:
- Action buttons in the navigation bar or toolbar
- Action sheets for presenting multiple choices
- No floating elements obscuring content

#### Files Changed

**Modified: `src/components/Canvas.tsx`**
- Removed `MobileFAB` component rendering in mobile immersive mode
- Added comment explaining the pattern change:
  ```tsx
  {/* Mobile FAB removed - Material Design pattern not used on iOS */}
  {/* Add actions available via Settings tab and MobileCanvasToolbar */}
  ```
- Actions remain accessible through:
  - iOS Tab Bar Settings tab
  - MobileCanvasToolbar (gesture-activated toolbar)
  - Context menu (long-press on canvas)

---

### Fix 3: iOS Bottom Sheet Modals

**Before:** `04-web-modal-dropdown.png`
- Modals appeared centered on screen like web dialogs
- No visual connection to iOS design language
- Dismissed only via close button

**After:** `04-ios-bottom-sheet-modal.png`
- Modals slide up from bottom of screen
- iOS-style drag handle at top
- Rounded top corners (16px radius)
- Safe area padding for home indicator

#### Why This Matters for iOS Users

iOS uses "sheets" for modal content - they slide up from the bottom and can be dismissed by dragging down. This pattern:
- Provides visual hierarchy (content "on top of" main view)
- Supports natural gesture-based dismissal
- Feels native to iOS users who encounter this in every native app

#### Files Changed

**Modified: `src/components/EventFormModal.css`**
- Added mobile-specific styles that transform the modal into a bottom sheet
- Key changes:
  ```css
  @media (max-width: 768px) {
    .modal-overlay { align-items: flex-end !important; }
    .event-form-modal {
      border-radius: 16px 16px 0 0;
      animation: iosSheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .event-form-modal::before { /* iOS Drag Handle */ }
  }
  ```
- Drag handle pseudo-element (36px × 5px rounded bar)
- iOS spring animation curve for natural feel
- Safe area inset padding for form actions

---

### Fix 4: iOS Action Sheet for Dropdowns

**Before:** `05-web-dropdown-expanded.png`
- HTML `<select>` element with browser-default styling
- Small touch targets
- Non-native appearance

**After:** `06-ios-action-sheet.png`
- Full-width action sheet sliding up from bottom
- Large touch targets (18px font, full-width buttons)
- Checkmark indicator for selected option
- Separate Cancel button

#### Why This Matters for iOS Users

iOS has specific patterns for presenting lists of options:
- Action sheets slide up from the bottom
- Each option is a full-width tappable row
- The selected option shows a checkmark
- Cancel is always a separate button below the options

#### Files Changed

**New File: `src/components/IOSActionSheet.tsx`**
- Reusable action sheet component
- Props: `isOpen`, `onClose`, `onSelect`, `options`, `selectedValue`, `title`
- Uses React Portal for proper z-index stacking
- Keyboard (Escape) and overlay click dismissal
- Body scroll prevention when open

**New File: `src/components/IOSActionSheet.css`**
- iOS-accurate styling:
  ```css
  .ios-action-sheet {
    animation: sheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .action-sheet-option {
    font-size: 20px; /* iOS standard */
    padding: 18px 20px;
  }
  ```
- Dark mode support with translucent backgrounds
- Rounded corners matching iOS design (14px)

**Modified: `src/components/EventFormModal.tsx`**
- Added `IOSActionSheet` import
- Conditional rendering based on `isMobile` hook
- On mobile: button triggers action sheet instead of native select
- Desktop: retains standard select element

---

### Fix 5: iOS Swipe-to-Reveal Actions

**Before:** `03-visible-action-buttons.png`
- Edit and Delete buttons always visible on event cards
- Cluttered UI on mobile
- Non-native interaction pattern

**After:** `05-ios-swipe-actions.png`
- Buttons hidden by default on mobile
- Swipe left to reveal Edit/Delete actions
- iOS-style colored action buttons (gray/red)
- Subtle swipe hint indicator on right edge

#### Why This Matters for iOS Users

iOS Mail, Notes, and most native apps use swipe gestures to reveal actions:
- Keeps the list view clean and focused on content
- Actions are "hidden but discoverable"
- Red for destructive actions (delete), gray for neutral (edit)
- Swipe right to dismiss the revealed actions

#### Files Changed

**Modified: `src/components/EventListView.tsx`**
- Added touch gesture handling:
  ```tsx
  const handleTouchStart = useCallback((e, eventId) => {
    touchStartX.current = e.touches[0].clientX;
    // ... track touch start position
  }, []);

  const handleTouchEnd = useCallback((e, eventId) => {
    const deltaX = touchStartX.current - touchEndX;
    if (deltaX > SWIPE_THRESHOLD) {
      setSwipedCardId(eventId); // Reveal actions
    }
  }, []);
  ```
- State tracking for which card has actions revealed
- Click handler prevents navigation when swiped

**Modified: `src/components/EventListView.css`**
- Actions positioned absolutely, hidden off-screen by default
- Transform animation for smooth reveal
- iOS-style action button colors:
  ```css
  .card-action-btn.edit {
    background: var(--color-text-secondary); /* Gray */
  }
  .card-action-btn.delete {
    background: var(--color-error); /* Red */
  }
  ```
- Subtle swipe hint indicator (4px × 40px bar on right edge)

---

## Technical Implementation Notes

### Portal Usage for Z-Index Handling

Both the `IOSTabBar` and `MobileToolbarMenu` components use React's `createPortal` to render their content directly to `document.body`. This ensures:
- Tab bar stays above all other content
- Menu sheets render above the canvas and other UI elements
- Proper stacking without CSS specificity battles

```tsx
// IOSTabBar.tsx
return createPortal(tabBarContent, document.body);

// MobileToolbarMenu.tsx
{menuContent && createPortal(menuContent, document.body)}
```

### CSS Considerations for iOS

**Safe Area Handling:**
```css
padding-bottom: calc(2px + env(safe-area-inset-bottom, 0px));
```
This ensures content doesn't get hidden behind the iPhone home indicator.

**iOS Blur Effect:**
```css
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
background: rgba(var(--color-bg-rgb, 255, 255, 255), 0.85);
```
The translucent blur effect is signature iOS design, used in tab bars and navigation bars.

**Touch Targets:**
```css
min-height: 49px; /* iOS minimum touch target */
-webkit-tap-highlight-color: transparent;
```
Apple requires minimum 44x44 point touch targets; we use 49px for comfortable spacing.

### Component Architecture

The iOS-specific mobile navigation follows this hierarchy:

```
EventLayout / EventListView
  |
  +-- IOSTabBar (rendered via portal)
        |
        +-- Events Tab -> /events
        +-- Canvas Tab -> /events/{id}/canvas
        +-- Guests Tab -> /events/{id}/guests
        +-- Settings Tab -> Opens shortcuts modal
```

### Responsive Behavior

The iOS tab bar only appears on mobile:
```css
@media (max-width: 768px) {
  .ios-tab-bar {
    display: flex;
  }
}
```

Desktop users continue to see the original header navigation.

---

## Remaining Work (Minor Issues Only)

All critical iOS HIG violations have been addressed. The following minor enhancements could be considered for future iterations:

### 1. Native Date Picker (Low Priority)
- **Current:** HTML date input (`<input type="date">`)
- **Enhancement:** Custom iOS wheel picker component
- **Note:** Native date inputs on iOS Safari already provide a reasonable iOS-style picker, so this is low priority

### 2. iOS Segmented Control (Low Priority)
- **Current:** Toggle buttons for Cards/List view
- **Enhancement:** iOS-style segmented control component
- **Note:** Current toggle works well; segmented control would be a visual refinement

### 3. Pull-to-Refresh (Future Enhancement)
- **Current:** No pull-to-refresh on event list
- **Enhancement:** iOS-style refresh indicator
- **Note:** Event list doesn't require frequent refreshing in typical usage

### 4. Textarea Resize Handle
- **Status:** ✅ Already fixed in EventFormModal.css
  ```css
  .event-form-modal textarea { resize: none; }
  ```

---

## Testing Verification

After implementing these changes, the following iOS convention checks now pass:

| Check | Before | After |
|-------|--------|-------|
| Tab bar for primary navigation | ❌ FAIL | ✅ PASS |
| NO hamburger menu | ❌ FAIL | ✅ PASS |
| NO floating action button | ❌ FAIL | ✅ PASS |
| NO Material Design components | ✅ PASS | ✅ PASS |
| Safe area insets respected | ✅ PASS | ✅ PASS |
| Bottom sheet modals (not centered) | ❌ FAIL | ✅ PASS |
| iOS action sheets (not HTML select) | ❌ FAIL | ✅ PASS |
| Swipe-to-reveal actions (not visible buttons) | ❌ FAIL | ✅ PASS |

**All critical iOS HIG compliance checks now pass!**

---

## References

- [Apple Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple Human Interface Guidelines - Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search)
- [Material Design - FAB](https://m3.material.io/components/floating-action-button/overview) (reference for what NOT to do on iOS)
- Original issue report: `workflows/ios-issues-report.md`
