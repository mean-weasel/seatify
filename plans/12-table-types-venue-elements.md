# Plan: New Table Types and Venue Elements

## Overview
Add three new table shapes (serpentine, half-round, oval) and seven venue elements (dance floor, stage, DJ booth, bar, buffet table, entrance/exit markers, photo booth) to expand floor plan capabilities.

## Priority
**Medium-High** - Significantly expands floor plan capabilities for professional event planning.

---

## Part 1: New Table Shapes

### 1.1 Type System Changes

```typescript
// src/types/index.ts
export type TableShape =
  | 'round'
  | 'rectangle'
  | 'square'
  | 'serpentine'
  | 'half-round'
  | 'oval';
```

### 1.2 Oval Table
- Elliptical shape, similar to round but elongated
- Seats distributed around the perimeter

**Seat Position Calculation:**
```typescript
} else if (shape === 'oval') {
  const radiusX = width / 2 + 20;
  const radiusY = height / 2 + 20;

  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
    positions.push({
      x: width / 2 + radiusX * Math.cos(angle),
      y: height / 2 + radiusY * Math.sin(angle),
    });
  }
}
```

**CSS:**
```css
.table-component.oval .table-surface {
  border-radius: 50%;
}
```

**Defaults:** `{ width: 180, height: 120, capacity: 10 }`

### 1.3 Half-Round Table (Semicircle)
- Semicircular table for head tables or registration desks
- Seats along the curved edge only

**Seat Position Calculation:**
```typescript
} else if (shape === 'half-round') {
  const radius = width / 2 + 20;

  for (let i = 0; i < capacity; i++) {
    const angle = Math.PI * (i / (capacity - 1 || 1));
    positions.push({
      x: width / 2 - radius * Math.cos(angle),
      y: height + radius * Math.sin(angle) * 0.5,
    });
  }
}
```

**CSS:**
```css
.table-component.half-round .table-surface {
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
}
```

**Defaults:** `{ width: 160, height: 80, capacity: 5 }`

### 1.4 Serpentine Table (S-curve)
- S-shaped curve typically used for buffet lines
- Often used without seats (capacity: 0)

**Seat Position Calculation:**
```typescript
} else if (shape === 'serpentine') {
  if (capacity === 0) return positions;

  const amplitude = height / 4;
  for (let i = 0; i < capacity; i++) {
    const t = i / (capacity - 1 || 1);
    const x = t * width;
    const curveY = height / 2 + amplitude * Math.sin(t * 2 * Math.PI);
    const derivative = amplitude * 2 * Math.PI * Math.cos(t * 2 * Math.PI) / width;
    const normalAngle = Math.atan2(derivative, 1) + Math.PI / 2;

    positions.push({
      x: x + 25 * Math.cos(normalAngle),
      y: curveY + 25 * Math.sin(normalAngle),
    });
  }
}
```

**Rendering:** Use inline SVG path for the S-curve shape.

**Defaults:** `{ width: 300, height: 100, capacity: 0 }`

---

## Part 2: Venue Elements

### 2.1 Type Definitions

```typescript
// src/types/index.ts
export type VenueElementType =
  | 'dance-floor'
  | 'stage'
  | 'dj-booth'
  | 'bar'
  | 'buffet'
  | 'entrance'
  | 'exit'
  | 'photo-booth';

export interface VenueElement {
  id: string;
  type: VenueElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
}

// Update Event interface
export interface Event {
  // ... existing fields
  venueElements: VenueElement[];
}
```

### 2.2 Element Defaults

| Element | Width | Height | Icon | Notes |
|---------|-------|--------|------|-------|
| Dance Floor | 200 | 200 | 💃 | Checkered pattern |
| Stage | 300 | 100 | 🎭 | Wood texture |
| DJ Booth | 100 | 60 | 🎧 | Dark purple gradient |
| Bar | 200 | 60 | 🍸 | Wood grain |
| Buffet | 240 | 60 | 🍽️ | Simple rectangle |
| Entrance | 80 | 40 | 🚪 | Green dashed border |
| Exit | 80 | 40 | 🚪 | Red dashed border |
| Photo Booth | 120 | 120 | 📸 | Warm gradient |

### 2.3 Store Actions

