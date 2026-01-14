import { describe, it, expect } from 'vitest';
import {
  encodeShareableUrl,
  decodeShareableUrl,
  minifyEventData,
  expandShareableData,
  isShareUrlTooLarge,
  getShareUrlLength,
} from './shareableEventUtils';
import type { Event } from '../types';

// Helper to create a minimal mock event
const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  name: 'Test Wedding',
  date: '2026-06-15',
  tables: [
    { id: 't1', name: 'Table 1', shape: 'round', capacity: 8, x: 100, y: 100, width: 100, height: 100 },
    { id: 't2', name: 'Table 2', shape: 'rectangle', capacity: 10, x: 300, y: 100, width: 150, height: 80 },
  ],
  guests: [
    { id: 'g1', firstName: 'John', lastName: 'Doe', tableId: 't1', seatIndex: 0, rsvpStatus: 'confirmed', relationships: [] },
    { id: 'g2', firstName: 'Jane', lastName: 'Smith', tableId: 't1', seatIndex: 1, rsvpStatus: 'pending', relationships: [] },
    { id: 'g3', firstName: 'Bob', lastName: 'Wilson', group: 'Family', rsvpStatus: 'declined', relationships: [] },
  ],
  venueElements: [
    { id: 'v1', type: 'stage', label: 'Main Stage', x: 200, y: 50, width: 200, height: 50 },
  ],
  constraints: [
    { id: 'c1', type: 'keep_together', guestIds: ['g1', 'g2'], priority: 'required' },
  ],
  surveyQuestions: [],
  surveyResponses: [],
  ...overrides,
});

