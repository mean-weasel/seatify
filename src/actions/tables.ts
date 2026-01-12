'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TableShape } from '@/types';

// Type for table data from the frontend
export interface TableInput {
  id?: string;
  name: string;
  shape: TableShape;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

// Transform frontend table to database format
function toDbTable(table: TableInput, eventId: string) {
  return {
    id: table.id,
    event_id: eventId,
    name: table.name,
    shape: table.shape,
    capacity: table.capacity,
    x: table.x,
    y: table.y,
    width: table.width,
    height: table.height,
    rotation: table.rotation ?? 0,
  };
}

// Insert a single table
export async function insertTable(eventId: string, table: TableInput) {
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

  const dbTable = toDbTable(table, eventId);

  const { data, error } = await supabase
    .from('tables')
    .insert(dbTable)
    .select()
    .single();

  if (error) {
    console.error('Error inserting table:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data };
}

// Batch insert tables
export async function insertTables(eventId: string, tables: TableInput[]) {
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

  const dbTables = tables.map(t => toDbTable(t, eventId));

  const { data, error } = await supabase
    .from('tables')
    .insert(dbTables)
    .select();

  if (error) {
    console.error('Error inserting tables:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data, count: data.length };
}

// Update a single table
export async function updateTable(eventId: string, table: TableInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (!table.id) {
    return { error: 'Table ID required for update' };
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

  const dbTable = toDbTable(table, eventId);

  const { data, error } = await supabase
    .from('tables')
    .update(dbTable)
    .eq('id', table.id)
    .eq('event_id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating table:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data };
}

// Batch update tables
export async function updateTables(eventId: string, tables: TableInput[]) {
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

  // Update each table
  const results = await Promise.all(
    tables.map(async (table) => {
      if (!table.id) return { error: 'Table ID required for update' };

      const dbTable = toDbTable(table, eventId);
      const { data, error } = await supabase
        .from('tables')
        .update(dbTable)
        .eq('id', table.id)
        .eq('event_id', eventId)
        .select()
        .single();

      return { data, error: error?.message };
    })
  );

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    return { error: `Failed to update ${errors.length} tables`, details: errors };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: results.map(r => r.data), count: results.length };
}

// Delete a single table
export async function deleteTable(eventId: string, tableId: string) {
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
    .from('tables')
    .delete()
    .eq('id', tableId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting table:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true };
}

// Delete multiple tables
export async function deleteTables(eventId: string, tableIds: string[]) {
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
    .from('tables')
    .delete()
    .in('id', tableIds)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting tables:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true, count: tableIds.length };
}
