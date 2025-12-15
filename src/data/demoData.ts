import type { Table, Guest, Constraint, SurveyQuestion } from '../types';

export const demoTables: Table[] = [
  { id: 't1', name: 'Table 1', shape: 'round', capacity: 6, x: 200, y: 200, width: 120, height: 120 },
  { id: 't2', name: 'Table 2', shape: 'round', capacity: 6, x: 400, y: 200, width: 120, height: 120 },
  { id: 't3', name: 'Table 3', shape: 'round', capacity: 6, x: 300, y: 380, width: 120, height: 120 },
];

export const demoGuests: Guest[] = [
  // Assigned guests (5)
  { id: 'g1', firstName: 'Alice', lastName: 'Johnson', rsvpStatus: 'confirmed', tableId: 't1', relationships: [{ guestId: 'g2', type: 'partner', strength: 5 }] },
  { id: 'g2', firstName: 'Bob', lastName: 'Johnson', rsvpStatus: 'confirmed', tableId: 't1', relationships: [{ guestId: 'g1', type: 'partner', strength: 5 }] },
  { id: 'g3', firstName: 'Carol', lastName: 'Smith', rsvpStatus: 'confirmed', tableId: 't2', relationships: [] },
  { id: 'g4', firstName: 'David', lastName: 'Brown', rsvpStatus: 'confirmed', tableId: 't2', relationships: [{ guestId: 'g5', type: 'friend', strength: 3 }] },
  { id: 'g5', firstName: 'Emma', lastName: 'Davis', rsvpStatus: 'confirmed', tableId: 't3', relationships: [{ guestId: 'g4', type: 'friend', strength: 3 }] },
  // Unassigned guests (5)
  { id: 'g6', firstName: 'Frank', lastName: 'Wilson', rsvpStatus: 'confirmed', relationships: [] },
  { id: 'g7', firstName: 'Grace', lastName: 'Lee', rsvpStatus: 'confirmed', relationships: [] },
  { id: 'g8', firstName: 'Henry', lastName: 'Taylor', rsvpStatus: 'confirmed', relationships: [] },
  { id: 'g9', firstName: 'Ivy', lastName: 'Martinez', rsvpStatus: 'confirmed', relationships: [] },
  { id: 'g10', firstName: 'Jack', lastName: 'Anderson', rsvpStatus: 'confirmed', relationships: [] },
];

export const demoConstraints: Constraint[] = [];

export const demoSurveyQuestions: SurveyQuestion[] = [];

export const demoEventMetadata = {
  name: 'Demo Event',
  date: '2025-06-15',
  eventType: 'party' as const,
};
