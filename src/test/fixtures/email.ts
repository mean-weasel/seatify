import type { EmailLog, RSVPSettings, Guest } from '@/types';

// Mock email_logs table row
export const mockEmailLog: EmailLog = {
  id: 'email-log-123',
  eventId: 'event-456',
  guestId: 'guest-789',
  emailType: 'invitation',
  resendId: 'resend-abc-123',
  recipientEmail: 'guest@example.com',
  subject: "You're Invited: Wedding Reception",
  status: 'sent',
  sentAt: '2026-01-20T10:00:00.000Z',
  createdAt: '2026-01-20T09:59:00.000Z',
};

// Mock email log in different states
export const mockPendingEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-pending',
  status: 'pending',
  resendId: undefined,
  sentAt: undefined,
};

export const mockDeliveredEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-delivered',
  status: 'delivered',
  deliveredAt: '2026-01-20T10:01:00.000Z',
};

export const mockOpenedEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-opened',
  status: 'opened',
  deliveredAt: '2026-01-20T10:01:00.000Z',
  openedAt: '2026-01-20T10:30:00.000Z',
};

export const mockBouncedEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-bounced',
  status: 'bounced',
  errorMessage: 'Mailbox not found',
};

export const mockFailedEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-failed',
  status: 'failed',
  errorMessage: 'Recipient marked as spam',
};

export const mockReminderEmailLog: EmailLog = {
  ...mockEmailLog,
  id: 'email-log-reminder',
  emailType: 'reminder',
  subject: 'Reminder: Please RSVP for Wedding Reception',
};

// Resend webhook event types
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked'
  | 'email.unsubscribed';

interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    bounce?: {
      message: string;
    };
  };
}

// Mock Resend webhook payloads
export const mockResendWebhookEvent: ResendWebhookEvent = {
  type: 'email.sent',
  created_at: '2026-01-20T10:00:00.000Z',
  data: {
    email_id: 'resend-abc-123',
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
  },
};

export const mockResendDeliveredEvent: ResendWebhookEvent = {
  type: 'email.delivered',
  created_at: '2026-01-20T10:01:00.000Z',
  data: {
    email_id: 'resend-abc-123',
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
  },
};

export const mockResendOpenedEvent: ResendWebhookEvent = {
  type: 'email.opened',
  created_at: '2026-01-20T10:30:00.000Z',
  data: {
    email_id: 'resend-abc-123',
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
  },
};

export const mockResendBouncedEvent: ResendWebhookEvent = {
  type: 'email.bounced',
  created_at: '2026-01-20T10:00:30.000Z',
  data: {
    email_id: 'resend-abc-123',
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
    bounce: {
      message: 'Mailbox not found',
    },
  },
};

export const mockResendComplainedEvent: ResendWebhookEvent = {
  type: 'email.complained',
  created_at: '2026-01-20T12:00:00.000Z',
  data: {
    email_id: 'resend-abc-123',
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
  },
};

// Mock guest with email and RSVP token
export const mockGuestWithEmail: Guest = {
  id: 'guest-789',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  rsvpToken: 'rsvp-token-abc123xyz',
  rsvpStatus: 'pending',
  relationships: [],
};

export const mockGuestWithEmailConfirmed: Guest = {
  ...mockGuestWithEmail,
  id: 'guest-confirmed',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  rsvpToken: 'rsvp-token-def456uvw',
  rsvpStatus: 'confirmed',
  rsvpRespondedAt: '2026-01-18T14:00:00.000Z',
  mealPreference: 'Vegetarian',
};

export const mockGuestWithEmailDeclined: Guest = {
  ...mockGuestWithEmail,
  id: 'guest-declined',
  firstName: 'Bob',
  lastName: 'Johnson',
  email: 'bob.johnson@example.com',
  rsvpToken: 'rsvp-token-ghi789rst',
  rsvpStatus: 'declined',
  rsvpRespondedAt: '2026-01-19T09:00:00.000Z',
};

export const mockGuestNoEmail: Guest = {
  ...mockGuestWithEmail,
  id: 'guest-no-email',
  firstName: 'No',
  lastName: 'Email',
  email: undefined,
  rsvpToken: undefined,
};

// Mock RSVP settings with reminders enabled
export const mockRsvpSettings: RSVPSettings = {
  eventId: 'event-456',
  enabled: true,
  deadline: '2026-02-01T23:59:59.000Z',
  allowPlusOnes: true,
  maxPlusOnes: 1,
  mealOptions: ['Chicken', 'Fish', 'Vegetarian', 'Vegan'],
  collectDietary: true,
  collectAccessibility: true,
  collectSeatingPreferences: true,
  customMessage: 'We are excited to celebrate with you!',
  confirmationMessage: 'Thank you for your RSVP!',
  reminderEnabled: true,
  reminderDaysBefore: 7,
  lastReminderSentAt: undefined,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-15T12:00:00.000Z',
};

export const mockRsvpSettingsDisabled: RSVPSettings = {
  ...mockRsvpSettings,
  enabled: false,
  reminderEnabled: false,
};

export const mockRsvpSettingsNoReminders: RSVPSettings = {
  ...mockRsvpSettings,
  reminderEnabled: false,
  reminderDaysBefore: undefined,
};

export const mockRsvpSettingsReminderSent: RSVPSettings = {
  ...mockRsvpSettings,
  lastReminderSentAt: '2026-01-25T08:00:00.000Z',
};

// Factory functions for creating customized fixtures
export const createMockEmailLog = (overrides: Partial<EmailLog> = {}): EmailLog => ({
  ...mockEmailLog,
  id: `email-log-${Date.now()}`,
  ...overrides,
});

export const createMockGuestWithEmail = (overrides: Partial<Guest> = {}): Guest => ({
  ...mockGuestWithEmail,
  id: `guest-${Date.now()}`,
  rsvpToken: `rsvp-token-${Date.now()}`,
  ...overrides,
});

export const createMockRsvpSettings = (overrides: Partial<RSVPSettings> = {}): RSVPSettings => ({
  ...mockRsvpSettings,
  ...overrides,
});

export const createMockResendWebhookEvent = (
  type: ResendEventType,
  emailId: string = 'resend-abc-123',
  overrides: Partial<ResendWebhookEvent['data']> = {}
): ResendWebhookEvent => ({
  type,
  created_at: new Date().toISOString(),
  data: {
    email_id: emailId,
    from: 'noreply@seatify.app',
    to: ['guest@example.com'],
    subject: "You're Invited: Wedding Reception",
    ...overrides,
  },
});
