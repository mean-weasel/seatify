'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_RSVP_SETTINGS } from '@/lib/constants/rsvp';
import type { RSVPSettings } from '@/types';

/**
 * Load RSVP settings for an event
 */
export async function loadRSVPSettings(
  eventId: string
): Promise<{ data?: RSVPSettings; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('rsvp_settings')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error) {
    // No settings exist yet - return defaults
    if (error.code === 'PGRST116') {
      return {
        data: {
          eventId,
          ...DEFAULT_RSVP_SETTINGS,
        },
      };
    }
    console.error('Error loading RSVP settings:', error);
    return { error: error.message };
  }

  // Transform snake_case to camelCase
  const settings: RSVPSettings = {
    eventId: data.event_id,
    enabled: data.enabled,
    deadline: data.deadline,
    allowPlusOnes: data.allow_plus_ones,
    maxPlusOnes: data.max_plus_ones,
    mealOptions: data.meal_options || [],
    collectDietary: data.collect_dietary,
    collectAccessibility: data.collect_accessibility,
    collectSeatingPreferences: data.collect_seating_preferences,
    customMessage: data.custom_message,
    confirmationMessage: data.confirmation_message,
    reminderEnabled: data.reminder_enabled ?? false,
    reminderDaysBefore: data.reminder_days_before ?? 7,
    lastReminderSentAt: data.last_reminder_sent_at,
    // Email customization fields
    emailPrimaryColor: data.email_primary_color,
    emailSenderName: data.email_sender_name,
    emailSubjectTemplate: data.email_subject_template,
    emailHeaderImageUrl: data.email_header_image_url,
    hideSeatifyBranding: data.hide_seatify_branding ?? false,
    sendConfirmationEmail: data.send_confirmation_email ?? true,
    includeCalendarInvite: data.include_calendar_invite ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return { data: settings };
}

/**
 * Save RSVP settings for an event (upsert)
 */
export async function saveRSVPSettings(
  settings: RSVPSettings
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', settings.eventId)
    .eq('user_id', user.id)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found or access denied' };
  }

  // Transform camelCase to snake_case
  const dbData = {
    event_id: settings.eventId,
    enabled: settings.enabled,
    deadline: settings.deadline || null,
    allow_plus_ones: settings.allowPlusOnes,
    max_plus_ones: settings.maxPlusOnes,
    meal_options: settings.mealOptions,
    collect_dietary: settings.collectDietary,
    collect_accessibility: settings.collectAccessibility,
    collect_seating_preferences: settings.collectSeatingPreferences,
    custom_message: settings.customMessage || null,
    confirmation_message: settings.confirmationMessage || null,
    reminder_enabled: settings.reminderEnabled ?? false,
    reminder_days_before: settings.reminderDaysBefore ?? 7,
    // Email customization fields
    email_primary_color: settings.emailPrimaryColor || null,
    email_sender_name: settings.emailSenderName || null,
    email_subject_template: settings.emailSubjectTemplate || null,
    email_header_image_url: settings.emailHeaderImageUrl || null,
    hide_seatify_branding: settings.hideSeatifyBranding ?? false,
    send_confirmation_email: settings.sendConfirmationEmail ?? true,
    include_calendar_invite: settings.includeCalendarInvite ?? true,
  };

  const { error } = await supabase
    .from('rsvp_settings')
    .upsert(dbData, { onConflict: 'event_id' });

  if (error) {
    console.error('Error saving RSVP settings:', error);
    return { error: error.message };
  }

  return { success: true };
}
