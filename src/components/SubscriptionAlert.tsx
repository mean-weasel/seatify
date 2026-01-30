'use client';

import { useState, useEffect } from 'react';
import { openCustomerPortal } from '@/lib/stripe/client';
import type { Subscription } from '@/types/subscription';
import './SubscriptionAlert.css';

interface SubscriptionAlertProps {
  subscription: Subscription | null;
  isPendingCancellation: boolean;
  isPastDue: boolean;
  daysUntilRenewal: number | null;
  className?: string;
}

type AlertVariant = 'past_due' | 'pending_cancellation' | 'upgraded' | null;

const DISMISSED_ALERT_KEY = 'seatify_dismissed_subscription_alert';

export function SubscriptionAlert({
  subscription,
  isPendingCancellation,
  isPastDue,
  daysUntilRenewal,
  className = '',
}: SubscriptionAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedVariant, setDismissedVariant] = useState<string | null>(null);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_ALERT_KEY);
    if (dismissed) {
      setDismissedVariant(dismissed);
    }
  }, []);

  // Determine which alert variant to show
  const getAlertVariant = (): AlertVariant => {
    if (!subscription) return null;

    // Past due takes priority - payment needs attention
    if (isPastDue) return 'past_due';

    // Pending cancellation
    if (isPendingCancellation) return 'pending_cancellation';

    return null;
  };

  const variant = getAlertVariant();

  // Don't show if no alert needed or if this variant was dismissed
  if (!variant || dismissedVariant === variant) {
    return null;
  }

  const handlePortalAction = async () => {
    setIsLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open customer portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_ALERT_KEY, variant);
    setDismissedVariant(variant);
  };

  // Format the end date for display
  const formatEndDate = () => {
    if (!subscription?.currentPeriodEnd) return '';
    const date = new Date(subscription.currentPeriodEnd);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderContent = () => {
    switch (variant) {
      case 'past_due':
        return (
          <>
            <div className="subscription-alert-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="subscription-alert-content">
              <p className="subscription-alert-title">Payment failed</p>
              <p className="subscription-alert-message">
                Update your payment method to continue using Pro features.
              </p>
            </div>
            <button
              className="subscription-alert-action"
              onClick={handlePortalAction}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Update Payment'}
            </button>
          </>
        );

      case 'pending_cancellation':
        return (
          <>
            <div className="subscription-alert-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 6V10L13 13M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="subscription-alert-content">
              <p className="subscription-alert-title">Subscription ending</p>
              <p className="subscription-alert-message">
                Your Pro subscription ends on {formatEndDate()}.
                {daysUntilRenewal !== null && daysUntilRenewal > 0 && (
                  <> You have {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''} of access remaining.</>
                )}
              </p>
            </div>
            <button
              className="subscription-alert-action"
              onClick={handlePortalAction}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Reactivate'}
            </button>
            <button
              className="subscription-alert-dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`subscription-alert subscription-alert--${variant} ${className}`}>
      {renderContent()}
    </div>
  );
}

/**
 * Standalone success alert for showing after upgrade
 * This is a separate component because it's triggered by URL params, not subscription state
 */
interface UpgradeSuccessAlertProps {
  onDismiss: () => void;
  className?: string;
}

export function UpgradeSuccessAlert({ onDismiss, className = '' }: UpgradeSuccessAlertProps) {
  return (
    <div className={`subscription-alert subscription-alert--upgraded ${className}`}>
      <div className="subscription-alert-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="subscription-alert-content">
        <p className="subscription-alert-title">Welcome to Pro!</p>
        <p className="subscription-alert-message">
          Your subscription is now active. Enjoy unlimited events and guests.
        </p>
      </div>
      <button
        className="subscription-alert-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
