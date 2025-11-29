# Mobile Responsive Mockup Implementation Plan

## Overview and Goals

Transform the SeatOptima application into a fully responsive, touch-optimized experience across mobile, tablet, and desktop devices.

### Key Goals
1. Implement responsive breakpoint system (mobile: <768px, tablet: 768-1024px, desktop: >1024px)
2. Create collapsible/slide-out sidebar for mobile
3. Add bottom navigation bar for mobile (replacing header tabs)
4. Enable touch-friendly table manipulation with pinch-to-zoom
5. Implement swipeable guest cards
6. Add floating action button (FAB) for quick actions
7. Design mobile-optimized guest assignment workflow

---

## Responsive Breakpoints

```css
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-tablet: 1024px;
  --touch-target-min: 44px;
  --touch-target-comfortable: 48px;
}

/* Mobile-first base styles */
/* Tablet and up */
@media (min-width: 768px) { ... }
/* Desktop and up */
@media (min-width: 1024px) { ... }
/* Touch device detection */
@media (hover: none) and (pointer: coarse) { ... }
```

---

## Component Changes

### 1. Mobile Header (Compact)

**Current:** Full horizontal layout with logo, nav tabs, action buttons

**Mobile Changes:**
- Logo only
- Hamburger menu icon (opens sidebar)
- Simple action menu (three dots)

### 2. Bottom Navigation Bar (Mobile Only)

```tsx
<nav className="bottom-nav">
  <button className="bottom-nav-item">
    <span className="icon">Floor Plan</span>
  </button>
  <button className="bottom-nav-item">
    <span className="icon">Guests</span>
    <span className="badge">{unassignedCount}</span>
  </button>
  <button className="bottom-nav-item">
    <span className="icon">Optimize</span>
  </button>
</nav>
```

Features:
- Fixed to bottom
- Safe area padding for notched devices
- Active state indicator
- Badge for unassigned count

### 3. Collapsible/Slide-out Sidebar

**Mobile Behavior:**
- Full-screen overlay drawer (slides from left)
- Swipe to close gesture
- Semi-transparent backdrop
- Contains event settings

### 4. Touch-Friendly Canvas

**Mobile Additions:**
- Pinch-to-zoom gesture
- Two-finger pan
- Double-tap to zoom in/reset
- Long-press on table to select
- Visual zoom level indicator

Using `@use-gesture/react`:
```tsx
const bind = useGesture({
  onPinch: ({ offset: [scale] }) => setZoom(scale),
  onDrag: ({ delta: [dx, dy] }) => setPan(panX + dx, panY + dy),
  onDoubleClick: () => toggleZoom()
});
```

### 5. Swipeable Guest Cards

```tsx
<GuestCardCarousel>
  {unassignedGuests.map(guest => (
    <CarouselCard key={guest.id}>
      <GuestCard guest={guest} expanded />
    </CarouselCard>
  ))}
</GuestCardCarousel>
```

Features:
- Horizontal swipe navigation
- Dot indicators
- Counter display
- Touch gesture handling

### 6. Floating Action Button (FAB)

```tsx
<FloatingActionButton>
  {activeView === 'canvas' ? (
    <>
      <FabAction icon="⭕" label="Round Table" />
      <FabAction icon="▭" label="Rectangle" />
      <FabAction icon="⬜" label="Square" />
    </>
  ) : (
    <>
      <FabAction icon="👤" label="Add Guest" />
      <FabAction icon="📋" label="Import CSV" />
    </>
  )}
</FloatingActionButton>
```

Features:
- Context-aware actions
- Expand/collapse animation
- Backdrop on expand
- Position above bottom nav

### 7. Mobile-Optimized Guest Assignment

**Two-tap assignment flow:**
1. Tap on table to select (shows "Tap a guest to assign")
2. Tap on guest to assign
3. Visual confirmation animation

```typescript
interface MobileAssignmentState {
  mobileAssignMode: boolean;
  selectedTableForAssignment: string | null;
}
```

---

## File Structure

```
src/
├── components/
│   ├── BottomNav.tsx              # NEW
│   ├── BottomNav.css              # NEW
│   ├── FloatingActionButton.tsx   # NEW
│   ├── FloatingActionButton.css   # NEW
│   ├── GuestCardCarousel.tsx      # NEW
│   ├── GuestCardCarousel.css      # NEW
│   ├── Header.tsx                 # MODIFY
│   ├── Header.css                 # MODIFY
│   ├── Sidebar.tsx                # MODIFY
│   ├── Sidebar.css                # MODIFY
│   ├── Canvas.tsx                 # MODIFY
│   └── Canvas.css                 # MODIFY
├── hooks/
│   └── useMediaQuery.ts           # NEW
└── store/
    └── useStore.ts                # MODIFY
```

---

## New Dependencies

```json
{
  "dependencies": {
    "@use-gesture/react": "^10.3.0",
    "react-swipeable": "^7.0.1"
  }
}
```

---

## Custom Hooks

```typescript
// useMediaQuery.ts
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsTouchDevice = () => useMediaQuery('(hover: none) and (pointer: coarse)');
```

---

## Updated App Structure

```tsx
function App() {
  const { activeView } = useStore();
  const isMobile = useIsMobile();

  return (
    <div className={`app ${isMobile ? 'mobile' : ''}`}>
      <Header />

      <div className="main-content">
        {activeView === 'canvas' && (
          <>
            <Sidebar />
            <Canvas />
          </>
        )}
        {activeView === 'guests' && isMobile && <GuestCardCarousel />}
        {activeView === 'optimize' && <OptimizeView />}
      </div>

      {isMobile && (
        <>
          <BottomNav />
          <FloatingActionButton />
        </>
      )}
    </div>
  );
}
```

---

## CSS Responsive Patterns

### Mobile Sidebar
```css
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    width: 85vw;
    max-width: 340px;
    height: 100dvh;
    transform: translateX(-100%);
    z-index: 70;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }
}
```

### Mobile Canvas
```css
@media (max-width: 767px) {
  .canvas-container {
    height: calc(100dvh - 56px - 64px);
  }

  .toolbar-group button {
    min-width: 44px;
    min-height: 44px;
  }
}
```

### Bottom Nav
```css
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (max-width: 767px) {
  .bottom-nav {
    display: flex;
  }
}
```

---

## Implementation Steps

| Step | Description |
|------|-------------|
| 1 | Add CSS variables for breakpoints and touch targets |
| 2 | Create useMediaQuery hook |
| 3 | Implement mobile Header with hamburger |
| 4 | Create BottomNav component |
| 5 | Convert Sidebar to slide-out drawer |
| 6 | Add pinch-to-zoom to Canvas |
| 7 | Create GuestCardCarousel |
| 8 | Implement FloatingActionButton |
| 9 | Add mobile assignment mode |
| 10 | Update all components with responsive CSS |
| 11 | Test on various device sizes |

---

## Device Testing Matrix

- iPhone SE (375px)
- iPhone 14 Pro (390px)
- iPhone 14 Pro Max (430px)
- iPad Mini (768px)
- iPad Pro 11" (834px)
- iPad Pro 12.9" (1024px)

---

## Accessibility

- All touch targets >= 44px
- Focus states visible
- Screen reader announcements
- Reduced motion preference respected
