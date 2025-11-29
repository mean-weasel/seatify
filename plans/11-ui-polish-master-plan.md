# SeatOptima UI Polish & Feature Enhancement Master Plan

## Overview

This plan focuses on transforming SeatOptima from an MVP into a polished, professional-grade seating arrangement tool that meets the needs of wedding planners, event coordinators, and party planners. Based on industry research and competitor analysis, we've identified critical UI improvements and missing features.

---

## Phase 1: Canvas & Floor Plan Enhancements (High Priority)

### 1.1 Snap-to-Grid & Alignment Tools
**Why**: Professional planners need precision when arranging tables. Industry-standard tools offer snap-to-grid and alignment guides.

**Implementation**:
- Add toggleable grid overlay on canvas (10px, 20px, 50px options)
- Implement snap-to-grid when dragging tables
- Add alignment guides that appear when tables align horizontally/vertically
- Show distance measurements between selected elements
- Add toolbar buttons: Grid toggle, Snap toggle, Align Left/Center/Right/Top/Middle/Bottom

**Files to modify**:
- `src/components/Canvas.tsx` - Add grid rendering and snap logic
- `src/components/Canvas.css` - Grid overlay styles
- Add new `src/components/CanvasToolbar.tsx` - Alignment and grid controls

### 1.2 Additional Table Types & Venue Elements
**Why**: Real events use serpentine tables, half-rounds, and need to show dance floors, stages, and other venue elements.

**Implementation**:
- Add new table shapes: `serpentine`, `half_round`, `oval`
- Add venue elements: Dance Floor, Stage, DJ Booth, Bar, Buffet, Entrance/Exit
- Create element library panel with drag-to-add functionality
- Support custom element colors and labels

**Files to modify**:
- `src/types/index.ts` - Extend TableShape type, add VenueElement type
- `src/components/Table.tsx` - Render new shapes
- Add new `src/components/VenueElement.tsx`
- Add new `src/components/ElementLibrary.tsx` - Draggable element palette

### 1.3 Canvas Search & Quick Navigation
**Why**: Large events (200+ guests) need quick ways to find specific guests or tables on the canvas.

**Implementation**:
- Add search overlay (Cmd/Ctrl+F) that highlights matching guests/tables
- Implement "Go to Table" dropdown in toolbar
- Add minimap in corner for large floor plans
- Zoom-to-fit selected element

**Files to modify**:
- `src/components/Canvas.tsx` - Search overlay and navigation
- Add new `src/components/CanvasMinimap.tsx`
- `src/components/Header.tsx` - Add search trigger

### 1.4 Undo/Redo Functionality
**Why**: Users need to safely experiment with arrangements without fear of losing work.

**Implementation**:
- Implement history stack in Zustand store (limit 50 actions)
- Add Undo (Cmd+Z) and Redo (Cmd+Shift+Z) keyboard shortcuts
- Add Undo/Redo buttons to toolbar
- Track: table moves, guest assignments, additions, deletions

**Files to modify**:
- `src/store/useStore.ts` - Add history middleware
- `src/components/Header.tsx` - Add undo/redo buttons

---

## Phase 2: Visual Feedback & Constraint Visualization (High Priority)

### 2.1 Constraint Violation Warnings
**Why**: Planners need immediate feedback when seating violates constraints (e.g., feuding guests at same table).

**Implementation**:
- Show warning icon on tables with constraint violations
- Display red highlight when dragging guest to invalid table
- Add "Constraint Violations" badge in header showing count
- Click to see list of all current violations
- Visual connection lines between "must sit together" guests

**Files to modify**:
- `src/components/Table.tsx` - Warning indicators
- `src/components/Canvas.tsx` - Constraint visualization lines
- Add new `src/components/ConstraintViolationsPanel.tsx`
- `src/store/useStore.ts` - Add constraint validation helpers

### 2.2 Enhanced Table Capacity Indicators
**Why**: Instant visual feedback on table fullness is essential for quick planning.

**Implementation**:
- Show capacity ring around tables (fills as seats are assigned)
- Color coding: Green (available), Yellow (nearly full), Red (full), Purple (over capacity)
- Show "5/8" style count label on tables
- Pulse animation when table becomes full

**Files to modify**:
- `src/components/Table.tsx` - Capacity visualization
- `src/components/Table.css` - Ring and pulse styles

### 2.3 Guest Group Color Coding
**Why**: Planners need to quickly see which groups (families, departments) are seated together.

**Implementation**:
- Auto-assign colors to guest groups ("Bride's Family", "Marketing Team")
- Show colored border on guest chips matching their group
- Add group legend in sidebar
- Filter canvas to highlight specific groups
- Support up to 20 distinct group colors

