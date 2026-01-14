import { describe, it, expect } from 'vitest';
import {
  encodeTableData,
  decodeTableData,
  validateQRData,
  getGuestCountText,
} from './qrCodeUtils';
import type { Event, Table, QRTableData } from '../types';

// Helper to create a minimal mock event
const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  name: 'Test Event',
  date: '2026-06-15',
  tables: [],
  guests: [],
  venueElements: [],
  constraints: [],
  surveyQuestions: [],
  surveyResponses: [],
  ...overrides,
});

// Helper to create a minimal mock table
const createMockTable = (overrides: Partial<Table> = {}): Table => ({
  id: 'table-1',
  name: 'Table 1',
  shape: 'round',
  capacity: 8,
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  ...overrides,
});

describe('QR Code Utils', () => {
  describe('encodeTableData', () => {
    it('should encode table data to URL-safe base64', () => {
      const event = createMockEvent({
        guests: [
          { id: 'g1', firstName: 'John', lastName: 'Doe', tableId: 'table-1', rsvpStatus: 'confirmed', relationships: [] },
          { id: 'g2', firstName: 'Jane', lastName: 'Smith', tableId: 'table-1', rsvpStatus: 'confirmed', relationships: [] },
        ],
      });
      const table = createMockTable();

      const encoded = encodeTableData(event, table);

      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Should not contain URL-unsafe characters
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('should only include confirmed guests at the table', () => {
      const event = createMockEvent({
        guests: [
          { id: 'g1', firstName: 'John', lastName: 'Doe', tableId: 'table-1', rsvpStatus: 'confirmed', relationships: [] },
          { id: 'g2', firstName: 'Jane', lastName: 'Smith', tableId: 'table-1', rsvpStatus: 'pending', relationships: [] },
          { id: 'g3', firstName: 'Bob', lastName: 'Jones', tableId: 'table-2', rsvpStatus: 'confirmed', relationships: [] },
          { id: 'g4', firstName: 'Alice', lastName: 'Brown', tableId: 'table-1', rsvpStatus: 'declined', relationships: [] },
        ],
      });
      const table = createMockTable();

      const encoded = encodeTableData(event, table);
      const decoded = decodeTableData(encoded);

      expect(decoded?.g).toHaveLength(1);
      expect(decoded?.g[0]).toBe('John Doe');
    });

    it('should handle empty guest list', () => {
      const event = createMockEvent({ guests: [] });
      const table = createMockTable();

      const encoded = encodeTableData(event, table);
      const decoded = decodeTableData(encoded);

      expect(decoded?.g).toHaveLength(0);
    });
  });

  describe('decodeTableData', () => {
    it('should decode valid encoded data', () => {
      const event = createMockEvent({
        guests: [
          { id: 'g1', firstName: 'John', lastName: 'Doe', tableId: 'table-1', rsvpStatus: 'confirmed', relationships: [] },
        ],
      });
      const table = createMockTable({ name: 'VIP Table', capacity: 10 });

      const encoded = encodeTableData(event, table);
      const decoded = decodeTableData(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.v).toBe(1);
      expect(decoded?.e).toBe('Test Event');
      expect(decoded?.d).toBe('2026-06-15');
      expect(decoded?.t).toBe('VIP Table');
      expect(decoded?.c).toBe(10);
      expect(decoded?.g).toEqual(['John Doe']);
    });

    it('should return null for invalid base64', () => {
      const result = decodeTableData('not-valid-base64!!!');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      // Encode something that's not JSON
      const encoded = btoa('not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const result = decodeTableData(encoded);
      expect(result).toBeNull();
    });

    it('should return null for invalid data structure', () => {
      // Encode valid JSON but wrong structure
      const encoded = btoa(JSON.stringify({ foo: 'bar' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const result = decodeTableData(encoded);
      expect(result).toBeNull();
    });

    it('should handle URL-safe base64 encoding', () => {
      const event = createMockEvent();
      const table = createMockTable();

      const encoded = encodeTableData(event, table);
      // Verify roundtrip works with URL-safe characters
      const decoded = decodeTableData(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.e).toBe('Test Event');
    });
  });

  describe('validateQRData', () => {
    it('should validate correct QR data structure', () => {
      const validData: QRTableData = {
        v: 1,
        e: 'Event Name',
        d: '2026-06-15',
        t: 'Table 1',
        g: ['John Doe', 'Jane Smith'],
        c: 8,
      };

      expect(validateQRData(validData)).toBe(true);
    });

    it('should reject null', () => {
      expect(validateQRData(null)).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(validateQRData('string')).toBe(false);
      expect(validateQRData(123)).toBe(false);
      expect(validateQRData([])).toBe(false);
    });

    it('should reject data with missing required fields', () => {
      expect(validateQRData({ v: 1, e: 'Event' })).toBe(false);
      expect(validateQRData({ v: 1, e: 'Event', t: 'Table' })).toBe(false);
      expect(validateQRData({ v: 1, e: 'Event', t: 'Table', g: [] })).toBe(false);
    });

    it('should reject data with wrong types', () => {
      expect(validateQRData({ v: '1', e: 'Event', t: 'Table', g: [], c: 8 })).toBe(false);
      expect(validateQRData({ v: 1, e: 123, t: 'Table', g: [], c: 8 })).toBe(false);
      expect(validateQRData({ v: 1, e: 'Event', t: 'Table', g: 'not array', c: 8 })).toBe(false);
    });

    it('should reject guests array with non-string elements', () => {
      expect(validateQRData({ v: 1, e: 'Event', t: 'Table', g: [123, 'name'], c: 8 })).toBe(false);
    });

    it('should accept optional null date', () => {
      const dataWithNullDate: QRTableData = {
        v: 1,
        e: 'Event Name',
        d: null,
        t: 'Table 1',
        g: [],
        c: 8,
      };

      expect(validateQRData(dataWithNullDate)).toBe(true);
    });
  });

  describe('getGuestCountText', () => {
    it('should return "No guests assigned yet" for empty guest list', () => {
      const data: QRTableData = { v: 1, e: 'Event', t: 'Table', g: [], c: 8 };
      expect(getGuestCountText(data)).toBe('No guests assigned yet');
    });

    it('should return singular text for one guest', () => {
      const data: QRTableData = { v: 1, e: 'Event', t: 'Table', g: ['John Doe'], c: 8 };
      expect(getGuestCountText(data)).toBe('1 guest assigned (8 seats)');
    });

    it('should return plural text for multiple guests', () => {
      const data: QRTableData = { v: 1, e: 'Event', t: 'Table', g: ['John Doe', 'Jane Smith'], c: 8 };
      expect(getGuestCountText(data)).toBe('2 guests assigned (8 seats)');
    });

    it('should include correct capacity', () => {
      const data: QRTableData = { v: 1, e: 'Event', t: 'Table', g: ['John'], c: 10 };
      expect(getGuestCountText(data)).toContain('10 seats');
    });
  });
});
