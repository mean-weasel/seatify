import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from './route';
import {
  mockResendWebhookEvent,
  mockResendDeliveredEvent,
  mockResendOpenedEvent,
  mockResendBouncedEvent,
  mockResendComplainedEvent,
  createMockResendWebhookEvent,
} from '@/test/fixtures/email';

// Mock @supabase/supabase-js createClient
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('Email Webhook API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Configure mock chain
    mockEq.mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/email/webhook', () => {
    it('returns 401 when webhook secret configured but signature missing', async () => {
      process.env.RESEND_WEBHOOK_SECRET = 'test-webhook-secret';

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendWebhookEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Missing signature' });
    });

    it('handles email.sent event - updates status to sent', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendWebhookEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'sent',
        sent_at: mockResendWebhookEvent.created_at,
      });
      expect(mockEq).toHaveBeenCalledWith('resend_id', mockResendWebhookEvent.data.email_id);
    });

    it('handles email.delivered event - updates status to delivered with delivered_at', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendDeliveredEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'delivered',
        delivered_at: mockResendDeliveredEvent.created_at,
      });
      expect(mockEq).toHaveBeenCalledWith('resend_id', mockResendDeliveredEvent.data.email_id);
    });

    it('handles email.opened event - updates status to opened with opened_at', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendOpenedEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'opened',
        opened_at: mockResendOpenedEvent.created_at,
      });
      expect(mockEq).toHaveBeenCalledWith('resend_id', mockResendOpenedEvent.data.email_id);
    });

    it('handles email.bounced event - updates status to bounced with error_message', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendBouncedEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'bounced',
        error_message: 'Mailbox not found',
      });
      expect(mockEq).toHaveBeenCalledWith('resend_id', mockResendBouncedEvent.data.email_id);
    });

    it('handles email.bounced event with default error message when bounce message missing', async () => {
      const bouncedEventNoBounceMessage = createMockResendWebhookEvent('email.bounced');
      // Remove the bounce property
      delete (bouncedEventNoBounceMessage.data as Record<string, unknown>).bounce;

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(bouncedEventNoBounceMessage),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'bounced',
        error_message: 'Email bounced',
      });
    });

    it('handles email.complained event - updates status to failed', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendComplainedEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'failed',
        error_message: 'Recipient marked as spam',
      });
      expect(mockEq).toHaveBeenCalledWith('resend_id', mockResendComplainedEvent.data.email_id);
    });

    it('ignores unknown event types gracefully', async () => {
      const unknownEvent = createMockResendWebhookEvent('email.clicked' as never);

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(unknownEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      // Should not attempt database update for unknown events
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('ignores email.delivery_delayed event gracefully', async () => {
      const delayedEvent = createMockResendWebhookEvent('email.delivery_delayed');

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(delayedEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns { received: true } on success', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendWebhookEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
    });

    it('accepts request with valid signature when webhook secret is configured', async () => {
      process.env.RESEND_WEBHOOK_SECRET = 'test-webhook-secret';

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendWebhookEvent),
        headers: {
          'Content-Type': 'application/json',
          'svix-signature': 'v1,test-signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
    });

    it('returns 400 on invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid request' });
    });

    it('still returns success even when database update fails', async () => {
      // Configure mock to simulate database error
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/email/webhook', {
        method: 'POST',
        body: JSON.stringify(mockResendWebhookEvent),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return success to prevent Resend retries
      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update email log:',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /api/email/webhook', () => {
    it('returns { status: ok } for endpoint verification', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });
});
