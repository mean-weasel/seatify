'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Constraint } from '@/types';

// Type for constraint data from the frontend
export interface ConstraintInput {
  id?: string;
  type: Constraint['type'];
  priority: Constraint['priority'];
  guestIds: string[];
  description?: string;
}

// Insert a single constraint with its guest associations
export async function insertConstraint(eventId: string, constraint: ConstraintInput) {
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

  // Insert the constraint
  const { data: constraintData, error: constraintError } = await supabase
    .from('constraints')
    .insert({
      event_id: eventId,
      constraint_type: constraint.type,
      priority: constraint.priority,
      description: constraint.description || null,
    })
    .select()
    .single();

  if (constraintError) {
    console.error('Error inserting constraint:', constraintError);
    return { error: constraintError.message };
  }

  // Insert the guest associations
  if (constraint.guestIds.length > 0) {
    const guestAssociations = constraint.guestIds.map(guestId => ({
      constraint_id: constraintData.id,
      guest_id: guestId,
    }));

    const { error: guestError } = await supabase
      .from('constraint_guests')
      .insert(guestAssociations);

    if (guestError) {
      console.error('Error inserting constraint guests:', guestError);
      // Clean up the constraint if guest associations failed
      await supabase.from('constraints').delete().eq('id', constraintData.id);
      return { error: guestError.message };
    }
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return {
    data: {
      id: constraintData.id,
      type: constraint.type,
      priority: constraint.priority,
      guestIds: constraint.guestIds,
      description: constraint.description,
    }
  };
}

// Update a constraint and its guest associations
export async function updateConstraint(eventId: string, constraintId: string, updates: Partial<ConstraintInput>) {
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

  // Update the constraint itself
  const dbUpdates: Record<string, unknown> = {};
  if (updates.type) dbUpdates.constraint_type = updates.type;
  if (updates.priority) dbUpdates.priority = updates.priority;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;

  if (Object.keys(dbUpdates).length > 0) {
    const { error: constraintError } = await supabase
      .from('constraints')
      .update(dbUpdates)
      .eq('id', constraintId)
      .eq('event_id', eventId);

    if (constraintError) {
      console.error('Error updating constraint:', constraintError);
      return { error: constraintError.message };
    }
  }

  // Update guest associations if provided
  if (updates.guestIds !== undefined) {
    // Delete existing associations
    const { error: deleteError } = await supabase
      .from('constraint_guests')
      .delete()
      .eq('constraint_id', constraintId);

    if (deleteError) {
      console.error('Error deleting constraint guests:', deleteError);
      return { error: deleteError.message };
    }

    // Insert new associations
    if (updates.guestIds.length > 0) {
      const guestAssociations = updates.guestIds.map(guestId => ({
        constraint_id: constraintId,
        guest_id: guestId,
      }));

      const { error: insertError } = await supabase
        .from('constraint_guests')
        .insert(guestAssociations);

      if (insertError) {
        console.error('Error inserting constraint guests:', insertError);
        return { error: insertError.message };
      }
    }
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true };
}

// Delete a constraint and its guest associations
export async function deleteConstraint(eventId: string, constraintId: string) {
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

  // Delete guest associations first (due to foreign key constraint)
  const { error: guestError } = await supabase
    .from('constraint_guests')
    .delete()
    .eq('constraint_id', constraintId);

  if (guestError) {
    console.error('Error deleting constraint guests:', guestError);
    return { error: guestError.message };
  }

  // Delete the constraint
  const { error } = await supabase
    .from('constraints')
    .delete()
    .eq('id', constraintId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting constraint:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true };
}

// Delete multiple constraints
export async function deleteConstraints(eventId: string, constraintIds: string[]) {
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

  // Delete guest associations first
  const { error: guestError } = await supabase
    .from('constraint_guests')
    .delete()
    .in('constraint_id', constraintIds);

  if (guestError) {
    console.error('Error deleting constraint guests:', guestError);
    return { error: guestError.message };
  }

  // Delete the constraints
  const { error } = await supabase
    .from('constraints')
    .delete()
    .in('id', constraintIds)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting constraints:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { success: true, count: constraintIds.length };
}
