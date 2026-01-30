'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Subscription, SubscriptionPlan, PlanLimits } from '@/types/subscription';
import { getPlanLimits, isWithinLimit } from '@/types/subscription';

// Re-export for convenience
export { getPlanLimits, isWithinLimit } from '@/types/subscription';
export type { SubscriptionPlan, PlanLimits } from '@/types/subscription';

// Grace period in days for past_due subscriptions
const PAST_DUE_GRACE_PERIOD_DAYS = 7;

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: SubscriptionPlan;
  limits: PlanLimits;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  canCreateEvent: (currentEventCount: number) => boolean;
  canAddGuest: (currentGuestCount: number) => boolean;
  hasWatermark: boolean;
  refresh: () => Promise<void>;
  // Enhanced subscription state properties
  isPendingCancellation: boolean;
  isPastDue: boolean;
  daysUntilRenewal: number | null;
  canAccessProFeatures: boolean;
}

/**
 * Hook to access and manage user subscription
 */
export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated - use free limits
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no subscription found, user is on free plan
        if (fetchError.code === 'PGRST116') {
          setSubscription(null);
        } else {
          console.error('Error fetching subscription:', fetchError);
          setError(fetchError.message);
        }
      } else if (data) {
        // Map snake_case to camelCase
        setSubscription({
          id: data.id,
          userId: data.user_id,
          plan: data.plan as SubscriptionPlan,
          status: data.status,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          stripePriceId: data.stripe_price_id,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          canceledAt: data.canceled_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error in useSubscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchSubscription();
        } else {
          setSubscription(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchSubscription]);

  // Realtime subscription for instant updates when webhooks modify the database
  useEffect(() => {
    const supabase = createClient();
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to changes on this user's subscription row
      realtimeChannel = supabase
        .channel(`subscription:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Refetch subscription when changes detected
            console.log('Subscription changed:', payload.eventType);
            fetchSubscription();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime subscription active');
          }
        });
    };

    setupRealtime();

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [fetchSubscription]);

  // Derive plan and limits
  const plan: SubscriptionPlan = subscription?.plan || 'free';
  const limits = getPlanLimits(plan);

  // Convenience booleans
  const isFree = plan === 'free';
  const isPro = plan === 'pro';
  const isEnterprise = plan === 'enterprise';

  // Limit check helpers
  const canCreateEvent = useCallback(
    (currentEventCount: number) => isWithinLimit(limits.maxEvents, currentEventCount),
    [limits.maxEvents]
  );

  const canAddGuest = useCallback(
    (currentGuestCount: number) => isWithinLimit(limits.maxGuestsPerEvent, currentGuestCount),
    [limits.maxGuestsPerEvent]
  );

  // Enhanced subscription state computations
  const isPendingCancellation = Boolean(
    subscription?.cancelAtPeriodEnd &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  );

  const isPastDue = subscription?.status === 'past_due';

  // Calculate days until renewal/period end
  const daysUntilRenewal = (() => {
    if (!subscription?.currentPeriodEnd) return null;
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diffMs = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  })();

  // Determine if user can access Pro features (includes grace period logic)
  const canAccessProFeatures = (() => {
    // Free plan users don't have Pro access
    if (!subscription || subscription.plan === 'free') return false;

    // Active or trialing subscriptions have full access
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return true;
    }

    // Past due subscriptions get a grace period
    if (subscription.status === 'past_due') {
      // Check if within grace period from when status changed
      // Since we don't track when it became past_due, use currentPeriodEnd as reference
      if (subscription.currentPeriodEnd) {
        const periodEnd = new Date(subscription.currentPeriodEnd);
        const graceEnd = new Date(periodEnd.getTime() + PAST_DUE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
        return new Date() < graceEnd;
      }
      return false;
    }

    // Canceled subscriptions - check if period hasn't ended yet
    if (subscription.status === 'canceled' && subscription.currentPeriodEnd) {
      return new Date() < new Date(subscription.currentPeriodEnd);
    }

    return false;
  })();

  return {
    subscription,
    plan,
    limits,
    isLoading,
    error,
    isPro,
    isEnterprise,
    isFree,
    canCreateEvent,
    canAddGuest,
    hasWatermark: limits.hasWatermark,
    refresh: fetchSubscription,
    // Enhanced subscription state
    isPendingCancellation,
    isPastDue,
    daysUntilRenewal,
    canAccessProFeatures,
  };
}
