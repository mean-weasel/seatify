# Feature: Flying Guest Animation for Optimizer

> When optimization runs, guests visually fly from their old table positions to their new positions, making it clear how violations are resolved.

## Summary

Currently, when the optimizer runs, guests instantly appear at their new positions with a purple glow effect. Users can't see where guests came from or understand how the algorithm resolved conflicts. This makes the optimization feel like magic rather than showing the logical reassignments.

The flying guest animation will show each moved guest lifting off from their original table and flying to their new destination. Guests animate one at a time (or pairs together) with a ~200ms stagger, creating a clear narrative of the optimization process. Color-coded glows indicate whether each move resolves a conflict (green) or demotes a guest to unassigned (red).

This feature is primarily for the demo video and desktop users who want to understand the optimization. It will be disabled on mobile and for users with `prefers-reduced-motion` enabled.

## Requirements

### Must Have
- [ ] Staggered flight animation (~200ms between guests/pairs)
- [ ] Re-center canvas before animation starts
- [ ] Lock canvas during animation (no zoom/pan)
- [ ] Color-coded flights (green = conflict resolution, red = demotion to unassigned)
- [ ] Original guest hides immediately when flying clone appears
- [ ] Skip button visible during animation
- [ ] Toggle in Optimize dropdown to enable/disable animation
- [ ] Respect `prefers-reduced-motion` (auto-disable)
- [ ] Disable on mobile (use instant mode)
- [ ] Cap at ~4 seconds max duration (~20 guests)
- [ ] Only animate visible guests (skip off-screen)

### Should Have
- [ ] Couples (partner pairs) launch simultaneously but fly as separate circles
- [ ] Simple fade for violation badges after all guests land
- [ ] "Already optimized!" toast when no changes needed (no animation)

### Out of Scope
- Curved/arc flight paths (straight line is fine for v1)
- Animation for Reset Seating action
- Confetti/celebration effects
- Score counter tick-up animation
- Trail/ribbon effects during flight

## Technical Design

### Architecture

The animation uses a **floating overlay** approach:
1. Before optimization, capture screen coordinates of guests that will move
2. Run optimization (state updates instantly)
3. Render floating guest avatars in a portal overlay
4. Animate avatars from old position to new position using CSS transitions
5. Clear overlay when animation completes

```
┌─────────────────────────────────────────┐
│  App Root                               │
│  ┌───────────────────────────────────┐  │
│  │  Canvas (with tables + guests)    │  │
│  │  - Guests hidden during flight    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  FlyingGuestOverlay (portal)      │  │
│  │  - Fixed position, z-index: 9999  │  │
│  │  - Flying guest avatars           │  │
│  │  - Skip button                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Key Components

| Component | Responsibility |
|-----------|----------------|
| `FlyingGuestOverlay.tsx` (new) | Portal-rendered overlay with flying avatars and skip button |
| `MainToolbar.tsx` | Orchestrates animation flow, captures positions, triggers animation |
| `useStore.ts` | New state: `flyingGuests`, `animationEnabled` preference |
| `Table.tsx` | Export `getSeatPositions()`, hide guests during flight |

### Data Model

```typescript
// New types in src/types/index.ts or inline
interface FlyingGuest {
  guestId: string;
  guest: Guest;           // For rendering initials, etc.
  fromX: number;          // Screen coordinates
  fromY: number;
  toX: number;
  toY: number;
  moveType: 'resolve' | 'demote' | 'neutral';  // For color coding
  delay: number;          // Stagger delay in ms
}

// New store state
interface StoreState {
  // ... existing
  flyingGuests: FlyingGuest[];
  optimizeAnimationEnabled: boolean;  // User preference
  setFlyingGuests: (guests: FlyingGuest[]) => void;
  clearFlyingGuests: () => void;
  setOptimizeAnimationEnabled: (enabled: boolean) => void;
}
```

### Position Calculation

```typescript
// Convert canvas coordinates to screen coordinates
function canvasToScreen(
  canvasX: number,
  canvasY: number,
  zoom: number,
  panX: number,
  panY: number,
  canvasRect: DOMRect
): { x: number; y: number } {
  return {
    x: canvasRect.left + canvasX * zoom + panX,
    y: canvasRect.top + canvasY * zoom + panY
  };
}

