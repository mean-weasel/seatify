# Plan: Visual Relationship Editor

## Overview
Create an intuitive interface for managing guest relationships. Two views: a matrix grid for bulk editing and a per-guest list view for detailed relationship management.

## Priority
**Enhancement** - Improves data quality and optimization results. Currently relationships are set in demo data but can't be easily edited.

## Implementation Steps

### Step 1: Relationship Matrix Component
New component `src/components/RelationshipMatrix.tsx`:

```tsx
function RelationshipMatrix() {
  const { guests, updateGuest } = useStore();
  const confirmedGuests = guests.filter(g => g.rsvpStatus !== 'declined');

  const getRelationship = (fromId: string, toId: string) => {
    const guest = guests.find(g => g.id === fromId);
    return guest?.relationships?.find(r => r.guestId === toId);
  };

  const setRelationship = (fromId: string, toId: string, type: RelationType | null) => {
    const guest = guests.find(g => g.id === fromId);
    const relationships = guest?.relationships || [];

    if (type === null) {
      // Remove relationship
      updateGuest(fromId, {
        relationships: relationships.filter(r => r.guestId !== toId)
      });
    } else {
      // Add or update relationship
      const existing = relationships.find(r => r.guestId === toId);
      if (existing) {
        updateGuest(fromId, {
          relationships: relationships.map(r =>
            r.guestId === toId ? { ...r, type, strength: getDefaultStrength(type) } : r
          )
        });
      } else {
        updateGuest(fromId, {
          relationships: [...relationships, { guestId: toId, type, strength: getDefaultStrength(type) }]
        });
      }
    }
  };

  return (
    <div className="relationship-matrix">
      <div className="matrix-header">
        <div className="matrix-corner"></div>
        {confirmedGuests.map(guest => (
          <div key={guest.id} className="matrix-col-header" title={guest.name}>
            {getInitials(guest.name)}
          </div>
        ))}
      </div>

      {confirmedGuests.map(rowGuest => (
        <div key={rowGuest.id} className="matrix-row">
          <div className="matrix-row-header">{rowGuest.name}</div>
          {confirmedGuests.map(colGuest => (
            <MatrixCell
              key={`${rowGuest.id}-${colGuest.id}`}
              disabled={rowGuest.id === colGuest.id}
              relationship={getRelationship(rowGuest.id, colGuest.id)}
              onChange={(type) => setRelationship(rowGuest.id, colGuest.id, type)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Step 2: Matrix Cell Component
Individual cell with dropdown:

```tsx
const RELATIONSHIP_TYPES = [
  { value: null, label: '-', color: 'transparent' },
  { value: 'partner', label: 'Partner', color: '#e91e63' },
  { value: 'family', label: 'Family', color: '#9c27b0' },
  { value: 'friend', label: 'Friend', color: '#2196f3' },
  { value: 'colleague', label: 'Colleague', color: '#4caf50' },
  { value: 'avoid', label: 'Avoid', color: '#f44336' },
];

