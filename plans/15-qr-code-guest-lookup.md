# Plan: QR Code Guest Lookup Feature

## Overview
Enable guests to find their seat by scanning a QR code. Includes public guest lookup page, staff lookup mode, and sharing features.

## Priority
**High** - Modern guest experience feature that differentiates from competitors.

---

## Dependencies

```bash
npm install qrcode.react
```

---

## Feature 1: QR Code Generation

### Component: QRCodeDisplay.tsx

```tsx
import { QRCodeSVG } from 'qrcode.react';

export function QRCodeDisplay({
  size = 200,
  showInstructions = true,
  forPrint = false
}: QRCodeDisplayProps) {
  const { event } = useStore();

  const baseUrl = window.location.origin + window.location.pathname;
  const lookupUrl = `${baseUrl}#/find-seat`;

  const handleDownloadQR = () => {
    // Convert SVG to PNG and download
    const svg = document.querySelector('.qr-code-svg');
    // ... canvas conversion logic
  };

  return (
    <div className="qr-code-display">
      <QRCodeSVG
        value={lookupUrl}
        size={size}
        level="M"
        includeMargin={true}
      />

      {showInstructions && (
        <>
          <p>Guests can scan this QR code to find their seat</p>
          <div className="qr-actions">
            <button onClick={handleCopyLink}>Copy Link</button>
            <button onClick={handleDownloadQR}>Download QR</button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Feature 2: Guest Seat Lookup Page

### Route Setup (App.tsx)

```tsx
if (route.startsWith('#/find-seat')) {
  return <FindSeatPage />;
}
```

### Component: FindSeatPage.tsx

**Flow:**
1. `search` - Guest enters their name
2. `result` - Shows table assignment
3. `not-found` - Seat not yet assigned

**Features:**
- Fuzzy name matching (handles typos)
- Auto-suggestions as you type
- Shows familiar faces at same table
- Mobile-first design

```tsx
export function FindSeatPage() {
  const [step, setStep] = useState<'search' | 'result' | 'not-found'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Fuzzy matching for name variations
  const suggestions = useMemo(() => {
    return event.guests
      .map(g => ({ guest: g, score: fuzzyMatch(searchQuery, g.name) }))
      .filter(m => m.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [searchQuery]);

  // Find guests the selected guest knows at their table
  const familiarTablemates = useMemo(() => {
    if (!selectedGuest?.tableId) return [];
    const tablemates = event.guests.filter(g => g.tableId === selectedGuest.tableId);
    const knownIds = selectedGuest.relationships.map(r => r.guestId);
    return tablemates.filter(g => knownIds.includes(g.id));
  }, [selectedGuest]);

  return (
    <div className="find-seat-page">
      <header>
        <h1>{event.name}</h1>
        <p>Find Your Seat</p>
      </header>

      {step === 'search' && (
        <form onSubmit={handleSearch}>
          <input
            placeholder="Enter your name..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map(({guest}) => (
                <li onClick={() => handleSelectGuest(guest)}>
                  {guest.name}
                </li>
              ))}
            </ul>
          )}
          <button type="submit">Find My Seat</button>
        </form>
      )}

      {step === 'result' && (
        <div className="result-card success">
          <h2>Welcome, {selectedGuest.name.split(' ')[0]}!</h2>
          <div className="table-assignment">
            <span className="label">Your Table</span>
            <span className="value">{guestTable.name}</span>
          </div>
          {familiarTablemates.length > 0 && (
            <div className="familiar-faces">
              <h3>People you know at your table:</h3>
              <ul>{familiarTablemates.map(g => <li>{g.name}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {step === 'not-found' && (
        <div className="result-card warning">
          <h2>Seat Not Yet Assigned</h2>
          <p>Please check with the host.</p>
        </div>
      )}
    </div>
  );
}
```

### Fuzzy Matching Algorithm

```typescript
function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Exact match
  if (t === q) return 1.0;

  // Contains full query
  if (t.includes(q)) return 0.9;

  // Check first/last name parts
  const queryParts = q.split(/\s+/);
  const targetParts = t.split(/\s+/);

  let matchCount = 0;
  for (const qPart of queryParts) {
    if (targetParts.some(tPart => tPart.startsWith(qPart))) {
      matchCount++;
    }
  }

  return matchCount > 0 ? 0.5 + (matchCount / queryParts.length) * 0.4 : 0;
}
```

---

## Feature 3: Staff Lookup Mode

### Route
```tsx
if (route.startsWith('#/staff-lookup')) {
  return <StaffLookupPage />;
}
```

### Features
- Search by name, email, or group
- Shows full guest details (dietary, accessibility, notes)
- Mini floor plan with highlighted table
- Quick access for event staff

```tsx
export function StaffLookupPage() {
  return (
    <div className="staff-lookup-page">
      <div className="search-panel">
        <input placeholder="Search guest..." />
        <ul className="guest-results">
          {filteredGuests.map(guest => (
            <li onClick={() => setSelectedGuest(guest)}>
              <span>{guest.name}</span>
              <span>{getTableName(guest.tableId)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="details-panel">
        {selectedGuest && (
          <>
            <h2>{selectedGuest.name}</h2>
            <div className="detail-grid">
              <div><label>Table</label><span>{tableName}</span></div>
              <div><label>RSVP</label><span>{selectedGuest.rsvpStatus}</span></div>
              <div><label>Group</label><span>{selectedGuest.group}</span></div>
            </div>
            {selectedGuest.dietaryRestrictions && (
              <div className="dietary-tags">
                {selectedGuest.dietaryRestrictions.map(d => (
                  <span className="tag">{d}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Mini Floor Plan */}
        <div className="mini-floor-plan">
          {tables.map(table => (
            <div
              className={table.id === selectedGuest?.tableId ? 'highlighted' : ''}
              style={{ left: `${relX}%`, top: `${relY}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Feature 4: Integration Points

### PrintView.tsx
Add QR code to printed seating chart:

```tsx
<section className="print-qr-section">
  <h2>Find Your Seat</h2>
  <QRCodeDisplay size={120} forPrint={true} />
  <p>{lookupUrl}</p>
</section>
```

### DashboardView.tsx
Add share button:

```tsx
<button onClick={() => setShowShareModal(true)}>
  Share Seat Finder
</button>
```

### ShareModal.tsx

```tsx
export function ShareModal({ onClose }) {
  return (
    <div className="share-modal">
      <h2>Share Seat Finder</h2>
      <QRCodeDisplay size={200} />

      <div className="sharing-tips">
        <h3>Sharing Tips</h3>
        <ul>
          <li>Include in email invitations</li>
          <li>Print and display at venue entrance</li>
          <li>Add to event program or menu cards</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Files to Create

- `src/components/QRCodeDisplay.tsx`
- `src/components/QRCodeDisplay.css`
- `src/components/FindSeatPage.tsx`
- `src/components/FindSeatPage.css`
- `src/components/StaffLookupPage.tsx`
- `src/components/StaffLookupPage.css`
- `src/components/ShareModal.tsx`
- `src/components/ShareModal.css`

## Files to Modify

- `src/App.tsx` - Add routes
- `src/components/PrintView.tsx` - Add QR code
- `src/components/DashboardView.tsx` - Add share button

---

## Mobile Design Considerations

- Large touch targets (44px minimum)
- Auto-focus search input
- Full-screen result cards
- Swipe to dismiss
- Bottom-anchored action buttons

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Guest not found | "We couldn't find that name. Please try again or check with the host." |
| Seat not assigned | "Your seat hasn't been assigned yet. Please check with the host." |
| Multiple matches | Show suggestion list |
| Guest declined | Filter from search results |

---

## Testing Checklist

- [ ] QR code generates valid URL
- [ ] QR code downloads as PNG
- [ ] Link copies to clipboard
- [ ] FindSeatPage loads at #/find-seat
- [ ] Fuzzy search handles typos
- [ ] Suggestions list works
- [ ] Result shows table and seat
- [ ] Familiar faces shown correctly
- [ ] Not-assigned state displays
- [ ] StaffLookupPage loads at #/staff-lookup
- [ ] Mini floor plan highlights correct table
- [ ] QR code appears in print preview
- [ ] Mobile responsive on all pages

---

## Implementation Sequence

1. **Phase 1** - QRCodeDisplay component + routes
2. **Phase 2** - FindSeatPage with fuzzy search
3. **Phase 3** - StaffLookupPage
4. **Phase 4** - Integration (PrintView, ShareModal)
5. **Phase 5** - Polish and accessibility

---

## Estimated Complexity
**Medium** - Mostly new UI components with existing data patterns.
