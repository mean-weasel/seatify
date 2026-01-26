import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockGuestWithEmail,
  mockPendingEmailLog,
  createMockGuestWithEmail,
} from '@/test/fixtures/email';
import { mockResendSend, resetResendMocks } from '@/test/mocks/resend';

// Mock the admin client
const mockSupabaseFrom = vi.fn();
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// Mock @react-email/components render
vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>Mock Email</html>'),
}));

// Variable to control whether resend is configured
let resendConfigured = true;
const mockResend = {
  emails: {
    send: mockResendSend,
  },
};

vi.mock('./resend', () => ({
  get resend() {
    return resendConfigured ? mockResend : null;
  },
  EMAIL_FROM: 'noreply@seatify.app',
  EMAIL_BATCH_SIZE: 100,
}));

// Mock the email templates
vi.mock('./templates/invitation', () => ({
  InvitationEmail: vi.fn(() => null),
}));

vi.mock('./templates/reminder', () => ({
  ReminderEmail: vi.fn(() => null),
}));

// Mock the utils
vi.mock('./utils', () => ({
  generateRSVPToken: vi.fn(() => 'mock-generated-token-abc123'),
  buildRSVPUrl: vi.fn(
    (eventId: string, token: string) =>
      `https://seatify.app/rsvp/${eventId}/${token}`
  ),
}));

// Import functions after mocks are set up
import { ensureGuestToken, sendInvitationEmail, sendReminderEmail, sendBatchInvitations } from './send';
import { generateRSVPToken } from './utils';

