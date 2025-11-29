# Plan: Table Editor Enhancements

## Overview
Add the ability to edit table capacity and size after creation. Currently tables can only be renamed and deleted once placed - this plan adds capacity editing and resize controls.

## Priority
**Quick Win** - High usability impact, straightforward implementation. The store already supports these updates.

## Features to Add

### Feature 1: Capacity Editor
Allow users to change how many seats a table has.

### Feature 2: Size Controls
Allow users to resize tables via presets or direct input.

---

## Implementation Steps

### Step 1: Create TablePropertiesPanel Component
New component that appears when a table is selected, replacing inline-only editing:

**File:** `src/components/TablePropertiesPanel.tsx`

```tsx
import { useStore } from '../store/useStore';
import './TablePropertiesPanel.css';

export function TablePropertiesPanel() {
  const { event, canvas, updateTable, removeTable } = useStore();

  const selectedTable = canvas.selectedTableId
    ? event.tables.find(t => t.id === canvas.selectedTableId)
    : null;

  if (!selectedTable) return null;

  const assignedGuests = event.guests.filter(g => g.tableId === selectedTable.id);

  const handleCapacityChange = (newCapacity: number) => {
    // Ensure capacity is at least the number of assigned guests
    const minCapacity = Math.max(1, assignedGuests.length);
    const capacity = Math.max(minCapacity, Math.min(20, newCapacity));
    updateTable(selectedTable.id, { capacity });
  };

  const handleSizePreset = (preset: 'small' | 'medium' | 'large') => {
    const sizes = {
      small: { width: 80, height: 80 },
      medium: { width: 120, height: 120 },
      large: { width: 160, height: 160 },
    };
    const rectangleSizes = {
      small: { width: 120, height: 60 },
      medium: { width: 180, height: 80 },
      large: { width: 240, height: 100 },
    };

    const sizeMap = selectedTable.shape === 'rectangle' ? rectangleSizes : sizes;
    updateTable(selectedTable.id, sizeMap[preset]);
  };

  const handleDelete = () => {
    if (confirm(`Delete ${selectedTable.name}? ${assignedGuests.length} guests will be unassigned.`)) {
      removeTable(selectedTable.id);
    }
  };

  return (
    <div className="table-properties-panel">
      <div className="panel-header">
        <h3>Table Settings</h3>
        <button className="close-btn" onClick={() => useStore.getState().selectTable(null)}>
          ×
        </button>
      </div>

      <div className="property-group">
        <label>Name</label>
        <input
          type="text"
          value={selectedTable.name}
          onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
        />
      </div>

      <div className="property-group">
        <label>Shape</label>
        <div className="shape-selector">
          {(['round', 'rectangle', 'square'] as const).map(shape => (
            <button
              key={shape}
              className={selectedTable.shape === shape ? 'active' : ''}
              onClick={() => updateTable(selectedTable.id, { shape })}
            >
              {shape === 'round' ? '⭕' : shape === 'rectangle' ? '▭' : '⬜'}
            </button>
          ))}
        </div>
      </div>

      <div className="property-group">
        <label>Capacity</label>
        <div className="capacity-control">
          <button
            onClick={() => handleCapacityChange(selectedTable.capacity - 1)}
            disabled={selectedTable.capacity <= assignedGuests.length || selectedTable.capacity <= 1}
          >
            −
          </button>
          <input
            type="number"
            min={Math.max(1, assignedGuests.length)}
            max={20}
            value={selectedTable.capacity}
            onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={() => handleCapacityChange(selectedTable.capacity + 1)}
            disabled={selectedTable.capacity >= 20}
          >
            +
          </button>
        </div>
        <span className="capacity-hint">
          {assignedGuests.length} of {selectedTable.capacity} seats filled
        </span>
      </div>

      <div className="property-group">
        <label>Size</label>
        <div className="size-presets">
          <button onClick={() => handleSizePreset('small')}>Small</button>
          <button onClick={() => handleSizePreset('medium')}>Medium</button>
          <button onClick={() => handleSizePreset('large')}>Large</button>
        </div>
      </div>

      <div className="property-group">
        <label>Dimensions</label>
        <div className="dimension-inputs">
          <div>
            <span>W:</span>
            <input
              type="number"
              min={60}
              max={300}
              value={selectedTable.width}
              onChange={(e) => updateTable(selectedTable.id, { width: parseInt(e.target.value) || 100 })}
            />
          </div>
          <div>
            <span>H:</span>
            <input
              type="number"
              min={60}
              max={300}
              value={selectedTable.height}
              onChange={(e) => updateTable(selectedTable.id, { height: parseInt(e.target.value) || 100 })}
            />
          </div>
        </div>
      </div>

      <div className="panel-actions">
        <button className="delete-btn" onClick={handleDelete}>
          Delete Table
        </button>
      </div>

      {assignedGuests.length > 0 && (
        <div className="assigned-guests">
          <label>Assigned Guests ({assignedGuests.length})</label>
          <ul>
            {assignedGuests.map(guest => (
              <li key={guest.id}>{guest.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Style the Properties Panel

**File:** `src/components/TablePropertiesPanel.css`

```css
.table-properties-panel {
  position: absolute;
  right: 1rem;
  top: 4rem;
  width: 280px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1rem;
  z-index: 100;
  animation: slideIn var(--duration-normal) var(--ease-out);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.panel-header h3 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: var(--color-text);
}

