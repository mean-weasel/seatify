# Guest Management View Mockup - Implementation Plan

## Overview and Goals

Create a powerful, full-featured Guest Management View for comprehensive guest list management with search, filtering, bulk operations, and detailed guest profiles.

### Primary Goals
1. Create a searchable, sortable guest list table view
2. Implement advanced filtering capabilities (RSVP status, group, assigned/unassigned)
3. Enable bulk operations for efficient guest management
4. Provide detailed guest profile panel with relationship visualization
5. Integrate import/export functionality with progress indicators
6. Add group management section

---

## Component Architecture

### Component Hierarchy

```
GuestManagementView/
  GuestManagementToolbar/
    SearchBar
    FilterDropdowns
    BulkActionButtons
    ViewToggle (list/grid)

  GuestManagementContent/
    GuestTable/
      GuestTableHeader (sortable columns)
      GuestTableRow (selectable)
    GuestGrid/ (alternative view)
      GuestCard

  GuestDetailPanel/
    GuestProfileSection
    RelationshipGraph
    QuickActionsBar

  GroupManagementPanel/
    GroupList
    GroupEditor

  ImportExportPanel/
    ImportDropzone
    ExportOptions
    ProgressIndicator
```

### File Structure

```
src/components/GuestManagement/
  GuestManagementView.tsx      # Main view container
  GuestManagementView.css

  GuestToolbar/
    GuestToolbar.tsx           # Search, filters, bulk actions
    GuestToolbar.css
    SearchBar.tsx
    FilterDropdown.tsx
    BulkActionMenu.tsx

  GuestTable/
    GuestTable.tsx             # Sortable data table
    GuestTable.css
    GuestTableHeader.tsx
    GuestTableRow.tsx

  GuestDetailPanel/
    GuestDetailPanel.tsx       # Slide-out detail view
    GuestDetailPanel.css
    ProfileSection.tsx
    RelationshipGraph.tsx

  GroupManagement/
    GroupManagementPanel.tsx
    GroupManagementPanel.css

  ImportExport/
    ImportExportPanel.tsx
    ImportExportPanel.css
```

---

## UI/UX Design

### Layout Structure

```
+------------------------------------------------------------------+
|  GuestManagementToolbar                                           |
|  [Search] [Filters...] [Bulk Actions] [Import] [Export] [Toggle] |
+------------------------------------------------------------------+
|                                |                                  |
|    GuestTable/GuestGrid        |    GuestDetailPanel             |
|    (scrollable list)           |    (slide-out panel)            |
|                                |                                  |
|    [ ] Name    Group   RSVP    |    [Profile Info]               |
|    [x] Alice   Bride   Conf    |    [Relationship Graph]         |
|    [x] Bob     Groom   Pend    |    [Quick Actions]              |
|    [ ] Carol   Friend  Conf    |                                  |
|                                |                                  |
+--------------------------------+----------------------------------+
```

### Table Columns

| Column | Sortable | Width | Content |
|--------|----------|-------|---------|
| Checkbox | No | 40px | Multi-select |
| Avatar | No | 48px | Initials + status dot |
| Name | Yes | 200px | Name + company subtitle |
| Group | Yes | 150px | Group chip |
| RSVP Status | Yes | 120px | Status badge |
| Table Assignment | Yes | 140px | Table name or "Unassigned" |
| Relationships | No | 100px | Count badge |
| Actions | No | 80px | Quick action icons |

---

## Key Features

### SearchBar
- Debounced search (300ms)
- Searches name, company, email
- Clear button

### FilterDropdown
- Multi-select filters
- Options with counts
- Active filter indicator

### BulkActionMenu
- Appears when items selected
- Actions: Assign to Table, Change Status, Delete
- Selection count display

### GuestDetailPanel
- Slide-in from right
- Full profile display
- SVG relationship graph
- Quick action buttons

### RelationshipGraph
- Radial SVG visualization
- Selected guest in center
- Related guests as satellites
- Color-coded by relationship type
- Line thickness by strength

---

## Data Requirements

### State Management
```typescript
interface GuestManagementState {
  searchQuery: string;
  filters: {
    rsvpStatus: ('pending' | 'confirmed' | 'declined')[];
    groups: string[];
    assignmentStatus: 'all' | 'assigned' | 'unassigned';
  };
  sortColumn: 'name' | 'group' | 'rsvpStatus' | 'tableAssignment';
  sortDirection: 'asc' | 'desc';
  selectedGuestIds: Set<string>;
  detailPanelGuestId: string | null;
  viewMode: 'table' | 'grid';
}
```

### Store Extensions
```typescript
// Bulk Actions
bulkAssignToTable: (guestIds: string[], tableId: string) => void;
bulkChangeStatus: (guestIds: string[], status: Guest['rsvpStatus']) => void;
bulkDeleteGuests: (guestIds: string[]) => void;
```

---

## Styling Guidelines

- Use existing CSS variables from index.css
- Card styling from OptimizeView patterns
- Status badges: confirmed (green), pending (yellow), declined (red)
- Touch-friendly sizing (44px minimum targets)
- Smooth slide animations for detail panel

---

## Implementation Steps

| Step | Description |
|------|-------------|
| 1 | Create GuestManagementView container with grid layout |
| 2 | Implement GuestToolbar with search and filters |
| 3 | Build GuestTable with sortable columns |
| 4 | Add row selection and bulk actions |
| 5 | Create GuestDetailPanel slide-out |
| 6 | Implement RelationshipGraph SVG visualization |
| 7 | Add GroupManagementPanel |
| 8 | Integrate with Header navigation |
