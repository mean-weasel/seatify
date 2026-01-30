import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const originalLocation = window.location;

beforeEach(() => {
  vi.clearAllMocks();

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000/settings/billing',
      origin: 'http://localhost:3000',
    },
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

// Import after mocking
import {
  startCheckout,
  openCustomerPortal,
  openPaymentMethodUpdate,
  openSubscriptionCancel,
  openSubscriptionChange,
} from './client';

describe('Stripe client functions', () => {
  describe('startCheckout', () => {
    it('should call checkout API with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session123' }),
      });

      await startCheckout('price_123');

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_123',
          successUrl: 'http://localhost:3000/dashboard?upgraded=true',
          cancelUrl: 'http://localhost:3000/pricing',
        }),
      });
    });

    it('should redirect to checkout URL on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session123' }),
      });

      await startCheckout('price_123');

      expect(window.location.href).toBe('https://checkout.stripe.com/session123');
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid price ID' }),
      });

      await expect(startCheckout('invalid_price')).rejects.toThrow('Invalid price ID');
    });
  });

  describe('openCustomerPortal', () => {
    it('should call portal API without flowType by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openCustomerPortal();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: 'http://localhost:3000/settings/billing',
          flowType: undefined,
        }),
      });
    });

    it('should call portal API with flowType when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openCustomerPortal('payment_method_update');

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: 'http://localhost:3000/settings/billing',
          flowType: 'payment_method_update',
        }),
      });
    });

    it('should redirect to portal URL on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openCustomerPortal();

      expect(window.location.href).toBe('https://billing.stripe.com/portal123');
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'No subscription found' }),
      });

      await expect(openCustomerPortal()).rejects.toThrow('No subscription found');
    });
  });

  describe('openPaymentMethodUpdate', () => {
    it('should call openCustomerPortal with payment_method_update flowType', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openPaymentMethodUpdate();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', expect.objectContaining({
        body: expect.stringContaining('payment_method_update'),
      }));
    });
  });

  describe('openSubscriptionCancel', () => {
    it('should call openCustomerPortal with subscription_cancel flowType', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openSubscriptionCancel();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', expect.objectContaining({
        body: expect.stringContaining('subscription_cancel'),
      }));
    });
  });

  describe('openSubscriptionChange', () => {
    it('should call openCustomerPortal with subscription_update flowType', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://billing.stripe.com/portal123' }),
      });

      await openSubscriptionChange();

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', expect.objectContaining({
        body: expect.stringContaining('subscription_update'),
      }));
    });
  });
});
