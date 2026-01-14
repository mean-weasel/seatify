import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import type { Guest, Table, Event, Constraint } from '@/types';

// Helper to create mock guest
const createGuest = (overrides: Partial<Guest> = {}): Guest => ({
  id: `guest-${Math.random().toString(36).substr(2, 9)}`,
  firstName: 'Test',
  lastName: 'Guest',
  rsvpStatus: 'confirmed',
  relationships: [],
  interests: [],
  dietaryRestrictions: [],
  accessibilityNeeds: [],
  ...overrides,
});

// Helper to create mock table
const createTable = (overrides: Partial<Table> = {}): Table => ({
  id: `table-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Table 1',
  shape: 'round',
  capacity: 8,
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  rotation: 0,
  ...overrides,
});

// Helper to create a test event
const createTestEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  name: 'Test Event',
  eventType: 'wedding',
  tables: [],
  guests: [],
  venueElements: [],
  constraints: [],
  surveyQuestions: [],
  surveyResponses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Helper to set up store with an event
const setupStore = (eventOverrides: Partial<Event> = {}) => {
  const event = createTestEvent(eventOverrides);
  useStore.setState({
    events: [event],
    currentEventId: event.id,
    event: event,
  });
  return event;
};

describe('Constraint Violation Detection', () => {
  beforeEach(() => {
    // Reset store state before each test
    const emptyEvent = createTestEvent();
    useStore.setState({
      events: [],
      currentEventId: null,
      event: emptyEvent,
    });
  });

  describe('must_sit_together / same_table violations', () => {
    it('should detect violation when guests must sit together but are at different tables', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].constraintId).toBe('c1');
      expect(violations[0].constraintType).toBe('must_sit_together');
      expect(violations[0].guestIds).toContain('guest-1');
      expect(violations[0].guestIds).toContain('guest-2');
    });

    it('should not report violation when guests are at the same table', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-1' });
      const table = createTable({ id: 'table-1', name: 'Table 1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(0);
    });

    it('should not report violation when only one guest is assigned', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob' }); // Not assigned
      const table = createTable({ id: 'table-1', name: 'Table 1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(0);
    });

    it('should handle same_table constraint type', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'same_table',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].constraintType).toBe('same_table');
    });

    it('should detect violation with three guests at different tables', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const guest3 = createGuest({ id: 'guest-3', firstName: 'Carol', tableId: 'table-1' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2', 'guest-3'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2, guest3],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      // All three guests should be in the violation
      expect(violations[0].guestIds.length).toBe(3);
    });
  });

  describe('must_not_sit_together / different_table violations', () => {
    it('should detect violation when guests who should be apart are at the same table', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-1' });
      const table = createTable({ id: 'table-1', name: 'Table 1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].constraintId).toBe('c1');
      expect(violations[0].constraintType).toBe('must_not_sit_together');
    });

    it('should not report violation when guests are at different tables', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(0);
    });

    it('should handle different_table constraint type', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-1' });
      const table = createTable({ id: 'table-1', name: 'Table 1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'different_table',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].constraintType).toBe('different_table');
    });

    it('should detect multiple separate violations for multiple guests at same table', () => {
      // Three guests at the same table who should all be apart
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-1' });
      const guest3 = createGuest({ id: 'guest-3', firstName: 'Carol', tableId: 'table-1' });
      const table = createTable({ id: 'table-1', name: 'Table 1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2', 'guest-3'],
      };

      setupStore({
        tables: [table],
        guests: [guest1, guest2, guest3],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      // All three are at the same table, should be one violation for that table
      expect(violations.length).toBe(1);
      expect(violations[0].tableIds).toContain('table-1');
    });
  });

  describe('getViolationsForTable', () => {
    it('should return only violations for the specified table', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const guest3 = createGuest({ id: 'guest-3', firstName: 'Carol', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint1: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      const constraint2: Constraint = {
        id: 'c2',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-2', 'guest-3'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2, guest3],
        constraints: [constraint1, constraint2],
      });

      // Get violations for table-2
      const violations = useStore.getState().getViolationsForTable('table-2');

      // Should include both violations (one involves table-2, other is at table-2)
      expect(violations.length).toBeGreaterThan(0);
      violations.forEach(v => {
        expect(v.tableIds).toContain('table-2');
      });
    });

    it('should return empty array when no violations for table', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-1' });
      const table1 = createTable({ id: 'table-1', name: 'Table 1' });
      const table2 = createTable({ id: 'table-2', name: 'Table 2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      // No violations for table-2 (guests are together at table-1)
      const violations = useStore.getState().getViolationsForTable('table-2');

      expect(violations.length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty constraints array', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const table = createTable({ id: 'table-1' });

      setupStore({
        tables: [table],
        guests: [guest1],
        constraints: [],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(0);
    });

    it('should handle empty guests array', () => {
      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [],
        guests: [],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(0);
    });

    it('should handle constraint with non-existent guest IDs', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const table = createTable({ id: 'table-1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'nonexistent-guest'],
      };

      setupStore({
        tables: [table],
        guests: [guest1],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      // Only one valid guest, so no violation (need at least 2)
      expect(violations.length).toBe(0);
    });

    it('should handle constraint with single guest', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const table = createTable({ id: 'table-1' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1'],
      };

      setupStore({
        tables: [table],
        guests: [guest1],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      // Only one guest, so no violation (need at least 2)
      expect(violations.length).toBe(0);
    });

    it('should include priority level in violation', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1' });
      const table2 = createTable({ id: 'table-2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'preferred',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].priority).toBe('preferred');
    });

    it('should include description in violation when provided', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1' });
      const table2 = createTable({ id: 'table-2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
        description: 'Bride and Groom must sit together',
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].description).toBe('Bride and Groom must sit together');
    });

    it('should generate description from guest names when not provided', () => {
      const guest1 = createGuest({ id: 'guest-1', firstName: 'Alice', lastName: 'Anderson', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', firstName: 'Bob', lastName: 'Brown', tableId: 'table-2' });
      const table1 = createTable({ id: 'table-1' });
      const table2 = createTable({ id: 'table-2' });

      const constraint: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2],
        constraints: [constraint],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(1);
      expect(violations[0].description).toContain('Alice Anderson');
      expect(violations[0].description).toContain('Bob Brown');
    });
  });

  describe('Multiple constraints', () => {
    it('should detect multiple violations from different constraints', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', tableId: 'table-2' });
      const guest3 = createGuest({ id: 'guest-3', tableId: 'table-1' });
      const guest4 = createGuest({ id: 'guest-4', tableId: 'table-1' });
      const table1 = createTable({ id: 'table-1' });
      const table2 = createTable({ id: 'table-2' });

      const constraint1: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      const constraint2: Constraint = {
        id: 'c2',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-3', 'guest-4'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2, guest3, guest4],
        constraints: [constraint1, constraint2],
      });

      const violations = useStore.getState().getViolations();

      expect(violations.length).toBe(2);

      const violationTypes = violations.map(v => v.constraintType);
      expect(violationTypes).toContain('must_sit_together');
      expect(violationTypes).toContain('must_not_sit_together');
    });

    it('should handle mix of satisfied and violated constraints', () => {
      const guest1 = createGuest({ id: 'guest-1', tableId: 'table-1' });
      const guest2 = createGuest({ id: 'guest-2', tableId: 'table-1' }); // Together (satisfied)
      const guest3 = createGuest({ id: 'guest-3', tableId: 'table-1' });
      const guest4 = createGuest({ id: 'guest-4', tableId: 'table-2' }); // Apart (satisfied)
      const table1 = createTable({ id: 'table-1' });
      const table2 = createTable({ id: 'table-2' });

      const constraint1: Constraint = {
        id: 'c1',
        type: 'must_sit_together',
        priority: 'required',
        guestIds: ['guest-1', 'guest-2'],
      };

      const constraint2: Constraint = {
        id: 'c2',
        type: 'must_not_sit_together',
        priority: 'required',
        guestIds: ['guest-3', 'guest-4'],
      };

      setupStore({
        tables: [table1, table2],
        guests: [guest1, guest2, guest3, guest4],
        constraints: [constraint1, constraint2],
      });

      const violations = useStore.getState().getViolations();

      // Both constraints should be satisfied
      expect(violations.length).toBe(0);
    });
  });
});