```typescript
// Add to AppState interface
addVenueElement: (type: VenueElementType, x: number, y: number) => void;
updateVenueElement: (id: string, updates: Partial<VenueElement>) => void;
removeVenueElement: (id: string) => void;
moveVenueElement: (id: string, x: number, y: number) => void;
selectVenueElement: (id: string | null) => void;

// Add to canvas state
canvas: {
  // ... existing
  selectedVenueElementId: string | null;
}
```

---

## Part 3: Component Structure

### 3.1 New Files to Create

- `src/components/VenueElement.tsx` - Venue element component
- `src/components/VenueElement.css` - Venue element styles
- `src/components/VenueElementPropertiesPanel.tsx` - Properties panel

### 3.2 Files to Modify

- `src/types/index.ts` - Add new types
- `src/store/useStore.ts` - Add venue element actions
- `src/components/Table.tsx` - Add seat calculations for new shapes
- `src/components/Table.css` - Add styles for new shapes
- `src/components/Canvas.tsx` - Render venue elements, update toolbar
- `src/components/Canvas.css` - Toolbar layout updates
- `src/components/TablePropertiesPanel.tsx` - Add new shape options
- `src/data/demoData.ts` - Add demo venue elements

---

## Part 4: Toolbar Enhancement

Add an expandable element library panel:

```tsx
<div className="toolbar-group">
  <span className="toolbar-label">Tables</span>
  <button onClick={() => handleAddTable('round')}>⭕ Round</button>
  <button onClick={() => handleAddTable('rectangle')}>▭ Rectangle</button>
  <button onClick={() => handleAddTable('square')}>⬜ Square</button>
  <button onClick={() => handleAddTable('oval')}>⬭ Oval</button>
  <button onClick={() => handleAddTable('half-round')}>◗ Half</button>
  <button onClick={() => handleAddTable('serpentine')}>〰️ Serpentine</button>
</div>

<div className="toolbar-group toolbar-divider">
  <span className="toolbar-label">Venue</span>
  <button onClick={() => handleAddVenueElement('dance-floor')}>💃 Dance</button>
  <button onClick={() => handleAddVenueElement('stage')}>🎭 Stage</button>
  <button onClick={() => handleAddVenueElement('bar')}>🍸 Bar</button>
  <button onClick={() => handleAddVenueElement('buffet')}>🍽️ Buffet</button>
  <button onClick={() => handleAddVenueElement('dj-booth')}>🎧 DJ</button>
  <button onClick={() => handleAddVenueElement('photo-booth')}>📸 Photo</button>
  <button onClick={() => handleAddVenueElement('entrance')}>🚪 Entry</button>
</div>
```

---

## Part 5: CSS Styles

### Venue Element Base Styles
```css
.venue-element {
  position: absolute;
  cursor: grab;
  user-select: none;
  transition: all var(--duration-normal) var(--ease-bounce);
}

.element-surface {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: var(--radius-lg);
  border: 3px dashed var(--color-border);
  background: var(--color-bg-secondary);
}

/* Dance Floor - Checkered pattern */
.venue-element.dance-floor .element-surface {
  background: repeating-linear-gradient(
    45deg, #1a1a2e, #1a1a2e 20px, #16213e 20px, #16213e 40px
  );
  border-style: solid;
  border-color: var(--color-secondary);
}

/* Stage - Wood texture */
.venue-element.stage .element-surface {
  background: linear-gradient(to top, #4a3728, #6b4423);
  border: 4px solid #8b5e3c;
}

/* Entrance/Exit */
.venue-element.entrance .element-surface {
  background: transparent;
  border: 3px dashed var(--color-success);
}

.venue-element.exit .element-surface {
  background: transparent;
  border: 3px dashed var(--color-error);
}
```

---

## Testing Checklist

### New Table Shapes
- [ ] Oval table creates with correct dimensions
- [ ] Oval seats distribute evenly around perimeter
- [ ] Half-round table seats align along curved edge
- [ ] Serpentine table supports 0 capacity
- [ ] All shapes can be resized
- [ ] Shape switching preserves position

### Venue Elements
- [ ] Each venue element type creates correctly
- [ ] Venue elements can be dragged and positioned
- [ ] Venue elements snap to grid when enabled
- [ ] Properties panel works for venue elements
- [ ] Delete confirmation works
- [ ] Venue elements persist to storage
- [ ] Venue elements export/import correctly

---

## Estimated Complexity
**Medium-High** - Requires type extensions, store modifications, new components, and complex SVG/CSS rendering for serpentine shape.
