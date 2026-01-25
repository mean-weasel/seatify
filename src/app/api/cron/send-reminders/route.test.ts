import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Store original env before any modifications
const originalEnv = { ...process.env };

// Mock @supabase/supabase-js before importing route
const mockSupabaseFrom = vi.fn();
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock sendReminderEmail and ensureGuestToken
const mockSendReminderEmail = vi.fn();
const mockEnsureGuestToken = vi.fn();

vi.mock('@/lib/email/send', () => ({
  sendReminderEmail: (...args: unknown[]) => mockSendReminderEmail(...args),
  ensureGuestToken: (...args: unknown[]) => mockEnsureGuestToken(...args),
}));

describe('GET /api/cron/send-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Default mock implementations
    mockSendReminderEmail.mockResolvedValue({ success: true, resendId: 'resend-123' });
    mockEnsureGuestToken.mockResolvedValue('generated-token-123');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createRequest = (headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/cron/send-reminders', {
      method: 'GET',
      headers: new Headers(headers),
    });
  };

  // Helper to import fresh route module
  const importRoute = async () => {
    vi.resetModules();
    // Re-mock after reset
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => mockSupabaseClient),
    }));
    vi.doMock('@/lib/email/send', () => ({
      sendReminderEmail: (...args: unknown[]) => mockSendReminderEmail(...args),
      ensureGuestToken: (...args: unknown[]) => mockEnsureGuestToken(...args),
    }));
    const routeModule = await import('./route');
    return routeModule;
  };

  describe('Authentication', () => {
    it('should return 401 when CRON_SECRET is configured but auth header is missing', async () => {
      process.env.CRON_SECRET = 'my-secret-key';
      const { GET } = await importRoute();

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 when CRON_SECRET is configured but auth header is wrong', async () => {
      process.env.CRON_SECRET = 'my-secret-key';
      const { GET } = await importRoute();

      const request = createRequest({
        authorization: 'Bearer wrong-secret',
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should allow request when CRON_SECRET matches', async () => {
      process.env.CRON_SECRET = 'my-secret-key';
      const { GET } = await importRoute();

      // Mock no settings to keep test simple
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const request = createRequest({
        authorization: 'Bearer my-secret-key',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should allow request when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('No reminders to send', () => {
    it('should return "No reminders to send" when no events have reminders enabled', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe('No reminders to send');
      expect(body.sent).toBe(0);
    });

    it('should return "No reminders to send" when data is null', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe('No reminders to send');
      expect(body.sent).toBe(0);
    });
  });

  describe('Skipping events', () => {
    it('should skip events without deadline set', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const settingsNoDeadline = {
        event_id: 'event-1',
        deadline: null, // No deadline
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [settingsNoDeadline],
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(body.results).toEqual([]);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('should skip events where deadline has passed (daysUntilDeadline < 0)', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      // Create deadline that is in the past
      const pastDeadline = new Date();
      pastDeadline.setDate(pastDeadline.getDate() - 5); // 5 days ago

      const settingsPastDeadline = {
        event_id: 'event-1',
        deadline: pastDeadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [settingsPastDeadline],
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('should skip events where daysUntilDeadline > reminderDaysBefore', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      // Deadline is 15 days away, but reminder is set for 7 days before
      const futureDeadline = new Date();
      futureDeadline.setDate(futureDeadline.getDate() + 15);

      const settingsFarDeadline = {
        event_id: 'event-1',
        deadline: futureDeadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7, // Only send when 7 or fewer days until deadline
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [settingsFarDeadline],
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('should skip events where reminder was sent within last 24 hours', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      // Deadline is 5 days away (within reminder window)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      // Last reminder was sent 10 hours ago (< 24 hours)
      const lastSent = new Date();
      lastSent.setHours(lastSent.getHours() - 10);

      const settingsRecentReminder = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: lastSent.toISOString(), // Sent within 24 hours
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [settingsRecentReminder],
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });
  });

  describe('Sending reminders', () => {
    it('should only send to pending guests who received invitation', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      const pendingGuestWithInvitation = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        rsvp_token: 'token-123',
      };

      // Set up mock chain for multiple from() calls
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ guest_id: 'guest-1' }], // Only guest-1 received invitation
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: [pendingGuestWithInvitation],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        // Fallback for any other table
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(1);
      expect(body.results).toHaveLength(1);
      expect(body.results[0].eventId).toBe('event-1');
      expect(body.results[0].sent).toBe(1);

      expect(mockSendReminderEmail).toHaveBeenCalledTimes(1);
      expect(mockSendReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          guestId: 'guest-1',
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          eventId: 'event-1',
          eventName: 'Test Event',
          rsvpToken: 'token-123',
        })
      );
    });

    it('should use ensureGuestToken when guest has no token', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      const guestWithoutToken = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        rsvp_token: null, // No token
      };

      mockEnsureGuestToken.mockResolvedValue('newly-generated-token');

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ guest_id: 'guest-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: [guestWithoutToken],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockEnsureGuestToken).toHaveBeenCalledWith('guest-1');
      expect(mockSendReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          rsvpToken: 'newly-generated-token',
        })
      );
    });

    it('should update last_reminder_sent_at after sending', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      const guest = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        rsvp_token: 'token-123',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ guest_id: 'guest-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: [guest],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: mockUpdate,
        };
      });

      const request = createRequest();
      await GET(request);

      // Verify update was called with last_reminder_sent_at
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          last_reminder_sent_at: expect.any(String),
        })
      );
    });

    it('should return correct sent count and results array', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      const guests = [
        {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          rsvp_token: 'token-1',
        },
        {
          id: 'guest-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          rsvp_token: 'token-2',
        },
        {
          id: 'guest-3',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com',
          rsvp_token: 'token-3',
        },
      ];

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: guests.map((g) => ({ guest_id: g.id })),
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: guests,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.message).toBe('Sent 3 reminders');
      expect(body.sent).toBe(3);
      expect(body.results).toHaveLength(1);
      expect(body.results[0]).toEqual({
        eventId: 'event-1',
        sent: 3,
      });
    });

    it('should continue processing other guests when one fails', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      const guests = [
        {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          rsvp_token: 'token-1',
        },
        {
          id: 'guest-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          rsvp_token: 'token-2',
        },
      ];

      // First call succeeds, second fails
      mockSendReminderEmail
        .mockResolvedValueOnce({ success: true, resendId: 'id-1' })
        .mockRejectedValueOnce(new Error('Email send failed'));

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: guests.map((g) => ({ guest_id: g.id })),
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: guests,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      // Only 1 succeeded (the other threw)
      expect(body.sent).toBe(1);
      expect(mockSendReminderEmail).toHaveBeenCalledTimes(2);
    });

    it('should skip events with no guests that received invitations', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [], // No invitations sent
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('should skip events with no pending guests', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const validSettings = {
        event_id: 'event-1',
        deadline: deadline.toISOString(),
        reminder_enabled: true,
        reminder_days_before: 7,
        last_reminder_sent_at: null,
        events: {
          id: 'event-1',
          name: 'Test Event',
          date: '2026-03-01',
          user_id: 'user-1',
          profiles: { display_name: 'Host Name' },
        },
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'rsvp_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [validSettings],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'email_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ guest_id: 'guest-1' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'guests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({
                        data: [], // No pending guests
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.sent).toBe(0);
      expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 when settings query fails', async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await importRoute();

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to fetch settings');
    });
  });
});

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    mockSendReminderEmail.mockResolvedValue({ success: true, resendId: 'resend-123' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const importRoute = async () => {
    vi.resetModules();
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => mockSupabaseClient),
    }));
    vi.doMock('@/lib/email/send', () => ({
      sendReminderEmail: (...args: unknown[]) => mockSendReminderEmail(...args),
      ensureGuestToken: (...args: unknown[]) => mockEnsureGuestToken(...args),
    }));
    const routeModule = await import('./route');
    return routeModule;
  };

  it('should call GET handler (for manual triggering)', async () => {
    delete process.env.CRON_SECRET;
    const { POST } = await importRoute();

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('No reminders to send');
    expect(body.sent).toBe(0);
  });
});
