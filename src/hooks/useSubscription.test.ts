import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
    unsubscribe: vi.fn(),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Import after mocking
import { useSubscription } from './useSubscription';

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computed properties', () => {
    describe('isPendingCancellation', () => {
      it('should be true when cancelAtPeriodEnd is true and status is active', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  cancel_at_period_end: true,
                  current_period_end: futureDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isPendingCancellation).toBe(true);
      });

      it('should be false when cancelAtPeriodEnd is false', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  cancel_at_period_end: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isPendingCancellation).toBe(false);
      });
    });

    describe('isPastDue', () => {
      it('should be true when status is past_due', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'past_due',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isPastDue).toBe(true);
      });

      it('should be false when status is active', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isPastDue).toBe(false);
      });
    });

    describe('daysUntilRenewal', () => {
      it('should calculate days correctly', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  current_period_end: futureDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Should be approximately 15 days (could be 14 or 15 depending on time of day)
        expect(result.current.daysUntilRenewal).toBeGreaterThanOrEqual(14);
        expect(result.current.daysUntilRenewal).toBeLessThanOrEqual(16);
      });

      it('should be null when no currentPeriodEnd', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  current_period_end: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.daysUntilRenewal).toBeNull();
      });
    });

    describe('canAccessProFeatures', () => {
      it('should be true for active pro subscription', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(true);
      });

      it('should be true for trialing subscription', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'trialing',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(true);
      });

      it('should be false for free plan', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'free',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(false);
      });

      it('should be true for past_due within grace period', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        // Period ended 3 days ago (within 7-day grace period)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'past_due',
                  current_period_end: pastDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(true);
      });

      it('should be false for past_due outside grace period', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        // Period ended 10 days ago (outside 7-day grace period)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'past_due',
                  current_period_end: pastDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(false);
      });

      it('should be true for canceled subscription before period end', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        // Period ends in 10 days
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'canceled',
                  current_period_end: futureDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(true);
      });

      it('should be false for canceled subscription after period end', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } },
        });

        // Period ended 5 days ago
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-123',
                  user_id: 'user-123',
                  plan: 'pro',
                  status: 'canceled',
                  current_period_end: pastDate.toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.canAccessProFeatures).toBe(false);
      });
    });
  });

  describe('when not authenticated', () => {
    it('should return free plan defaults', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.plan).toBe('free');
      expect(result.current.isFree).toBe(true);
      expect(result.current.isPro).toBe(false);
      expect(result.current.subscription).toBeNull();
    });
  });

  describe('when no subscription found', () => {
    it('should return free plan defaults', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.plan).toBe('free');
      expect(result.current.isFree).toBe(true);
    });
  });

  describe('additional edge cases', () => {
    it('should handle enterprise plan for canAccessProFeatures', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-123',
                user_id: 'user-123',
                plan: 'enterprise',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canAccessProFeatures).toBe(true);
      expect(result.current.isEnterprise).toBe(true);
    });

    it('should return 0 for daysUntilRenewal when period has ended', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Period ended 5 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-123',
                user_id: 'user-123',
                plan: 'pro',
                status: 'active',
                current_period_end: pastDate.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysUntilRenewal).toBe(0);
    });

    it('should handle isPendingCancellation for trialing status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-123',
                user_id: 'user-123',
                plan: 'pro',
                status: 'trialing',
                cancel_at_period_end: true,
                current_period_end: futureDate.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPendingCancellation).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'UNKNOWN', message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.plan).toBe('free'); // Falls back to free
    });
  });
});