function MatrixCell({ disabled, relationship, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  if (disabled) {
    return <div className="matrix-cell disabled">-</div>;
  }

  const current = RELATIONSHIP_TYPES.find(t => t.value === relationship?.type);

  return (
    <div
      className="matrix-cell"
      style={{ backgroundColor: current?.color || 'transparent' }}
      onClick={() => setIsOpen(true)}
    >
      {current?.label?.[0] || ''}

      {isOpen && (
        <div className="cell-dropdown">
          {RELATIONSHIP_TYPES.map(type => (
            <button
              key={type.value || 'none'}
              onClick={() => {
                onChange(type.value);
                setIsOpen(false);
              }}
              style={{ borderLeftColor: type.color }}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Relationship List View (Per-Guest)
Alternative view in guest detail panel:

```tsx
function GuestRelationshipList({ guest }) {
  const { guests, updateGuest } = useStore();
  const otherGuests = guests.filter(g => g.id !== guest.id && g.rsvpStatus !== 'declined');

  const [search, setSearch] = useState('');
  const filtered = otherGuests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="guest-relationships">
      <h4>Relationships</h4>

      <input
        type="text"
        placeholder="Search guests..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="relationship-list">
        {guest.relationships?.map(rel => {
          const other = guests.find(g => g.id === rel.guestId);
          return (
            <div key={rel.guestId} className="relationship-item existing">
              <span className="guest-name">{other?.name}</span>
              <select
                value={rel.type}
                onChange={e => handleChange(rel.guestId, e.target.value)}
              >
                {RELATIONSHIP_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button onClick={() => handleRemove(rel.guestId)}>×</button>
            </div>
          );
        })}
      </div>

      <div className="add-relationship">
        <h5>Add Relationship</h5>
        {filtered.slice(0, 5).map(other => (
          <div key={other.id} className="relationship-item addable">
            <span>{other.name}</span>
            <select onChange={e => handleAdd(other.id, e.target.value)}>
              <option value="">Add...</option>
              {RELATIONSHIP_TYPES.filter(t => t.value).map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Bidirectional Relationship Sync
Option to make relationships bidirectional:

```tsx
const setBidirectionalRelationship = (guest1Id: string, guest2Id: string, type: RelationType) => {
  // Set from guest1 to guest2
  updateGuestRelationship(guest1Id, guest2Id, type);

  // Set from guest2 to guest1
  updateGuestRelationship(guest2Id, guest1Id, type);
};

function MatrixCell({ relationship, onChange, bidirectional = true }) {
  const handleChange = (type: RelationType) => {
    if (bidirectional) {
      setBidirectionalRelationship(fromId, toId, type);
    } else {
      onChange(type);
    }
  };
  // ...
}
```

### Step 5: Relationship Matrix Styling
Create `RelationshipMatrix.css`:

```css
.relationship-matrix {
  overflow: auto;
  max-height: 600px;
}

.matrix-header {
  display: flex;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.matrix-corner {
  width: 120px;
  height: 40px;
  flex-shrink: 0;
}

.matrix-col-header {
  width: 36px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.matrix-row {
  display: flex;
}

.matrix-row-header {
  width: 120px;
  padding: 0.5rem;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: sticky;
  left: 0;
  background: white;
  border-right: 1px solid #ddd;
}

.matrix-cell {
  width: 36px;
  height: 36px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  transition: transform 0.1s;
}

.matrix-cell:hover:not(.disabled) {
  transform: scale(1.1);
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.matrix-cell.disabled {
  background: #f5f5f5;
  cursor: default;
}

.cell-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
}

.cell-dropdown button {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  border-left: 4px solid;
  background: white;
  text-align: left;
  cursor: pointer;
}

.cell-dropdown button:hover {
  background: #f5f5f5;
}
```

### Step 6: Add to Guest Management View
Integrate into existing Guests tab:

```tsx
function GuestManagementView() {
  const [viewMode, setViewMode] = useState<'list' | 'relationships'>('list');

  return (
    <div className="guest-management">
      <div className="view-toggle">
        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          Guest List
        </button>
        <button
          className={viewMode === 'relationships' ? 'active' : ''}
          onClick={() => setViewMode('relationships')}
        >
          Relationships
        </button>
      </div>

      {viewMode === 'list' ? (
        <GuestListView />
      ) : (
        <RelationshipMatrix />
      )}
    </div>
  );
}
```

### Step 7: Bulk Operations
Add quick actions for common patterns:

```tsx
function RelationshipBulkActions() {
  const { guests, updateGuest } = useStore();

  const linkPartners = () => {
    // Find guests with same last name and link as family
    const byLastName = groupBy(guests, g => g.name.split(' ').pop());
    Object.values(byLastName).forEach(group => {
      if (group.length === 2) {
        setBidirectionalRelationship(group[0].id, group[1].id, 'partner');
      }
    });
  };

  const linkGroups = () => {
    // Link all guests in same group as friends
    const byGroup = groupBy(guests, g => g.group);
    Object.values(byGroup).forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          setBidirectionalRelationship(group[i].id, group[j].id, 'friend');
        }
      }
    });
  };

  return (
    <div className="bulk-actions">
      <button onClick={linkPartners}>Auto-link Partners</button>
      <button onClick={linkGroups}>Link by Group</button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}
```

## Files to Create/Modify
- `src/components/RelationshipMatrix.tsx` (new)
- `src/components/RelationshipMatrix.css` (new)
- `src/components/GuestRelationshipList.tsx` (new)
- `src/components/GuestManagementView.tsx` (add view toggle)
- `src/components/GuestDetailPanel.tsx` (add relationships section)

## Testing Checklist
- [ ] Matrix renders all confirmed guests
- [ ] Clicking cell opens dropdown
- [ ] Relationship colors display correctly
- [ ] Bidirectional sync works
- [ ] List view shows existing relationships
- [ ] Can add new relationships from list
- [ ] Can remove relationships
- [ ] Search filters guest list
- [ ] Bulk link partners works
- [ ] Bulk link groups works
- [ ] Changes persist after refresh
- [ ] Matrix scrolls with sticky headers

## Estimated Complexity
High - Matrix UI is complex, bidirectional sync needs care, bulk operations add logic