// Get guest's screen position
function getGuestScreenPosition(
  guest: Guest,
  tables: Table[],
  canvas: CanvasState,
  canvasRect: DOMRect
): { x: number; y: number } {
  const table = tables.find(t => t.id === guest.tableId);
  if (!table) {
    // Unassigned guest - would need canvas position
    return { x: 0, y: 0 }; // Handle separately
  }

  const seatPositions = getSeatPositions(table.shape, table.capacity, table.width, table.height);
  const seatIndex = guest.seatIndex ?? 0;
  const seatPos = seatPositions[seatIndex];

  return canvasToScreen(
    table.x + seatPos.x,
    table.y + seatPos.y,
    canvas.zoom,
    canvas.panX,
    canvas.panY,
    canvasRect
  );
}
```

## Implementation Plan

### Phase 1: Foundation (Store & Types)

1. Add `FlyingGuest` type definition
2. Add store state: `flyingGuests: FlyingGuest[]`, `optimizeAnimationEnabled: boolean`
3. Add store actions: `setFlyingGuests()`, `clearFlyingGuests()`, `setOptimizeAnimationEnabled()`
4. Export `getSeatPositions()` from Table.tsx

### Phase 2: Core Animation Component

1. Create `src/components/FlyingGuestOverlay.tsx`:
   - Portal-rendered fixed overlay
   - Renders flying guest avatars (circles with initials)
   - Each avatar uses CSS transition for position
   - Color-coded border/glow based on `moveType`
   - Skip button in corner

2. Create `src/components/FlyingGuestOverlay.css`:
   - `.flying-guest-overlay` - fixed, full-screen, pointer-events: none
   - `.flying-guest` - absolute positioned, transition: transform 600ms
   - `.flying-guest.resolve` - green glow
   - `.flying-guest.demote` - red glow
   - `.skip-button` - pointer-events: auto

### Phase 3: Animation Orchestration

1. Update `MainToolbar.tsx` `handleOptimize()`:
   ```
   - Check if animation enabled && not mobile && not reduced-motion
   - If no animation: run instant optimization (current behavior)
   - If animation:
     a. Get canvas bounding rect
     b. Capture pre-optimization positions of all guests
     c. Re-center canvas (call fitToContent or similar)
     d. Wait 500ms for re-center
     e. Run optimization, get movedGuests list
     f. Calculate new positions
     g. Build FlyingGuest[] with stagger delays
     h. Set flyingGuests in store
     i. Lock canvas (set flag)
     j. After animation duration + buffer, clear flyingGuests
     k. Unlock canvas
     l. Show success toast
   ```

2. Add helper functions in `src/utils/animationHelpers.ts`:
   - `captureGuestPositions(guests, tables, canvas, canvasRect)`
   - `calculateFlyingPaths(oldPositions, newPositions, movedGuestIds)`
   - `classifyMoveType(guest, oldTableId, newTableId, violations)`

### Phase 4: Integration & Polish

1. Add animation toggle to Optimize dropdown in MainToolbar
2. Hide guests in Table.tsx while they're in `flyingGuests`
3. Add `prefers-reduced-motion` media query check
4. Add mobile detection (viewport width < 768px)
5. Implement skip button functionality (clear flyingGuests immediately)

### Phase 5: Testing & Refinement

1. Manual testing checklist (see Verification section)
2. Adjust timing values (stagger, duration) based on feel
3. Test at various zoom levels
4. Test with different guest counts

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| No guests moved | Show "Already optimized!" toast, no animation |
| All guests off-screen | Skip animation entirely, show instant result |
| User clicks Skip | Immediately clear flyingGuests, show final state |
| Very large guest count (>20 moved) | Cap at 20, batch remainder instantly |
| Canvas panned during animation | Canvas is locked, prevent interaction |
| Animation interrupted (page nav) | useEffect cleanup clears timers |
| Mobile device | Disable animation, use instant mode |
| prefers-reduced-motion | Disable animation, use instant mode |

## Testing Strategy

### Manual Testing Checklist
- [ ] Animation triggers on desktop with animation enabled
- [ ] Guests fly from old position to new position
- [ ] Stagger timing feels natural (~200ms between)
- [ ] Green glow on conflict-resolving moves
- [ ] Red glow on demotions to unassigned
- [ ] Skip button works mid-animation
- [ ] Toggle in dropdown enables/disables
- [ ] No animation on mobile viewport
- [ ] No animation with prefers-reduced-motion
- [ ] "Already optimized" toast when no changes
- [ ] Works at zoom 50%, 100%, 200%
- [ ] Canvas locked during animation

### E2E Tests (optional, may be flaky)
- Test that optimization still works with animation enabled
- Test skip button
- Test toggle persistence

## Open Questions

- [ ] Exact flight duration per guest (start with 600ms, adjust based on feel)
- [ ] Exact green/red colors (use existing CSS variables if possible)
- [ ] Should unassigned guests also fly? (from canvas position to table, or vice versa)

## Design Decisions Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Floating overlay vs FLIP animation | True "flying" effect, guests cross over other elements | FLIP is simpler but guests stay within table bounds |
| Staggered vs simultaneous | Easier to follow, tells a story | Simultaneous is faster but chaotic |
| 600ms flight duration | Long enough to see, short enough to not bore | 400ms too fast, 1000ms too slow |
| Disable on mobile | Small viewport, flights would be tiny | Could simplify instead, but not worth complexity |
| Skip button visible | Respect user's time, especially repeat users | Hidden shortcut (Escape) - less discoverable |
| Green/red color coding | Immediately communicates good/bad moves | Single color - less informative |
