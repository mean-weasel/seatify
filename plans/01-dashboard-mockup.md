# Dashboard Mockup Implementation Plan

## Overview and Goals

Create a new Dashboard view that serves as the home/landing page for the seating arrangement application, providing users with an at-a-glance overview of their event status, quick access to common actions, and progress visualization.

### Success Criteria
- Dashboard displays key event metrics immediately upon loading
- Quick action buttons provide one-click access to common tasks
- Visual progress indicators show seating completion at a glance
- Integrates seamlessly with existing styling and navigation patterns
- Responsive and consistent with the warm coral/peach color scheme

---

## Component Structure

```
src/
├── components/
│   ├── DashboardView.tsx          # Main dashboard container
│   ├── DashboardView.css          # Dashboard styles
│   ├── dashboard/
│   │   ├── EventSummaryCard.tsx   # Event details card
│   │   ├── StatsOverview.tsx      # Key statistics grid
│   │   ├── QuickActions.tsx       # Quick action buttons
│   │   ├── ProgressRing.tsx       # Circular progress indicator
│   │   ├── ActivityFeed.tsx       # Recent activity section
│   │   └── dashboard.types.ts     # Dashboard-specific types
```

---

## UI/UX Design Details

### Layout Structure (ASCII Wireframe)

```
+------------------------------------------------------------------+
|                          HEADER                                   |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------+  +--------------------------------+  |
|  |   EVENT SUMMARY CARD   |  |      STATS OVERVIEW           |  |
|  |                        |  |  +------+ +------+ +------+    |  |
|  |  Event Name: My Event  |  |  | 24   | | 4    | | 20   |    |  |
|  |  Date: Dec 15, 2024    |  |  |Guests| |Tables| |Conf. |    |  |
|  |  Type: Wedding         |  |  +------+ +------+ +------+    |  |
|  |                        |  |  +------+ +------+ +------+    |  |
|  |                        |  |  | 4    | | 8    | | 0    |    |  |
|  +------------------------+  |  |Unasn.| |Pending| |Decl. |    |  |
|                              +--------------------------------+  |
|                                                                  |
|  +------------------------+  +--------------------------------+  |
|  |   PROGRESS INDICATOR   |  |     QUICK ACTIONS              |  |
|  |                        |  |                                |  |
|  |      [83%]             |  |  [+ Add Table] [+ Add Guest]   |  |
|  |   Seating Complete     |  |                                |  |
|  |                        |  |  [Run Optimization] [Export]   |  |
|  |   20/24 guests seated  |  |                                |  |
|  +------------------------+  +--------------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    ACTIVITY FEED                           |  |
|  |                                                            |  |
|  |  - Guest "John Smith" was added                            |  |
|  |  - Table 3 was created                                     |  |
|  |  - Optimization run completed (Score: 87/100)              |  |
|  |  - 5 guests imported from CSV                              |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Responsive Grid Layout

The dashboard uses CSS Grid with the following structure:
- **Desktop (>1200px)**: 2-column layout
- **Tablet (768-1200px)**: 2-column with stacked cards
- **Mobile (<768px)**: Single column, all cards stacked

---

## Component Details

### 1. DashboardView.tsx (Main Container)

```typescript
// Component structure
interface DashboardViewProps {
  // No props needed - pulls from Zustand store
}

// Key features:
// - Fetches event data from useStore
// - Computes derived statistics
// - Renders child components in grid layout
// - Handles quick action callbacks
```

### 2. EventSummaryCard.tsx

Displays event overview information:
- Event name (editable inline)
- Event date (with date picker)
- Event type badge (Wedding, Corporate, Social, Other)
- Quick link to edit event settings

### 3. StatsOverview.tsx

Grid of 6 stat cards showing:
1. **Total Guests** - `event.guests.length`
2. **Tables** - `event.tables.length`
3. **Confirmed RSVPs** - Filter by `rsvpStatus === 'confirmed'`
4. **Unassigned Guests** - Filter by `!guest.tableId`
5. **Pending RSVPs** - Filter by `rsvpStatus === 'pending'`
6. **Declined** - Filter by `rsvpStatus === 'declined'`

### 4. ProgressRing.tsx

Circular progress indicator showing seating completion:
- SVG-based circular progress bar
- Large percentage number in center
- Label: "Seating Complete"
- Subtext: "X/Y guests seated"

### 5. QuickActions.tsx

Grid of 4 action buttons:

| Button | Icon | Action | Styling |
|--------|------|--------|---------|
| Add Table | + | Opens table creation modal | Primary gradient |
| Add Guest | + | Opens guest form | Primary gradient |
| Run Optimization | sparkle | Navigates to optimize view | Secondary style |
| Export Event | download | Triggers JSON export | Outline style |

### 6. ActivityFeed.tsx

Scrollable list of recent activities/notifications (mock data for mockup)

---

## Styling Approach

### CSS Variables to Use (from index.css)

```css
/* Primary Colors */
--color-primary: #f97066;
--color-primary-hover: #ef5a4e;
--color-primary-light: #fef2f1;

/* Secondary Colors */
--color-secondary: #ffb088;
--color-secondary-light: #fff5ee;

/* Status Colors */
--color-success: #4ade80;
--color-warning: #fbbf24;
--color-error: #f87171;
--color-info: #60a5fa;
```

---

## Data Requirements from Store

```typescript
// Computed statistics needed
const totalGuests = event.guests.length;
const totalTables = event.tables.length;
const confirmedGuests = event.guests.filter(g => g.rsvpStatus === 'confirmed').length;
const pendingGuests = event.guests.filter(g => g.rsvpStatus === 'pending').length;
const declinedGuests = event.guests.filter(g => g.rsvpStatus === 'declined').length;
const assignedGuests = event.guests.filter(g => g.tableId).length;
const unassignedGuests = totalGuests - assignedGuests;
const seatingPercentage = totalGuests > 0 ? (assignedGuests / totalGuests) * 100 : 0;
```

---

## Store Modifications Needed

Add `'dashboard'` to the `activeView` type:

```typescript
activeView: 'dashboard' | 'canvas' | 'guests' | 'survey' | 'optimize';
```

---

## Implementation Steps

| Step | File | Description |
|------|------|-------------|
| 1.1 | `src/store/useStore.ts` | Add 'dashboard' to activeView type |
| 1.2 | `src/components/DashboardView.tsx` | Create main dashboard container |
| 1.3 | `src/components/DashboardView.css` | Dashboard-specific styles |
| 1.4 | `src/components/dashboard/StatsOverview.tsx` | Stats grid component |
| 1.5 | `src/components/dashboard/EventSummaryCard.tsx` | Event info card |
| 1.6 | `src/components/dashboard/ProgressRing.tsx` | SVG circular progress |
| 1.7 | `src/components/dashboard/QuickActions.tsx` | Action buttons grid |
| 1.8 | `src/components/dashboard/ActivityFeed.tsx` | Activity list (mock data) |
| 1.9 | `src/App.tsx` | Add dashboard view routing |
| 1.10 | `src/components/Header.tsx` | Add dashboard nav button |