**Files to modify**:
- `src/components/GuestChip.tsx` - Group color styling
- `src/components/Sidebar.tsx` - Group legend and filter
- `src/store/useStore.ts` - Group color assignment logic
- `src/index.css` - Add group color variables

### 2.4 Dietary & Accessibility Visual Markers
**Why**: Caterers and venue staff need to quickly identify special requirements at each table.

**Implementation**:
- Show small icons on guest chips for dietary restrictions (🥬 vegan, 🥜 allergy, etc.)
- Add accessibility icon (♿) for guests with mobility needs
- Table summary showing all dietary requirements at that table
- Print view includes dietary breakdown per table

**Files to modify**:
- `src/components/GuestChip.tsx` - Dietary icons
- `src/components/Table.tsx` - Requirements summary tooltip
- `src/components/PrintView.tsx` - Dietary breakdown

---

## Phase 3: Mobile & Touch Optimization (Medium Priority)

### 3.1 Touch-Friendly Canvas Interactions
**Why**: Event planners often work on tablets at venues. Current drag-and-drop needs touch optimization.

**Implementation**:
- Implement pinch-to-zoom gesture
- Add two-finger pan gesture
- Increase touch targets to 44px minimum
- Add long-press context menu for tables/guests
- Floating action button for quick-add on mobile

**Files to modify**:
- `src/components/Canvas.tsx` - Touch event handlers
- `src/components/Table.tsx` - Larger touch targets
- `src/components/Canvas.css` - Mobile-specific styles

### 3.2 Responsive Sidebar Collapse
**Why**: The sidebar takes too much space on mobile, obscuring the canvas.

**Implementation**:
- Auto-collapse sidebar to icons on screens < 768px
- Add slide-out drawer mode for mobile
- Floating guest list button that opens modal
- Swipe gestures to show/hide sidebar

**Files to modify**:
- `src/components/Sidebar.tsx` - Collapsible modes
- `src/components/Sidebar.css` - Responsive breakpoints
- `src/App.tsx` - Mobile layout logic

### 3.3 Mobile-Optimized Table Management
**Why**: Current table property panel is cramped on mobile.

**Implementation**:
- Full-screen table editor modal on mobile
- Swipe between tables for quick editing
- Large, thumb-friendly controls
- Quick actions row (delete, duplicate, rotate)

**Files to modify**:
- `src/components/TablePropertiesPanel.tsx` - Mobile mode
- `src/components/TablePropertiesPanel.css` - Mobile styles

---

## Phase 4: Export & Sharing Enhancements (Medium Priority)

### 4.1 PDF Export with Templates
**Why**: Planners need professional printable documents for clients, vendors, and day-of coordination.

**Implementation**:
- Generate styled PDFs with selectable templates (Elegant, Modern, Classic)
- Export types:
  - Full floor plan with legend
  - Table cards (one page per table with guest list)
  - Place cards (printable name cards)
  - Dietary summary report
  - Master guest list with assignments
- Include event branding (name, date, logo placeholder)

**Files to add**:
- `src/components/PDFExport.tsx` - PDF generation logic
- `src/components/PDFTemplates/` - Template components
- Use html2pdf.js or jsPDF library

### 4.2 QR Code Guest Lookup
**Why**: Modern events use QR codes so guests can scan and find their seat instantly.

**Implementation**:
- Generate unique QR code for event
- Guests scan → enter name → see their table assignment
- Optional: display nearby guests they know
- Mobile-optimized lookup page at `#/find-seat`

**Files to add**:
- `src/components/GuestLookupPage.tsx` - Public seat finder
- Use qrcode.react library for generation
- `src/components/SurveyBuilderView.tsx` - Add QR code display

### 4.3 Shareable View Links
**Why**: Planners need to share seating charts with clients, venue coordinators, and team members.

**Implementation**:
- Generate read-only shareable link
- Viewer can see floor plan and assignments but not edit
- Optional password protection
- Expiration date setting

**Files to modify**:
- `src/components/Header.tsx` - Share button
- Add new `src/components/ShareModal.tsx`
- Consider localStorage-based sharing or simple base64 encoding of event data

---

## Phase 5: Advanced Features (Lower Priority)

### 5.1 Auto-Seat Algorithm Improvements
**Why**: The current optimization could be smarter about constraint satisfaction and guest preferences.

**Implementation**:
- Weight factors: relationship strength, constraint priority, group cohesion
- Preview mode showing proposed vs current arrangement
- "Optimize Selection" - only optimize selected tables/guests
- Score breakdown showing why each assignment was made

