import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPlanLimits } from '@/types/subscription';
import { BillingPageClient } from './BillingPageClient';

export const metadata = {
  title: 'Billing & Subscription',
};

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get full subscription data including Stripe info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      plan,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      canceled_at
    `)
    .eq('user_id', user.id)
    .single();

  const plan = subscription?.plan || 'free';
  const limits = getPlanLimits(plan);

  // Get usage stats
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get max guests across all events
  const { data: guestCounts } = await supabase
    .from('events')
    .select('id, guests(count)')
    .eq('user_id', user.id);

  const maxGuestsInEvent = guestCounts?.reduce((max, event) => {
    const count = event.guests?.[0]?.count || 0;
    return Math.max(max, count);
  }, 0) || 0;

  return (
    <BillingPageClient
      user={{
        id: user.id,
        email: user.email || '',
      }}
      subscription={{
        plan,
        status: subscription?.status || 'active',
        limits,
        stripeCustomerId: subscription?.stripe_customer_id || null,
        stripeSubscriptionId: subscription?.stripe_subscription_id || null,
        currentPeriodStart: subscription?.current_period_start || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
        canceledAt: subscription?.canceled_at || null,
      }}
      usage={{
        eventCount: eventCount || 0,
        maxGuestsInEvent,
      }}
    />
  );
}
