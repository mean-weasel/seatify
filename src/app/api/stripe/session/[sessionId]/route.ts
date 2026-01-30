import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';

// Structured logging helper
function logSession(action: string, details: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'stripe-session',
      action,
      ...details,
    })
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // Verify the session belongs to the authenticated user
    const sessionUserId = session.metadata?.supabase_user_id ||
      (session.subscription && typeof session.subscription !== 'string'
        ? session.subscription.metadata?.supabase_user_id
        : null);

    if (sessionUserId && sessionUserId !== user.id) {
      logSession('unauthorized_access', {
        sessionId,
        requestingUserId: user.id,
        sessionUserId,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract relevant information
    const subscription = typeof session.subscription === 'object' ? session.subscription : null;
    const customer = session.customer && typeof session.customer === 'object' && 'email' in session.customer
      ? session.customer
      : null;

    const response = {
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: customer?.email || session.customer_email || null,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
      amountTotal: session.amount_total,
      currency: session.currency,
    };

    logSession('session_retrieved', {
      sessionId,
      userId: user.id,
      status: session.status,
      paymentStatus: session.payment_status,
    });

    return NextResponse.json(response);
  } catch (error) {
    logSession('error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Handle specific Stripe errors
    if (error instanceof Error && error.message.includes('No such checkout.session')) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
