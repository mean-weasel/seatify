import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import Stripe from 'stripe';

// Supported flow types for deep-linking to specific portal sections
type PortalFlowType = 'payment_method_update' | 'subscription_cancel' | 'subscription_update';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get Stripe customer and subscription IDs
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const { returnUrl, flowType } = await request.json() as {
      returnUrl?: string;
      flowType?: PortalFlowType;
    };

    // Build portal session options
    const sessionOptions: Stripe.BillingPortal.SessionCreateParams = {
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    };

    // Add flow_data for deep-linking to specific sections
    if (flowType && subscription.stripe_subscription_id) {
      switch (flowType) {
        case 'payment_method_update':
          sessionOptions.flow_data = {
            type: 'payment_method_update',
          };
          break;
        case 'subscription_cancel':
          sessionOptions.flow_data = {
            type: 'subscription_cancel',
            subscription_cancel: {
              subscription: subscription.stripe_subscription_id,
            },
          };
          break;
        case 'subscription_update':
          sessionOptions.flow_data = {
            type: 'subscription_update',
            subscription_update: {
              subscription: subscription.stripe_subscription_id,
            },
          };
          break;
      }
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
