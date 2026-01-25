import { describe, it, expect, afterEach } from 'vitest';
import { generateRSVPToken, buildRSVPUrl } from './utils';

describe('Email Utilities', () => {
  describe('generateRSVPToken', () => {
    it('should return a 64-character hex string', () => {
      const token = generateRSVPToken();

      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
      // Verify it's a valid hex string
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return unique values on each call', () => {
      const token1 = generateRSVPToken();
      const token2 = generateRSVPToken();
      const token3 = generateRSVPToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate many unique tokens without collision', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateRSVPToken());
      }

      expect(tokens.size).toBe(iterations);
    });
  });

  describe('buildRSVPUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

    afterEach(() => {
      // Restore original env value
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_APP_URL = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL;
      }
    });

    it('should construct correct URL format with eventId and token', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      const eventId = 'event-123';
      const token = 'abc123def456';

      const url = buildRSVPUrl(eventId, token);

      expect(url).toBe('https://example.com/rsvp/event-123/abc123def456');
    });

    it('should use NEXT_PUBLIC_APP_URL env var', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://my-custom-domain.com';
      const eventId = 'test-event';
      const token = 'test-token';

      const url = buildRSVPUrl(eventId, token);

      expect(url).toBe('https://my-custom-domain.com/rsvp/test-event/test-token');
    });

    it('should fall back to default URL when env not set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const eventId = 'event-456';
      const token = 'token-789';

      const url = buildRSVPUrl(eventId, token);

      expect(url).toBe('https://seatify.app/rsvp/event-456/token-789');
    });

    it('should handle UUID-style eventId', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://seatify.app';
      const eventId = '550e8400-e29b-41d4-a716-446655440000';
      const token = generateRSVPToken();

      const url = buildRSVPUrl(eventId, token);

      expect(url).toBe(`https://seatify.app/rsvp/${eventId}/${token}`);
      expect(url).toContain('/rsvp/');
    });

    it('should handle 64-character hex token from generateRSVPToken', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://seatify.app';
      const eventId = 'my-event';
      const token = generateRSVPToken();

      const url = buildRSVPUrl(eventId, token);

      expect(url).toMatch(/^https:\/\/seatify\.app\/rsvp\/my-event\/[0-9a-f]{64}$/);
    });
  });
});
