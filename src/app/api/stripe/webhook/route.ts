import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/server';

// Structured logging helper
function logWebhook(
  action: string,
  details: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'stripe-webhook',
      action,
      ...details,
    })
  );
}

// Use service role for webhook operations (bypasses RLS)
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Check if event was already processed (idempotency)
async function isEventProcessed(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('stripe_event_logs')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single();

  return !!data;
}

// Log event as processed
async function markEventProcessed(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string
): Promise<void> {
  await supabase.from('stripe_event_logs').insert({
    stripe_event_id: eventId,
    event_type: eventType,
  });
}

// Map Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
  };
  return priceMap[priceId] || 'pro';
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logWebhook('signature_verification_failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Check for duplicate event (idempotency)
  const alreadyProcessed = await isEventProcessed(supabase, event.id);
  if (alreadyProcessed) {
    logWebhook('duplicate_event_skipped', {
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = getPlanFromPriceId(priceId);

        // Get user ID from subscription metadata
        const userId = subscription.metadata?.supabase_user_id ||
          session.metadata?.supabase_user_id;

        if (!userId) {
          logWebhook('missing_user_id', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId,
          });
          break;
        }

        // Update subscription in database
        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('user_id', userId);

        // Also update profile plan for quick lookups
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId);

        logWebhook('subscription_created', {
          eventId: event.id,
          userId,
          plan,
          subscriptionId,
          customerId,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = getPlanFromPriceId(priceId);

        // Find subscription by stripe_subscription_id
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!existingSub) {
          logWebhook('subscription_not_found', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId,
          });
          break;
        }

        // Map Stripe status to our status
        let status: string;
        switch (subscription.status) {
          case 'active':
          case 'trialing':
            status = subscription.status;
            break;
          case 'past_due':
            status = 'past_due';
            break;
          case 'canceled':
          case 'unpaid':
            status = 'canceled';
            break;
          default:
            status = 'active';
        }

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            plan,
            status,
            stripe_price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscriptionId);

        // Update profile plan
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', existingSub.user_id);

        logWebhook('subscription_updated', {
          eventId: event.id,
          subscriptionId,
          userId: existingSub.user_id,
          plan,
          status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Find subscription and reset to free
        const { data: existingSubDel } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!existingSubDel) {
          logWebhook('subscription_not_found', {
            eventId: event.id,
            eventType: event.type,
            subscriptionId,
          });
          break;
        }

        // Reset to free plan
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        // Update profile plan
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', existingSubDel.user_id);

        logWebhook('subscription_deleted', {
          eventId: event.id,
          subscriptionId,
          userId: existingSubDel.user_id,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Update subscription status to past_due
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId);

        logWebhook('payment_failed', {
          eventId: event.id,
          subscriptionId,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Ensure subscription is active
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', subscriptionId);

        logWebhook('payment_succeeded', {
          eventId: event.id,
          subscriptionId,
        });
        break;
      }

      default:
        logWebhook('unhandled_event', {
          eventId: event.id,
          eventType: event.type,
        });
    }

    // Mark event as processed for idempotency
    await markEventProcessed(supabase, event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (error) {
    logWebhook('processing_error', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
