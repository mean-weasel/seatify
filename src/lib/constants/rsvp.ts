import type { RSVPSettings } from '@/types';

// Default RSVP settings for new events
export const DEFAULT_RSVP_SETTINGS: Omit<RSVPSettings, 'eventId'> = {
  enabled: false,
  allowPlusOnes: true,
  maxPlusOnes: 1,
  mealOptions: [],
  collectDietary: true,
  collectAccessibility: true,
  collectSeatingPreferences: true,
  reminderEnabled: false,
  reminderDaysBefore: 7,
};
