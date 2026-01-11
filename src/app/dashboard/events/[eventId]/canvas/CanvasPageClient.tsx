'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Canvas } from '@/components/Canvas';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import type { Event, Table, Guest, Constraint, VenueElement, Relationship } from '@/types';

interface DbEvent {
  id: string;
  user_id: string;
  name: string;
  event_type: string;
  date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  guest_capacity_limit: number | null;
  created_at: string;
  updated_at: string;
  tables: DbTable[];
  guests: DbGuest[];
  constraints: DbConstraint[];
  venue_elements: DbVenueElement[];
}

interface DbTable {
  id: string;
  event_id: string;
  name: string;
  shape: string;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number | null;
}

interface DbGuest {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  job_title: string | null;
  group_name: string | null;
  rsvp_status: string;
  notes: string | null;
  table_id: string | null;
  seat_index: number | null;
  canvas_x: number | null;
  canvas_y: number | null;
}

interface DbConstraint {
  id: string;
  event_id: string;
  constraint_type: string;
  priority: string;
  description: string | null;
}

interface DbVenueElement {
  id: string;
  event_id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number | null;
}

interface DbRelationship {
  id: string;
  event_id: string;
  guest_id: string;
  related_guest_id: string;
  relationship_type: string;
  strength: number;
}

interface CanvasPageClientProps {
  event: DbEvent;
  relationships: DbRelationship[];
}

// Transform database format to app format
function transformEvent(dbEvent: DbEvent, relationships: DbRelationship[]): Event {
  // Build relationship map for each guest
  const relationshipMap = new Map<string, Relationship[]>();

  relationships.forEach((rel) => {
    if (!relationshipMap.has(rel.guest_id)) {
      relationshipMap.set(rel.guest_id, []);
    }
    relationshipMap.get(rel.guest_id)!.push({
      guestId: rel.related_guest_id,
      type: rel.relationship_type as Relationship['type'],
      strength: rel.strength,
    });
  });

  const tables: Table[] = (dbEvent.tables || []).map((t) => ({
    id: t.id,
    name: t.name,
    shape: t.shape as Table['shape'],
    capacity: t.capacity,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    rotation: t.rotation || 0,
  }));

  const guests: Guest[] = (dbEvent.guests || []).map((g) => ({
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    email: g.email || undefined,
    company: g.company || undefined,
    jobTitle: g.job_title || undefined,
    group: g.group_name || undefined,
    rsvpStatus: g.rsvp_status as Guest['rsvpStatus'],
    notes: g.notes || undefined,
    tableId: g.table_id || undefined,
    seatIndex: g.seat_index ?? undefined,
    canvasX: g.canvas_x ?? undefined,
    canvasY: g.canvas_y ?? undefined,
    relationships: relationshipMap.get(g.id) || [],
  }));

  const constraints: Constraint[] = (dbEvent.constraints || []).map((c) => ({
    id: c.id,
    type: c.constraint_type as Constraint['type'],
    priority: c.priority as Constraint['priority'],
    description: c.description || undefined,
    guestIds: [], // Will need to fetch from constraint_guests
  }));

  const venueElements: VenueElement[] = (dbEvent.venue_elements || []).map((v) => ({
    id: v.id,
    type: v.type as VenueElement['type'],
    label: v.label,
    x: v.x,
    y: v.y,
    width: v.width,
    height: v.height,
    rotation: v.rotation || 0,
  }));

  return {
    id: dbEvent.id,
    name: dbEvent.name,
    eventType: dbEvent.event_type as Event['eventType'],
    date: dbEvent.date || undefined,
    venueName: dbEvent.venue_name || undefined,
    venueAddress: dbEvent.venue_address || undefined,
    guestCapacityLimit: dbEvent.guest_capacity_limit ?? undefined,
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
    tables,
    guests,
    constraints,
    venueElements,
    surveyQuestions: [],
    surveyResponses: [],
  };
}

export function CanvasPageClient({ event: dbEvent, relationships }: CanvasPageClientProps) {
  const { loadEvent, event } = useStore();

  // Transform and load event into store on mount
  useEffect(() => {
    const transformedEvent = transformEvent(dbEvent, relationships);

    // Load event into store
    loadEvent(transformedEvent);
  }, [dbEvent, relationships, loadEvent]);

  // Don't render until event is loaded
  if (!event || event.id !== dbEvent.id) {
    return (
      <div className="canvas-loading">
        <p>Loading seating chart...</p>
      </div>
    );
  }

  return (
    <div className="event-layout">
      <Header />
      <div className="event-content">
        <Canvas />
        <Sidebar />
      </div>
    </div>
  );
}
