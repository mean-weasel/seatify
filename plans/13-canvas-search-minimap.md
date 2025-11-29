# Plan: Canvas Search and Minimap Features

## Overview
Add powerful navigation features: a search overlay for finding guests/tables, a minimap for spatial overview, and a "Go to Table" quick navigation dropdown. Essential for managing large events with 50+ guests.

## Priority
**High Value** - Critical usability improvement for large events.

---

## Feature 1: Canvas Search

### Description
Search overlay triggered by Cmd/Ctrl+F that allows searching by guest name, table name, or group. Results are highlighted on the canvas.

### State Management

```typescript
// src/types/index.ts
export interface SearchResult {
  type: 'guest' | 'table' | 'group';
  id: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface CanvasSearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  highlightedIds: string[];
}
```

### Store Actions

```typescript
// Add to store
canvasSearch: CanvasSearchState;

openCanvasSearch: () => void;
closeCanvasSearch: () => void;
setSearchQuery: (query: string) => void;
selectNextResult: () => void;
selectPrevResult: () => void;
goToSearchResult: (index: number) => void;
```

### Component: CanvasSearch.tsx

```tsx
export function CanvasSearch() {
  // Key features:
  // - Auto-focus input on open
  // - Debounced search as you type
  // - Arrow keys to navigate results
  // - Enter to cycle through matches
  // - Escape to close
  // - Click result to navigate
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+F | Open search |
| Escape | Close search |
| Enter | Go to next result |
| Shift+Enter | Go to previous result |
| Arrow Up/Down | Navigate results list |

### Highlight Styles

```css
.table-component.search-highlight .table-surface {
  box-shadow: 0 0 0 4px var(--color-info), 0 0 20px rgba(59, 130, 246, 0.4);
  animation: searchPulse 1.5s ease-in-out infinite;
}

@keyframes searchPulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--color-info); }
  50% { box-shadow: 0 0 0 6px var(--color-info), 0 0 30px rgba(59, 130, 246, 0.6); }
}
```

---

## Feature 2: Minimap

### Description
Small overview in corner showing all tables with viewport indicator. Click to navigate, drag viewport to pan.

### Component: CanvasMinimap.tsx

```tsx
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;

export function CanvasMinimap() {
  // Calculate bounds of all content
  const bounds = useMemo(() => {
    // Find min/max X and Y of all tables
  }, [event.tables]);

  // Scale factor to fit content in minimap
  const scale = Math.min(
    MINIMAP_WIDTH / contentWidth,
    MINIMAP_HEIGHT / contentHeight
  );

  // Viewport indicator position
  const viewportRect = {
    x: (-canvas.panX / canvas.zoom - bounds.minX) * scale,
    y: (-canvas.panY / canvas.zoom - bounds.minY) * scale,
    width: (viewportWidth / canvas.zoom) * scale,
    height: (viewportHeight / canvas.zoom) * scale,
  };

  return (
    <div className="canvas-minimap">
      <svg>
        {/* Background */}
        <rect fill="var(--color-bg-secondary)" />

        {/* Tables as simplified shapes */}
        {tables.map(table => (
          <rect
            key={table.id}
            rx={table.shape === 'round' ? '50%' : 2}
            fill="var(--color-primary)"
            opacity={0.7}
          />
        ))}

        {/* Viewport indicator */}
        <rect
          className="viewport-indicator"
          stroke="var(--color-text)"
          strokeWidth={2}
          fill="none"
        />
      </svg>

      <div className="minimap-label">
        <span>{tables.length} tables</span>
        <span>{Math.round(canvas.zoom * 100)}%</span>
      </div>
    </div>
  );
}
```

### Interaction
- **Click anywhere**: Pan canvas to center on that point
- **Drag viewport**: Pan canvas in real-time
- **Hover**: Show table name tooltip

### Positioning
```css
.canvas-minimap {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
}

@media (max-width: 480px) {
  .canvas-minimap {
    display: none; /* Hide on small mobile */
  }
}
```

---

## Feature 3: Go to Table Dropdown

### Description
Toolbar dropdown listing all tables with occupancy, allowing quick navigation.

### Implementation

```tsx
// In Canvas.tsx toolbar
<div className="table-nav-dropdown">
  <button onClick={() => setShowDropdown(!showDropdown)}>
    🪑 Go to Table ▾
  </button>

  {showDropdown && (
    <div className="dropdown-menu">
      {event.tables.map(table => {
        const guestCount = guests.filter(g => g.tableId === table.id).length;
        const isFull = guestCount >= table.capacity;

        return (
          <button
            key={table.id}
            onClick={() => goToTable(table)}
            className={isFull ? 'full' : ''}
          >
            <span>{table.name}</span>
            <span className="occupancy">{guestCount}/{table.capacity}</span>
          </button>
        );
      })}
    </div>
  )}
</div>
```

### goToTable Function

```typescript
const goToTable = (table: Table) => {
  // Center viewport on table
  const newPanX = -table.x - table.width / 2 + viewportWidth / 2;
  const newPanY = -table.y - table.height / 2 + viewportHeight / 2;

  setPan(newPanX, newPanY);
  setZoom(1); // Reset to 100%
  selectTable(table.id);
  setShowDropdown(false);
};
```

---

## Files to Create

- `src/components/CanvasSearch.tsx`
- `src/components/CanvasSearch.css`
- `src/components/CanvasMinimap.tsx`
- `src/components/CanvasMinimap.css`

## Files to Modify

- `src/types/index.ts` - Add search types
- `src/store/useStore.ts` - Add search state and actions
- `src/components/Canvas.tsx` - Integrate all features
- `src/components/Canvas.css` - Add styles
- `src/components/Table.tsx` - Add `isHighlighted` prop
- `src/App.tsx` - Update keyboard shortcuts help

---

## Performance Considerations

1. **Debounce search input** (150ms)
2. **Memoize search results**
3. **Use Set for highlighted IDs** (O(1) lookup)
4. **Throttle minimap updates during drag**
5. **Virtualize results list** for 100+ matches

---

## Testing Checklist

### Search
- [ ] Cmd/Ctrl+F opens search
- [ ] Search by guest name works
- [ ] Search by table name works
- [ ] Search by group works
- [ ] Arrow keys navigate results
- [ ] Enter cycles through results
- [ ] Highlights clear on close

### Minimap
- [ ] Shows all tables
- [ ] Viewport indicator accurate
- [ ] Click navigates correctly
- [ ] Drag viewport pans
- [ ] Updates when tables move

### Go to Table
- [ ] Shows all tables
- [ ] Shows occupancy
- [ ] Full tables highlighted
- [ ] Navigation works

---

## Estimated Complexity
**Medium-High** - Multiple interconnected features with state management.
