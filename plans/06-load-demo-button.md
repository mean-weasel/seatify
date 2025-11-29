# Plan: Load Demo Button

## Overview
Add a prominent "Load Demo" button that instantly populates the app with realistic sample data, allowing users to immediately explore all features without manual setup.

## Priority
**Quick Win** - High impact, low effort. Essential for demos and first-time users.

## Implementation Steps

### Step 1: Embed Demo Data in TypeScript
Create a new file `src/data/demoData.ts` that exports the wedding demo data as typed constants:

```typescript
import type { Table, Guest, Constraint, SurveyQuestion } from '../types';

export const demoTables: Table[] = [/* wedding-demo.json tables */];
export const demoGuests: Guest[] = [/* wedding-demo.json guests */];
export const demoConstraints: Constraint[] = [/* wedding-demo.json constraints */];
export const demoSurveyQuestions: SurveyQuestion[] = [/* wedding-demo.json survey */];

export const demoEventMetadata = {
  name: "Sarah & John's Wedding",
  date: "2025-06-15",
  type: "wedding" as const,
};
```

### Step 2: Add Store Action
Add a `loadDemoData` action to `useStore.ts`:

```typescript
loadDemoData: () => set((state) => ({
  tables: demoTables,
  guests: demoGuests,
  constraints: demoConstraints,
  surveyQuestions: demoSurveyQuestions,
  eventName: demoEventMetadata.name,
  eventDate: demoEventMetadata.date,
  eventType: demoEventMetadata.type,
})),
```

### Step 3: Add Button to Header
Add a styled "Load Demo" button in `Header.tsx` next to existing actions:

```tsx
<button
  className="demo-btn"
  onClick={() => {
    if (hasData && !confirm('This will replace your current data. Continue?')) return;
    loadDemoData();
  }}
>
  <span className="demo-icon">✨</span>
  Load Demo
</button>
```

### Step 4: Style the Button
Add CSS for the demo button with attention-grabbing animation:

```css
.demo-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
}
```

### Step 5: Empty State Call-to-Action
Add prominent demo CTA to empty states in Dashboard and Floor Plan:

```tsx
{guests.length === 0 && (
  <div className="empty-state">
    <h3>No guests yet</h3>
    <p>Add guests manually or load demo data to explore</p>
    <button onClick={loadDemoData} className="cta-btn">
      Load Wedding Demo
    </button>
  </div>
)}
```

## Files to Modify
- `src/data/demoData.ts` (new)
- `src/store/useStore.ts`
- `src/components/Header.tsx`
- `src/components/Header.css`
- `src/components/DashboardView.tsx`
- `src/components/FloorPlanView.tsx`

## Testing Checklist
- [ ] Demo data loads correctly with all 27 guests
- [ ] All 7 tables appear in floor plan
- [ ] Constraints are visible in Guests tab
- [ ] Survey questions appear in Survey tab
- [ ] Confirmation prompt appears if data exists
- [ ] Button animation runs smoothly
- [ ] Empty state CTA works
- [ ] Data persists after page refresh

## Estimated Complexity
Low - Primarily data extraction and UI wiring