.property-group {
  margin-bottom: 1rem;
}

.property-group label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin-bottom: 0.5rem;
}

.property-group input[type="text"],
.property-group input[type="number"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: border-color var(--duration-fast);
}

.property-group input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.shape-selector {
  display: flex;
  gap: 0.5rem;
}

.shape-selector button {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  font-size: 1.25rem;
  transition: all var(--duration-fast);
}

.shape-selector button:hover {
  border-color: var(--color-primary-light);
}

.shape-selector button.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.capacity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.capacity-control button {
  width: 36px;
  height: 36px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.capacity-control button:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.capacity-control button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.capacity-control input {
  width: 60px;
  text-align: center;
}

.capacity-hint {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.size-presets {
  display: flex;
  gap: 0.5rem;
}

.size-presets button {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.size-presets button:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.dimension-inputs {
  display: flex;
  gap: 0.75rem;
}

.dimension-inputs > div {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dimension-inputs span {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.dimension-inputs input {
  width: 100%;
}

.panel-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.delete-btn {
  width: 100%;
  padding: 0.625rem;
  border: 2px solid var(--color-error);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.delete-btn:hover {
  background: var(--color-error);
  color: white;
}

.assigned-guests {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.assigned-guests ul {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 150px;
  overflow-y: auto;
}

.assigned-guests li {
  padding: 0.375rem 0;
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.assigned-guests li:last-child {
  border-bottom: none;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .table-properties-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 60vh;
    overflow-y: auto;
  }
}
```

### Step 3: Integrate Panel into Canvas

**Modify:** `src/components/Canvas.tsx`

```tsx
import { TablePropertiesPanel } from './TablePropertiesPanel';

export function Canvas() {
  // ... existing code ...

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        {/* ... existing toolbar ... */}
      </div>

      <DndContext ...>
        {/* ... existing canvas content ... */}
      </DndContext>

      {/* Add the properties panel */}
      <TablePropertiesPanel />
    </div>
  );
}
```

### Step 4: Remove Duplicate Controls from Table Component
Since editing moves to the panel, simplify the inline table display:

**Modify:** `src/components/Table.tsx`

```tsx
// Remove the inline input and delete button from the table itself
// Keep only the display label and visual feedback

<div className="table-surface">
  <div className="table-label">
    <span>{table.name}</span>
    <span className="table-count">
      {guests.length}/{table.capacity}
    </span>
  </div>
</div>

{/* Remove the delete button - it's now in the panel */}
```

### Step 5: Add Visual Selection Indicator
Enhance the selected table appearance:

**Modify:** `src/components/Table.css`

```css
.table-component.selected {
  outline: 3px solid var(--color-primary);
  outline-offset: 4px;
  z-index: 10;
}

.table-component.selected::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 2px dashed var(--color-primary-light);
  border-radius: inherit;
  pointer-events: none;
}
```

### Step 6: Add Keyboard Shortcuts (Optional Enhancement)

**Modify:** `src/components/Canvas.tsx`

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!canvas.selectedTableId) return;

    const table = event.tables.find(t => t.id === canvas.selectedTableId);
    if (!table) return;

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (confirm(`Delete ${table.name}?`)) {
          removeTable(table.id);
        }
        break;
      case 'Escape':
        selectTable(null);
        break;
      case '+':
      case '=':
        if (table.capacity < 20) {
          updateTable(table.id, { capacity: table.capacity + 1 });
        }
        break;
      case '-':
        if (table.capacity > 1) {
          updateTable(table.id, { capacity: table.capacity - 1 });
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canvas.selectedTableId, event.tables]);
```

---

## Files to Create
- `src/components/TablePropertiesPanel.tsx`
- `src/components/TablePropertiesPanel.css`

## Files to Modify
- `src/components/Canvas.tsx` - Add panel import and keyboard shortcuts
- `src/components/Table.tsx` - Simplify inline editing
- `src/components/Table.css` - Enhanced selection styles

## Testing Checklist
- [ ] Panel appears when table is selected
- [ ] Panel closes when clicking × or pressing Escape
- [ ] Name editing works
- [ ] Shape switching works and updates visuals
- [ ] Capacity +/- buttons work
- [ ] Capacity cannot go below assigned guests count
- [ ] Capacity cannot exceed 20
- [ ] Size presets apply correctly
- [ ] Manual dimension inputs work
- [ ] Delete button removes table with confirmation
- [ ] Assigned guests list shows correctly
- [ ] Panel repositions on mobile (bottom sheet)
- [ ] Keyboard shortcuts work (Delete, Escape, +/-)
- [ ] Selection visual indicator shows clearly

## Estimated Complexity
Low-Medium - Mostly new UI components with existing store support

## Future Enhancements
- Drag handles for freeform resizing
- Copy/duplicate table feature
- Table templates (save custom configurations)
- Undo/redo for table changes