describe('Email Send Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetResendMocks();
    resendConfigured = true;
  });

  afterEach(() => {
    resendConfigured = true;
  });

  // Helper to setup mock Supabase responses
  const setupSupabaseMocks = (options: {
    selectResult?: { data: unknown; error: unknown };
    insertResult?: { data: unknown; error: unknown };
    updateResult?: { data: unknown; error: unknown };
  }) => {
    const selectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(options.selectResult ?? { data: null, error: null }),
      }),
    };

    const insertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(options.insertResult ?? { data: null, error: null }),
      }),
    };

    const updateChain = {
      eq: vi.fn().mockResolvedValue(options.updateResult ?? { data: null, error: null }),
    };

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'guests') {
        return {
          select: vi.fn().mockReturnValue(selectChain),
          update: vi.fn().mockReturnValue(updateChain),
        };
      }
      if (table === 'email_logs') {
        return {
          insert: vi.fn().mockReturnValue(insertChain),
          update: vi.fn().mockReturnValue(updateChain),
        };
      }
      return {};
    });

    return { selectChain, insertChain, updateChain };
  };

  describe('ensureGuestToken', () => {
    it('should return existing token if guest has one', async () => {
      const existingToken = 'existing-rsvp-token-xyz789';
      setupSupabaseMocks({
        selectResult: { data: { rsvp_token: existingToken }, error: null },
      });

      const result = await ensureGuestToken('guest-123');

      expect(result).toBe(existingToken);
      // Should not call generateRSVPToken since guest has token
      expect(generateRSVPToken).not.toHaveBeenCalled();
    });

    it('should generate and save new token if guest does not have one', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { rsvp_token: null }, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      const result = await ensureGuestToken('guest-123');

      expect(result).toBe('mock-generated-token-abc123');
      expect(generateRSVPToken).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith({ rsvp_token: 'mock-generated-token-abc123' });
    });

    it('should generate token when guest has no token field', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      const result = await ensureGuestToken('guest-456');

      expect(result).toBe('mock-generated-token-abc123');
      expect(generateRSVPToken).toHaveBeenCalled();
    });
  });

  describe('sendInvitationEmail', () => {
    const invitationParams = {
      guestId: mockGuestWithEmail.id,
      guestName: `${mockGuestWithEmail.firstName} ${mockGuestWithEmail.lastName}`,
      guestEmail: mockGuestWithEmail.email!,
      eventId: 'event-456',
      eventName: 'Wedding Reception',
      eventDate: '2026-06-15',
      hostName: 'John & Jane',
      customMessage: 'We hope you can make it!',
      deadline: '2026-02-01',
      rsvpToken: mockGuestWithEmail.rsvpToken!,
    };

    it('should return error when Resend not configured', async () => {
      resendConfigured = false;

      const result = await sendInvitationEmail(invitationParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('should create email_logs entry with pending status', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'email-log-123' },
            error: null,
          }),
        }),
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: insertMock,
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: 'resend-abc' }, error: null });

      await sendInvitationEmail(invitationParams);

      expect(insertMock).toHaveBeenCalledWith({
        event_id: invitationParams.eventId,
        guest_id: invitationParams.guestId,
        email_type: 'invitation',
        recipient_email: invitationParams.guestEmail,
        subject: `You're Invited: ${invitationParams.eventName}`,
        status: 'pending',
      });
    });

    it('should update email_logs to sent on success with resend_id', async () => {
      const resendId = 'resend-success-123';
      const emailLogId = 'email-log-123';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: emailLogId },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: resendId }, error: null });

      const result = await sendInvitationEmail(invitationParams);

      expect(result.success).toBe(true);
      expect(result.resendId).toBe(resendId);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          resend_id: resendId,
          sent_at: expect.any(String),
        })
      );
    });

    it('should update email_logs to failed with error message on failure', async () => {
      const errorMessage = 'Invalid email address';
      const emailLogId = 'email-log-123';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: emailLogId },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const result = await sendInvitationEmail(invitationParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: errorMessage,
        })
      );
    });

    it('should handle thrown exceptions and update email_logs to failed', async () => {
      const emailLogId = 'email-log-123';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: emailLogId },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockRejectedValue(new Error('Network failure'));

      const result = await sendInvitationEmail(invitationParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Network failure',
        })
      );
    });

    it('should send email with correct parameters', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'email-log-123' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

      await sendInvitationEmail(invitationParams);

      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'noreply@seatify.app',
        to: invitationParams.guestEmail,
        subject: `You're Invited: ${invitationParams.eventName}`,
        html: '<html>Mock Email</html>',
      });
    });
  });

  describe('sendReminderEmail', () => {
    const reminderParams = {
      guestId: mockGuestWithEmail.id,
      guestName: `${mockGuestWithEmail.firstName} ${mockGuestWithEmail.lastName}`,
      guestEmail: mockGuestWithEmail.email!,
      eventId: 'event-456',
      eventName: 'Wedding Reception',
      eventDate: '2026-06-15',
      hostName: 'John & Jane',
      deadline: '2026-02-01',
      daysUntilDeadline: 7,
      rsvpToken: mockGuestWithEmail.rsvpToken!,
    };

    it('should return error when Resend not configured', async () => {
      resendConfigured = false;

      const result = await sendReminderEmail(reminderParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should use correct subject line for reminders', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'email-log-123' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

      await sendReminderEmail(reminderParams);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `Reminder: Please RSVP for ${reminderParams.eventName}`,
        })
      );
    });

    it('should create email_logs entry with reminder type', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'email-log-123' },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: insertMock,
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

      await sendReminderEmail(reminderParams);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email_type: 'reminder',
          subject: `Reminder: Please RSVP for ${reminderParams.eventName}`,
        })
      );
    });

    it('should update email_logs to sent on success', async () => {
      const resendId = 'resend-reminder-123';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'email-log-123' },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: { id: resendId }, error: null });

      const result = await sendReminderEmail(reminderParams);

      expect(result.success).toBe(true);
      expect(result.resendId).toBe(resendId);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          resend_id: resendId,
        })
      );
    });

    it('should update email_logs to failed on Resend error', async () => {
      const errorMessage = 'Rate limit exceeded';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'email-log-123' },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      });

      mockResendSend.mockResolvedValue({ data: null, error: { message: errorMessage } });

      const result = await sendReminderEmail(reminderParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: errorMessage,
        })
      );
    });
  });

  describe('sendBatchInvitations', () => {
    const eventId = 'event-456';
    const eventDetails = {
      eventName: 'Wedding Reception',
      eventDate: '2026-06-15',
      hostName: 'John & Jane',
      customMessage: 'Please join us!',
      deadline: '2026-02-01',
    };

    const createTestGuests = (count: number) =>
      Array.from({ length: count }, (_, i) =>
        createMockGuestWithEmail({
          id: `guest-${i}`,
          firstName: `Guest${i}`,
          lastName: `Test`,
          email: `guest${i}@example.com`,
          rsvpToken: `token-${i}`,
        })
      ).map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email!,
        rsvpToken: g.rsvpToken!,
      }));

    beforeEach(() => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'email_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: `email-log-${Date.now()}` },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return {};
      });
    });

    it('should process guests in batches', async () => {
      const guests = createTestGuests(3);
      mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

      const result = await sendBatchInvitations(eventId, guests, eventDetails);

      expect(result.total).toBe(3);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockResendSend).toHaveBeenCalledTimes(3);
    });

    it('should return correct sent/failed counts', async () => {
      const guests = createTestGuests(5);

      // Fail emails for guests 1 and 3
      mockResendSend.mockImplementation(({ to }) => {
        if (to === 'guest1@example.com' || to === 'guest3@example.com') {
          return Promise.resolve({ data: null, error: { message: 'Invalid email' } });
        }
        return Promise.resolve({ data: { id: 'resend-123' }, error: null });
      });

      const result = await sendBatchInvitations(eventId, guests, eventDetails);

      expect(result.total).toBe(5);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(2);
    });

    it('should handle partial failures gracefully', async () => {
      const guests = createTestGuests(4);

      // Mix of successes and failures
      let callCount = 0;
      mockResendSend.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.resolve({ data: null, error: { message: 'Temporary failure' } });
        }
        return Promise.resolve({ data: { id: `resend-${callCount}` }, error: null });
      });

      const result = await sendBatchInvitations(eventId, guests, eventDetails);

      expect(result.total).toBe(4);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(2);
      expect(result.results).toHaveLength(4);

      // Verify results contain correct data
      const successResults = result.results.filter((r) => r.success);
      const failedResults = result.results.filter((r) => !r.success);

      expect(successResults).toHaveLength(2);
      expect(failedResults).toHaveLength(2);

      // Check that failed results have error messages
      failedResults.forEach((r) => {
        expect(r.error).toBe('Temporary failure');
      });
    });

    it('should include guest information in results', async () => {
      const guests = createTestGuests(2);
      mockResendSend.mockResolvedValue({ data: { id: 'resend-abc' }, error: null });

      const result = await sendBatchInvitations(eventId, guests, eventDetails);

      expect(result.results[0]).toMatchObject({
        guestId: 'guest-0',
        email: 'guest0@example.com',
        success: true,
      });
      expect(result.results[1]).toMatchObject({
        guestId: 'guest-1',
        email: 'guest1@example.com',
        success: true,
      });
    });

    it('should handle empty guest list', async () => {
      const result = await sendBatchInvitations(eventId, [], eventDetails);

      expect(result.total).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('should handle thrown exceptions during batch processing', async () => {
      const guests = createTestGuests(3);

      mockResendSend
        .mockResolvedValueOnce({ data: { id: 'resend-1' }, error: null })
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({ data: { id: 'resend-3' }, error: null });

      const result = await sendBatchInvitations(eventId, guests, eventDetails);

      expect(result.total).toBe(3);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);

      const failedResult = result.results.find((r) => !r.success);
      expect(failedResult?.error).toBe('Connection timeout');
    });
  });
});
