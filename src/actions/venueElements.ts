'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { VenueElementType } from '@/types';

// Type for venue element data from the frontend
export interface VenueElementInput {
  id?: string;
  type: VenueElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

// Transform frontend venue element to database format
function toDbVenueElement(element: VenueElementInput, eventId: string) {
  return {
    id: element.id,
    event_id: eventId,
    type: element.type,
    label: element.label,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation ?? 0,
  };
}

// Insert a single venue element
export async function insertVenueElement(eventId: string, element: VenueElementInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const dbElement = toDbVenueElement(element, eventId);

  const { data, error } = await supabase
    .from('venue_elements')
    .insert(dbElement)
    .select()
    .single();

  if (error) {
    console.error('Error inserting venue element:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data };
}

// Batch insert venue elements
export async function insertVenueElements(eventId: string, elements: VenueElementInput[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const dbElements = elements.map(e => toDbVenueElement(e, eventId));

  const { data, error } = await supabase
    .from('venue_elements')
    .insert(dbElements)
    .select();

  if (error) {
    console.error('Error inserting venue elements:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data, count: data.length };
}

// Update a single venue element
export async function updateVenueElement(eventId: string, element: VenueElementInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (!element.id) {
    return { error: 'Venue element ID required for update' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const dbElement = toDbVenueElement(element, eventId);

  const { data, error } = await supabase
    .from('venue_elements')
    .update(dbElement)
    .eq('id', element.id)
    .eq('event_id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating venue element:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data };
}

// Batch update venue elements
export async function updateVenueElements(eventId: string, elements: VenueElementInput[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  // Update each element
  const results = await Promise.all(
    elements.map(async (element) => {
      if (!element.id) return { error: 'Venue element ID required for update' };

      const dbElement = toDbVenueElement(element, eventId);
      const { data, error } = await supabase
        .from('venue_elements')
        .update(dbElement)
        .eq('id', element.id)
        .eq('event_id', eventId)
        .select()
        .single();

      return { data, error: error?.message };
    })
  );

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    return { error: `Failed to update ${errors.length} venue elements`, details: errors };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: results.map(r => r.data), count: results.length };
}

// Delete a single venue element
export async function deleteVenueElement(eventId: string, elementId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const { error } = await supabase
    .from('venue_elements')
    .delete()
    .eq('id', elementId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting venue element:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true };
}

// Delete multiple venue elements
export async function deleteVenueElements(eventId: string, elementIds: string[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const { error } = await supabase
    .from('venue_elements')
    .delete()
    .in('id', elementIds)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting venue elements:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true, count: elementIds.length };
}
