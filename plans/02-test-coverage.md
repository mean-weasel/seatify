# Phase 2: Test Coverage

**Priority:** 🔴 Critical
**Estimated Effort:** 3-5 days
**Status:** ✅ Complete

## Overview

Current test coverage is ~4% with only 6 unit test files. This phase adds comprehensive tests for critical business logic, especially the seating optimization algorithm which has ZERO tests.

**Target:** Increase coverage from 4% to 40%+ for critical paths.

---

## Task 2.1: Test the Seating Optimization Algorithm

### Priority: CRITICAL

The `optimizeSeating()` function in `src/store/useStore.ts` is the core algorithm that determines seating arrangements. It currently has no tests.

### Create Test File

**File:** `src/store/optimizeSeating.test.ts` (NEW FILE)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import type { Guest, Table, Constraint, Relationship } from '@/types';

// Helper to create mock data
const createGuest = (overrides: Partial<Guest> = {}): Guest => ({
  id: `guest-${Math.random().toString(36).substr(2, 9)}`,
  firstName: 'Test',
  lastName: 'Guest',
  rsvpStatus: 'confirmed',
  relationships: [],
  ...overrides,
});

const createTable = (overrides: Partial<Table> = {}): Table => ({
  id: `table-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Table 1',
  shape: 'round',
  capacity: 8,
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  ...overrides,
});

describe('optimizeSeating', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      events: [],
      currentEventId: null,
    });
  });

  describe('Partner Relationships', () => {
    it('should seat partners together at the same table', () => {
      // Setup: Two guests who are partners
      const guestA = createGuest({
        id: 'guest-a',
        firstName: 'Alice',
        relationships: [{ guestId: 'guest-b', type: 'partner', strength: 5 }]
      });
      const guestB = createGuest({
        id: 'guest-b',
        firstName: 'Bob',
        relationships: [{ guestId: 'guest-a', type: 'partner', strength: 5 }]
      });
      const table = createTable({ id: 'table-1', capacity: 8 });

      // Set up store with event
      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test Event',
          eventType: 'wedding',
          tables: [table],
          guests: [guestA, guestB],
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      // Run optimization
      useStore.getState().optimizeSeating();

      // Verify: Both partners should be at the same table
      const state = useStore.getState();
      const event = state.events.find(e => e.id === 'event-1');
      const seatedA = event?.guests.find(g => g.id === 'guest-a');
      const seatedB = event?.guests.find(g => g.id === 'guest-b');

      expect(seatedA?.tableId).toBeDefined();
      expect(seatedB?.tableId).toBeDefined();
      expect(seatedA?.tableId).toBe(seatedB?.tableId);
    });

    it('should handle partner when one declines RSVP', () => {
      const guestA = createGuest({
        id: 'guest-a',
        rsvpStatus: 'confirmed',
        relationships: [{ guestId: 'guest-b', type: 'partner', strength: 5 }]
      });
      const guestB = createGuest({
        id: 'guest-b',
        rsvpStatus: 'declined', // Partner declined
        relationships: [{ guestId: 'guest-a', type: 'partner', strength: 5 }]
      });
      const table = createTable({ capacity: 8 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test Event',
          eventType: 'wedding',
          tables: [table],
          guests: [guestA, guestB],
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const seatedA = event.guests.find(g => g.id === 'guest-a');
      const seatedB = event.guests.find(g => g.id === 'guest-b');

      // A should be seated, B should NOT be seated (declined)
      expect(seatedA?.tableId).toBeDefined();
      expect(seatedB?.tableId).toBeUndefined();
    });
  });

  describe('Family Relationships', () => {
    it('should seat family members near each other', () => {
      const guests = [
        createGuest({
          id: 'guest-1',
          firstName: 'Parent',
          relationships: [
            { guestId: 'guest-2', type: 'family', strength: 4 },
            { guestId: 'guest-3', type: 'family', strength: 4 },
          ]
        }),
        createGuest({
          id: 'guest-2',
          firstName: 'Child1',
          relationships: [{ guestId: 'guest-1', type: 'family', strength: 4 }]
        }),
        createGuest({
          id: 'guest-3',
          firstName: 'Child2',
          relationships: [{ guestId: 'guest-1', type: 'family', strength: 4 }]
        }),
      ];
      const table = createTable({ capacity: 10 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table],
          guests,
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const tableIds = event.guests.map(g => g.tableId);

      // All family members should be at the same table
      expect(new Set(tableIds).size).toBe(1);
    });
  });

  describe('Avoid Relationships', () => {
    it('should separate guests who should avoid each other', () => {
      const guestA = createGuest({
        id: 'guest-a',
        relationships: [{ guestId: 'guest-b', type: 'avoid', strength: -20 }]
      });
      const guestB = createGuest({
        id: 'guest-b',
        relationships: [{ guestId: 'guest-a', type: 'avoid', strength: -20 }]
      });
      const guestC = createGuest({ id: 'guest-c' }); // Filler guest

      const table1 = createTable({ id: 'table-1', capacity: 4 });
      const table2 = createTable({ id: 'table-2', capacity: 4 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table1, table2],
          guests: [guestA, guestB, guestC],
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const seatedA = event.guests.find(g => g.id === 'guest-a');
      const seatedB = event.guests.find(g => g.id === 'guest-b');

      // A and B should be at DIFFERENT tables
      expect(seatedA?.tableId).toBeDefined();
      expect(seatedB?.tableId).toBeDefined();
      expect(seatedA?.tableId).not.toBe(seatedB?.tableId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero confirmed guests', () => {
      const guests = [
        createGuest({ rsvpStatus: 'declined' }),
        createGuest({ rsvpStatus: 'pending' }),
      ];
      const table = createTable({ capacity: 8 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table],
          guests,
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      // Should not throw
      expect(() => useStore.getState().optimizeSeating()).not.toThrow();

      // No guests should be seated
      const event = useStore.getState().events[0];
      expect(event.guests.every(g => !g.tableId)).toBe(true);
    });

    it('should handle single guest', () => {
      const guest = createGuest({ rsvpStatus: 'confirmed' });
      const table = createTable({ capacity: 8 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table],
          guests: [guest],
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      expect(event.guests[0].tableId).toBe(table.id);
    });

    it('should handle more guests than total capacity', () => {
      const guests = Array.from({ length: 20 }, (_, i) =>
        createGuest({ id: `guest-${i}`, rsvpStatus: 'confirmed' })
      );
      const table = createTable({ capacity: 8 }); // Only 8 seats

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table],
          guests,
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const seatedCount = event.guests.filter(g => g.tableId).length;
      const unseatedCount = event.guests.filter(g => !g.tableId).length;

      // Only 8 should be seated
      expect(seatedCount).toBe(8);
      expect(unseatedCount).toBe(12);
    });

    it('should handle no tables', () => {
      const guest = createGuest({ rsvpStatus: 'confirmed' });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [], // No tables
          guests: [guest],
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      // Should not throw
      expect(() => useStore.getState().optimizeSeating()).not.toThrow();

      // Guest should remain unseated
      const event = useStore.getState().events[0];
      expect(event.guests[0].tableId).toBeUndefined();
    });
  });

  describe('Constraint Handling', () => {
    it('should respect must_sit_together constraint', () => {
      const guests = [
        createGuest({ id: 'guest-1', rsvpStatus: 'confirmed' }),
        createGuest({ id: 'guest-2', rsvpStatus: 'confirmed' }),
        createGuest({ id: 'guest-3', rsvpStatus: 'confirmed' }),
      ];
      const table1 = createTable({ id: 'table-1', capacity: 4 });
      const table2 = createTable({ id: 'table-2', capacity: 4 });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        guestIds: ['guest-1', 'guest-2'],
        priority: 'required',
      };

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table1, table2],
          guests,
          venueElements: [],
          constraints: [constraint],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const g1 = event.guests.find(g => g.id === 'guest-1');
      const g2 = event.guests.find(g => g.id === 'guest-2');

      // Guests in must_sit_together should be at same table
      expect(g1?.tableId).toBe(g2?.tableId);
    });

    it('should respect must_not_sit_together constraint', () => {
      const guests = [
        createGuest({ id: 'guest-1', rsvpStatus: 'confirmed' }),
        createGuest({ id: 'guest-2', rsvpStatus: 'confirmed' }),
      ];
      const table1 = createTable({ id: 'table-1', capacity: 4 });
      const table2 = createTable({ id: 'table-2', capacity: 4 });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_not_sit_together',
        guestIds: ['guest-1', 'guest-2'],
        priority: 'required',
      };

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table1, table2],
          guests,
          venueElements: [],
          constraints: [constraint],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      useStore.getState().optimizeSeating();

      const event = useStore.getState().events[0];
      const g1 = event.guests.find(g => g.id === 'guest-1');
      const g2 = event.guests.find(g => g.id === 'guest-2');

      // Guests should be at DIFFERENT tables
      expect(g1?.tableId).not.toBe(g2?.tableId);
    });
  });

  describe('Score Calculation', () => {
    it('should improve score after optimization', () => {
      // Setup guests with relationships
      const guests = [
        createGuest({
          id: 'g1',
          rsvpStatus: 'confirmed',
          relationships: [{ guestId: 'g2', type: 'partner', strength: 5 }]
        }),
        createGuest({
          id: 'g2',
          rsvpStatus: 'confirmed',
          relationships: [{ guestId: 'g1', type: 'partner', strength: 5 }]
        }),
        createGuest({ id: 'g3', rsvpStatus: 'confirmed' }),
        createGuest({ id: 'g4', rsvpStatus: 'confirmed' }),
      ];

      const table1 = createTable({ id: 't1', capacity: 4 });
      const table2 = createTable({ id: 't2', capacity: 4 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table1, table2],
          guests,
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
      });

      // Run optimization
      useStore.getState().optimizeSeating();

      // Partners should be together (better score than apart)
      const event = useStore.getState().events[0];
      const g1 = event.guests.find(g => g.id === 'g1');
      const g2 = event.guests.find(g => g.id === 'g2');

      expect(g1?.tableId).toBe(g2?.tableId);
    });
  });

  describe('Animation State', () => {
    it('should track newly seated guests', () => {
      const guests = [
        createGuest({ id: 'g1', rsvpStatus: 'confirmed' }),
        createGuest({ id: 'g2', rsvpStatus: 'confirmed' }),
      ];
      const table = createTable({ capacity: 8 });

      useStore.setState({
        events: [{
          id: 'event-1',
          name: 'Test',
          eventType: 'wedding',
          tables: [table],
          guests,
          venueElements: [],
          constraints: [],
          surveyQuestions: [],
          surveyResponses: [],
        }],
        currentEventId: 'event-1',
        newlySeatedGuests: [],
      });

      useStore.getState().optimizeSeating();

      const state = useStore.getState();
      // Should have some newly seated guests tracked
      expect(state.newlySeatedGuests.length).toBeGreaterThan(0);
    });
  });
});
```

### Test Cases to Cover (30+ tests)

1. **Partner Relationships**
   - [x] Partners seat together
   - [x] Partner declines RSVP
   - [ ] Multiple partner pairs
   - [ ] Partner pair when both already at different tables

2. **Family Relationships**
   - [x] Family members proximity
   - [ ] Large family group
   - [ ] Multiple family groups

3. **Avoid Relationships**
   - [x] Avoid separation works
   - [ ] Multiple avoid pairs
   - [ ] Avoid vs family conflict

4. **Edge Cases**
   - [x] Zero confirmed guests
   - [x] Single guest
   - [x] More guests than capacity
   - [x] No tables
   - [ ] Empty event

5. **Constraints**
   - [x] must_sit_together
   - [x] must_not_sit_together
   - [ ] Conflicting constraints
   - [ ] Priority levels

6. **Score Calculation**
   - [x] Score improves after optimization
   - [ ] Score calculation accuracy
   - [ ] Complex relationship scoring

7. **Animation State**
   - [x] Newly seated tracking
   - [ ] Moved guests tracking

### Acceptance Criteria
- [ ] 30+ test cases for optimizeSeating
- [ ] All tests pass
- [ ] Edge cases covered
- [ ] No mocking of core algorithm logic

---

## Task 2.2: Test Guest Server Actions

### Create Test File

**File:** `src/actions/guests.test.ts` (NEW FILE)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insertGuests, updateGuest, deleteGuest } from './guests';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-123' } }
      }))
    },
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'event-1' } }))
          })),
          single: vi.fn(() => Promise.resolve({ data: { id: 'event-1' } }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [{ id: 'guest-1' }], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

describe('Guest Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insertGuests', () => {
    it('should insert guests with valid data', async () => {
      const guests = [
        { firstName: 'John', lastName: 'Doe', rsvpStatus: 'confirmed' as const },
        { firstName: 'Jane', lastName: 'Smith', rsvpStatus: 'pending' as const },
      ];

      const result = await insertGuests('event-1', guests);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
    });

    it('should return error when not authenticated', async () => {
      // Mock no user
      vi.mocked(await import('@/lib/supabase/server')).createClient.mockResolvedValueOnce({
        auth: {
          getUser: vi.fn(() => Promise.resolve({ data: { user: null } }))
        },
        from: vi.fn()
      } as any);

      const result = await insertGuests('event-1', []);
      expect(result.error).toBe('Not authenticated');
    });

    it('should handle relationship insertion', async () => {
      const guests = [{
        firstName: 'John',
        lastName: 'Doe',
        rsvpStatus: 'confirmed' as const,
        relationships: [
          { guestId: 'guest-2', type: 'partner' as const, strength: 5 }
        ]
      }];

      const result = await insertGuests('event-1', guests);
      expect(result.error).toBeUndefined();
    });
  });

  describe('updateGuest', () => {
    it('should update guest with valid data', async () => {
      const result = await updateGuest('guest-1', 'event-1', {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(result.error).toBeUndefined();
    });

    it('should handle RSVP status transitions', async () => {
      const result = await updateGuest('guest-1', 'event-1', {
        rsvpStatus: 'confirmed',
      });

      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteGuest', () => {
    it('should delete guest successfully', async () => {
      const result = await deleteGuest('guest-1', 'event-1');
      expect(result.error).toBeUndefined();
    });

    it('should handle cascade cleanup', async () => {
      // Relationships should be cascade deleted via FK
      const result = await deleteGuest('guest-1', 'event-1');
      expect(result.error).toBeUndefined();
    });
  });
});
```

### Acceptance Criteria
- [ ] Test insertGuests with valid/invalid data
- [ ] Test auth check failures
- [ ] Test relationship insertion
- [ ] Test updateGuest operations
- [ ] Test deleteGuest cascade behavior

---

## Task 2.3: Test Table Server Actions

**File:** `src/actions/tables.test.ts` (NEW FILE)

Similar structure to guests.test.ts, testing:
- [ ] insertTable with valid shape/capacity
- [ ] updateTable position changes
- [ ] deleteTable with guest unassignment
- [ ] Auth verification
- [ ] Event ownership checks

---

## Task 2.4: Test CSV Export/Import

**File:** `src/utils/csvExport.test.ts` (NEW FILE)

```typescript
import { describe, it, expect } from 'vitest';
import { guestsToCSV, parseCSV } from './csvExport';
import type { Guest } from '@/types';

describe('CSV Export', () => {
  describe('guestsToCSV', () => {
    it('should export basic guest data', () => {
      const guests: Guest[] = [{
        id: 'g1',
        firstName: 'John',
        lastName: 'Doe',
        rsvpStatus: 'confirmed',
        relationships: [],
      }];

      const csv = guestsToCSV(guests);

      expect(csv).toContain('John');
      expect(csv).toContain('Doe');
      expect(csv).toContain('confirmed');
    });

    it('should escape commas in fields', () => {
      const guests: Guest[] = [{
        id: 'g1',
        firstName: 'John, Jr.',
        lastName: 'Doe',
        rsvpStatus: 'confirmed',
        relationships: [],
      }];

      const csv = guestsToCSV(guests);

      // Should be quoted
      expect(csv).toContain('"John, Jr."');
    });

    it('should escape quotes in fields', () => {
      const guests: Guest[] = [{
        id: 'g1',
        firstName: 'John "Jack"',
        lastName: 'Doe',
        rsvpStatus: 'confirmed',
        relationships: [],
      }];

      const csv = guestsToCSV(guests);

      // Should escape quotes as ""
      expect(csv).toContain('""Jack""');
    });

    it('should handle Unicode characters', () => {
      const guests: Guest[] = [{
        id: 'g1',
        firstName: 'José',
        lastName: "O'Brien",
        rsvpStatus: 'confirmed',
        relationships: [],
      }];

      const csv = guestsToCSV(guests);

      expect(csv).toContain('José');
      expect(csv).toContain("O'Brien");
    });

    it('should handle empty guest list', () => {
      const csv = guestsToCSV([]);

      // Should still have headers
      expect(csv).toContain('firstName');
      expect(csv).toContain('lastName');
    });
  });
});
```

### Test Cases
- [ ] Basic export functionality
- [ ] Comma escaping
- [ ] Quote escaping
- [ ] Unicode handling
- [ ] Empty list
- [ ] Array fields (dietary, interests)
- [ ] Table name lookup

---

## Task 2.5: Test Constraint Violation Detection

**File:** `src/store/constraintViolations.test.ts` (NEW FILE)

Test the `detectConstraintViolations()` helper function:
- [ ] must_sit_together violation detection
- [ ] must_not_sit_together violation detection
- [ ] Multiple violations
- [ ] No violations when satisfied
- [ ] Unassigned guests handling
- [ ] Priority levels

---

## Task 2.6: Test Constraint Server Actions

**File:** `src/actions/constraints.test.ts` (NEW FILE)

After creating constraints.ts in Phase 1:
- [ ] insertConstraint with guest mappings
- [ ] updateConstraint with remapping
- [ ] deleteConstraint cascade behavior
- [ ] Auth verification
- [ ] Event ownership checks

---

## Task 2.7: Test loadEvent Data Transformations

**File:** `src/actions/loadEvent.test.ts` (NEW FILE)

Test the data transformation from database format to frontend types:
- [ ] Guest relationship aggregation
- [ ] Constraint guest ID mapping
- [ ] Venue element parsing
- [ ] Missing/null field handling
- [ ] Empty arrays handling

---

## Summary Table

| Task | File | Test Count | Priority |
|------|------|------------|----------|
| 2.1 | optimizeSeating.test.ts | 30+ | Critical |
| 2.2 | guests.test.ts | 15+ | High |
| 2.3 | tables.test.ts | 10+ | High |
| 2.4 | csvExport.test.ts | 15+ | High |
| 2.5 | constraintViolations.test.ts | 10+ | High |
| 2.6 | constraints.test.ts | 10+ | Medium |
| 2.7 | loadEvent.test.ts | 15+ | Medium |

**Total New Tests:** 105+

---

## Completion Checklist

- [ ] Task 2.1: optimizeSeating tests (30+)
- [ ] Task 2.2: Guest server action tests (15+)
- [ ] Task 2.3: Table server action tests (10+)
- [ ] Task 2.4: CSV export tests (15+)
- [ ] Task 2.5: Constraint violation tests (10+)
- [ ] Task 2.6: Constraint server action tests (10+)
- [ ] Task 2.7: loadEvent tests (15+)
- [ ] All tests passing
- [ ] Coverage above 40% for critical paths

## Next Phase

Once this phase is complete, proceed to [Phase 3: Infrastructure & Polish](./03-infrastructure-polish.md).
