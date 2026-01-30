'use client';

// Supported flow types for deep-linking to specific portal sections
type PortalFlowType = 'payment_method_update' | 'subscription_cancel' | 'subscription_update';

/**
 * Start Stripe checkout for a subscription plan
 */
export async function startCheckout(priceId: string): Promise<void> {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}/dashboard?upgraded=true`,
      cancelUrl: `${window.location.origin}/pricing`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to start checkout');
  }

  // Redirect to Stripe Checkout
  if (data.url) {
    window.location.href = data.url;
  }
}

/**
 * Open Stripe Customer Portal for subscription management
 * @param flowType - Optional flow type to deep-link to a specific section
 */
export async function openCustomerPortal(flowType?: PortalFlowType): Promise<void> {
  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      returnUrl: window.location.href,
      flowType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to open customer portal');
  }

  // Redirect to Stripe Customer Portal
  if (data.url) {
    window.location.href = data.url;
  }
}

/**
 * Open Stripe Customer Portal directly to payment method update
 */
export async function openPaymentMethodUpdate(): Promise<void> {
  return openCustomerPortal('payment_method_update');
}

/**
 * Open Stripe Customer Portal directly to subscription cancellation
 */
export async function openSubscriptionCancel(): Promise<void> {
  return openCustomerPortal('subscription_cancel');
}

/**
 * Open Stripe Customer Portal directly to subscription/plan change
 */
export async function openSubscriptionChange(): Promise<void> {
  return openCustomerPortal('subscription_update');
}

/**
 * Stripe price IDs for different plans
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
};
