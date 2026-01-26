import type { RSVPSettings } from '@/types';

// Default primary color for emails
export const DEFAULT_EMAIL_PRIMARY_COLOR = '#E07A5F';

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
  // Email customization defaults
  emailPrimaryColor: DEFAULT_EMAIL_PRIMARY_COLOR,
  emailSenderName: undefined,
  emailSubjectTemplate: undefined,
  emailHeaderImageUrl: undefined,
  hideSeatifyBranding: false,
  sendConfirmationEmail: true,
  includeCalendarInvite: true,
};