describe('Shareable Event Utils', () => {
  describe('minifyEventData', () => {
    it('should minify event data with short keys', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);

      expect(minified.v).toBe(1); // Version
      expect(minified.n).toBe('Test Wedding'); // Name
      expect(minified.d).toBe('2026-06-15'); // Date
      expect(minified.T).toHaveLength(2); // Tables
      expect(minified.G).toHaveLength(3); // Guests
      expect(minified.V).toHaveLength(1); // Venue elements
      expect(minified.C).toHaveLength(1); // Constraints
    });

    it('should minify table data correctly', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const table = minified.T[0];

      expect(table.i).toBe('t1'); // id
      expect(table.n).toBe('Table 1'); // name
      expect(table.s).toBe('round'); // shape
      expect(table.c).toBe(8); // capacity
      expect(table.x).toBe(100);
      expect(table.y).toBe(100);
    });

    it('should minify guest data correctly', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const guest = minified.G[0];

      expect(guest.i).toBe('g1'); // id
      expect(guest.f).toBe('John'); // firstName
      expect(guest.l).toBe('Doe'); // lastName
      expect(guest.t).toBe('t1'); // tableId
      expect(guest.s).toBe(0); // seatIndex
    });

    it('should only include RSVP status when not pending', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);

      // g1 is confirmed (not pending), should have r
      expect(minified.G[0].r).toBe(1);
      // g2 is pending, should not have r
      expect(minified.G[1].r).toBeUndefined();
      // g3 is declined, should have r
      expect(minified.G[2].r).toBe(2);
    });

    it('should omit empty optional arrays', () => {
      const event = createMockEvent({
        venueElements: [],
        constraints: [],
      });
      const minified = minifyEventData(event);

      expect(minified.V).toBeUndefined();
      expect(minified.C).toBeUndefined();
    });
  });

  describe('expandShareableData', () => {
    it('should expand minified data back to full structure', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const expanded = expandShareableData(minified);

      expect(expanded.name).toBe('Test Wedding');
      expect(expanded.date).toBe('2026-06-15');
      expect(expanded.tables).toHaveLength(2);
      expect(expanded.guests).toHaveLength(3);
    });

    it('should restore table properties', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const expanded = expandShareableData(minified);
      const table = expanded.tables![0];

      expect(table.id).toBe('t1');
      expect(table.name).toBe('Table 1');
      expect(table.shape).toBe('round');
      expect(table.capacity).toBe(8);
    });

    it('should restore guest properties', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const expanded = expandShareableData(minified);
      const guest = expanded.guests![0];

      expect(guest.id).toBe('g1');
      expect(guest.firstName).toBe('John');
      expect(guest.lastName).toBe('Doe');
      expect(guest.tableId).toBe('t1');
    });

    it('should restore RSVP status correctly', () => {
      const event = createMockEvent();
      const minified = minifyEventData(event);
      const expanded = expandShareableData(minified);

      expect(expanded.guests![0].rsvpStatus).toBe('confirmed');
      expect(expanded.guests![1].rsvpStatus).toBe('pending');
      expect(expanded.guests![2].rsvpStatus).toBe('declined');
    });
  });

  describe('encodeShareableUrl / decodeShareableUrl', () => {
    it('should encode and decode event data successfully', () => {
      const event = createMockEvent();
      const encoded = encodeShareableUrl(event);
      const decoded = decodeShareableUrl(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.name).toBe('Test Wedding');
      expect(decoded?.tables).toHaveLength(2);
      expect(decoded?.guests).toHaveLength(3);
    });

    it('should produce URL-safe encoded string', () => {
      const event = createMockEvent();
      const encoded = encodeShareableUrl(event);

      // Should not contain URL-unsafe characters
      expect(encoded).not.toMatch(/[+/=]/);
      // Should only contain URL-safe base64 characters
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should compress data significantly', () => {
      const event = createMockEvent();
      const jsonLength = JSON.stringify(event).length;
      const encoded = encodeShareableUrl(event);

      // Encoded should be smaller than raw JSON (due to compression)
      expect(encoded.length).toBeLessThan(jsonLength);
    });

    it('should return null for invalid encoded data', () => {
      expect(decodeShareableUrl('invalid-data')).toBeNull();
      expect(decodeShareableUrl('')).toBeNull();
    });

    it('should handle events with special characters in names', () => {
      const event = createMockEvent({
        name: "John & Jane's Wedding!",
        guests: [
          { id: 'g1', firstName: 'José', lastName: "O'Brien", rsvpStatus: 'confirmed', relationships: [] },
        ],
      });

      const encoded = encodeShareableUrl(event);
      const decoded = decodeShareableUrl(encoded);

      expect(decoded?.name).toBe("John & Jane's Wedding!");
      expect(decoded?.guests?.[0].firstName).toBe('José');
      expect(decoded?.guests?.[0].lastName).toBe("O'Brien");
    });

    it('should preserve dietary restrictions', () => {
      const event = createMockEvent({
        guests: [
          { id: 'g1', firstName: 'John', lastName: 'Doe', dietaryRestrictions: ['Vegetarian', 'Gluten-Free'], rsvpStatus: 'confirmed', relationships: [] },
        ],
      });

      const encoded = encodeShareableUrl(event);
      const decoded = decodeShareableUrl(encoded);

      expect(decoded?.guests?.[0].dietaryRestrictions).toEqual(['Vegetarian', 'Gluten-Free']);
    });

    it('should preserve accessibility needs', () => {
      const event = createMockEvent({
        guests: [
          { id: 'g1', firstName: 'John', lastName: 'Doe', accessibilityNeeds: ['Wheelchair'], rsvpStatus: 'confirmed', relationships: [] },
        ],
      });

      const encoded = encodeShareableUrl(event);
      const decoded = decodeShareableUrl(encoded);

      expect(decoded?.guests?.[0].accessibilityNeeds).toEqual(['Wheelchair']);
    });
  });

  describe('isShareUrlTooLarge', () => {
    it('should return false for small events', () => {
      const event = createMockEvent();
      expect(isShareUrlTooLarge(event)).toBe(false);
    });

    it('should return true for very large events', () => {
      // Create an event with many guests to exceed the limit
      const guests = Array.from({ length: 500 }, (_, i) => ({
        id: `guest-${i}`,
        firstName: `FirstName${i}WithLongText`,
        lastName: `LastName${i}WithMoreText`,
        tableId: `table-${i % 50}`,
        group: `Group${i % 10}`,
        dietaryRestrictions: ['Vegetarian', 'Gluten-Free', 'Dairy-Free'],
        accessibilityNeeds: ['Wheelchair', 'Hearing Aid'],
        rsvpStatus: 'confirmed' as const,
        relationships: [],
      }));

      const tables = Array.from({ length: 50 }, (_, i) => ({
        id: `table-${i}`,
        name: `Table ${i + 1}`,
        shape: 'round' as const,
        capacity: 10,
        x: (i % 10) * 150,
        y: Math.floor(i / 10) * 150,
        width: 100,
        height: 100,
      }));

      const event = createMockEvent({ guests, tables });
      expect(isShareUrlTooLarge(event)).toBe(true);
    });
  });

  describe('getShareUrlLength', () => {
    it('should return the encoded URL length', () => {
      const event = createMockEvent();
      const length = getShareUrlLength(event);

      expect(typeof length).toBe('number');
      expect(length).toBeGreaterThan(0);
    });

    it('should increase with more data', () => {
      const smallEvent = createMockEvent({ guests: [] });
      const largeEvent = createMockEvent();

      expect(getShareUrlLength(largeEvent)).toBeGreaterThan(getShareUrlLength(smallEvent));
    });
  });
});
