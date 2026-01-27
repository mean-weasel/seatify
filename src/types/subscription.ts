/**
 * Subscription types for Pro features
 */

export type SubscriptionPlan = 'free' | 'pro' | 'team' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;

  // Stripe integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;

  // Billing period
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Plan limits configuration
 */
export interface PlanLimits {
  plan: SubscriptionPlan;
  maxEvents: number; // -1 = unlimited
  maxGuestsPerEvent: number; // -1 = unlimited
  hasWatermark: boolean;
  canRemoveBranding: boolean;
  hasCustomLogo: boolean;
  hasPrioritySupport: boolean;
  hasTeamMembers: boolean;
  maxTeamMembers: number; // -1 = unlimited
  hasRsvp: boolean;
  hasEmailInvitations: boolean;
  hasAiOptimization: boolean; // false = basic optimization only
}

/**
 * Default plan limits
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    plan: 'free',
    maxEvents: 3,
    maxGuestsPerEvent: 100,
    hasWatermark: true,
    canRemoveBranding: false,
    hasCustomLogo: false,
    hasPrioritySupport: false,
    hasTeamMembers: false,
    maxTeamMembers: 0,
    hasRsvp: false,
    hasEmailInvitations: false,
    hasAiOptimization: false,
  },
  pro: {
    plan: 'pro',
    maxEvents: -1,
    maxGuestsPerEvent: -1,
    hasWatermark: false,
    canRemoveBranding: true,
    hasCustomLogo: true,
    hasPrioritySupport: false,
    hasTeamMembers: false,
    maxTeamMembers: 0,
    hasRsvp: true,
    hasEmailInvitations: true,
    hasAiOptimization: true,
  },
  team: {
    plan: 'team',
    maxEvents: -1,
    maxGuestsPerEvent: -1,
    hasWatermark: false,
    canRemoveBranding: true,
    hasCustomLogo: true,
    hasPrioritySupport: true,
    hasTeamMembers: true,
    maxTeamMembers: 5,
    hasRsvp: true,
    hasEmailInvitations: true,
    hasAiOptimization: true,
  },
  enterprise: {
    plan: 'enterprise',
    maxEvents: -1,
    maxGuestsPerEvent: -1,
    hasWatermark: false,
    canRemoveBranding: true,
    hasCustomLogo: true,
    hasPrioritySupport: true,
    hasTeamMembers: true,
    maxTeamMembers: -1,
    hasRsvp: true,
    hasEmailInvitations: true,
    hasAiOptimization: true,
  },
};

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if a feature limit allows an action
 * Returns true if within limits, false if limit exceeded
 */
export function isWithinLimit(limit: number, current: number): boolean {
  // -1 means unlimited
  if (limit === -1) return true;
  return current < limit;
}

/**
 * Pricing information for display
 */
export interface PricingTier {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    plan: 'free',
    name: 'Free',
    description: 'Perfect for small events',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 3 events',
      'Up to 100 guests per event',
      'Basic seating optimization',
      'Guest import (CSV)',
      'Shareable links & QR codes',
      'PDF export (watermarked)',
    ],
    ctaText: 'Get Started Free',
  },
  {
    plan: 'pro',
    name: 'Pro',
    description: 'For individual event planners',
    monthlyPrice: 19,
    yearlyPrice: 159,
    features: [
      'Unlimited events',
      'Unlimited guests',
      'AI-powered seating optimization',
      'RSVP collection',
      'Email invitations & reminders',
      'Clean PDF exports',
      'Custom branding',
    ],
    highlighted: true,
    ctaText: 'Upgrade to Pro',
  },
  {
    plan: 'team',
    name: 'Team',
    description: 'For agencies & teams',
    monthlyPrice: 49,
    yearlyPrice: 412,
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared event access',
      'Role-based permissions',
      'Priority support',
      'Team collaboration (coming soon)',
    ],
    ctaText: 'Upgrade to Team',
  },
];

/**
 * Stripe price IDs (to be configured via environment variables)
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  team: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID || '',
  },
};