**Files to modify**:
- `src/components/OptimizeView.tsx` - Enhanced results display
- `src/store/useStore.ts` - Improved algorithm

### 5.2 Keyboard Shortcuts & Accessibility
**Why**: Power users expect keyboard navigation; accessibility is essential for professional software.

**Implementation**:
- Shortcuts:
  - `G` - Add guest
  - `T` - Add table
  - `Del/Backspace` - Delete selected
  - `Cmd+D` - Duplicate selected
  - `Arrow keys` - Move selected element
  - `Tab` - Cycle through tables
  - `Esc` - Deselect
  - `?` - Show shortcuts help
- Full ARIA labels on all interactive elements
- Focus indicators that meet WCAG 2.1 AA
- Screen reader announcements for actions

**Files to modify**:
- `src/App.tsx` - Global keyboard listener
- All components - ARIA labels
- Add new `src/components/KeyboardShortcutsHelp.tsx`

### 5.3 Multi-Event Management
**Why**: Professional planners manage multiple events simultaneously.

**Implementation**:
- Event list/dashboard showing all events
- Quick switch between events
- Duplicate event as template
- Archive completed events

**Files to modify**:
- `src/store/useStore.ts` - Multi-event state
- Add new `src/components/EventList.tsx`
- `src/components/Header.tsx` - Event switcher dropdown

### 5.4 Real-Time RSVP Integration
**Why**: Automatically update seating when RSVPs change reduces manual work.

**Implementation**:
- Webhook endpoint for external RSVP systems
- Status change notifications
- Auto-adjust seating when guests decline
- Waitlist management for over-capacity events

---

## Phase 6: UI Polish & Micro-Interactions

### 6.1 Animation Refinements
- Smooth spring animations when dragging tables/guests
- Subtle hover states on all interactive elements
- Success celebration animation when optimization completes
- Loading skeleton states for async operations

### 6.2 Empty States & Onboarding
- Illustrated empty states for each view
- First-time user tutorial overlay
- Contextual tips that appear as user explores
- "Getting Started" checklist in dashboard

### 6.3 Consistent Iconography
- Audit all icons for consistency (use single icon library)
- Add meaningful icons to all actions
- Ensure icons have text labels for accessibility

### 6.4 Dark Mode Polish
- Audit all components for dark mode contrast
- Ensure relationship colors are visible in both modes
- Test print preview in dark mode

---

## Implementation Priority Summary

### Must Have (Phase 1-2)
1. Snap-to-grid and alignment tools
2. Constraint violation warnings
3. Undo/redo functionality
4. Enhanced capacity indicators
5. Guest group color coding
6. Additional table types

### Should Have (Phase 3-4)
7. Touch-friendly mobile experience
8. PDF export with templates
9. QR code guest lookup
10. Keyboard shortcuts

### Nice to Have (Phase 5-6)
11. Multi-event management
12. Advanced auto-seating
13. Real-time collaboration
14. Micro-interaction polish

---

## Technical Approach

### New Dependencies to Add
```json
{
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "qrcode.react": "^3.1.0"
}
```

### File Structure for New Components
```
src/components/
├── canvas/
│   ├── CanvasToolbar.tsx
│   ├── CanvasMinimap.tsx
│   ├── GridOverlay.tsx
│   └── AlignmentGuides.tsx
├── elements/
│   ├── VenueElement.tsx
│   └── ElementLibrary.tsx
├── export/
│   ├── PDFExport.tsx
│   └── templates/
├── shared/
│   ├── ConstraintViolationsPanel.tsx
│   └── KeyboardShortcutsHelp.tsx
└── mobile/
    └── MobileDrawer.tsx
```

### State Management Additions
- History stack for undo/redo
- Computed constraint violations
- UI preferences (grid, snap, theme)
- Active group filter

---

## Success Metrics

After implementation, the application should:
- Allow precise table placement with visual alignment guides
- Show real-time constraint violations before they become problems
- Support professional PDF exports for client presentations
- Work seamlessly on tablets and mobile devices
- Provide keyboard-first workflow for power users
- Handle events with 500+ guests smoothly

---

## Sources & Research

Industry research was conducted using:
- [Planning Pod Event Seating Software](https://www.planningpod.com/seating-arrangement-chart-software.cfm)
- [Perfect Table Plan](https://www.perfecttableplan.com/)
- [Social Tables Diagramming Platform](https://www.socialtables.com/)
- [SeatPlanning App](https://www.seatplanning.com/blog/seating-chart-app-tour)
- [zkipster Seating Chart App](https://www.zkipster.com/seating-chart-app)
- [Canapii Seating Solutions](https://canapii.com/seating/)
