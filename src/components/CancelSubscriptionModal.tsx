'use client';

import { useState } from 'react';
import { openSubscriptionCancel } from '@/lib/stripe/client';
import './CancelSubscriptionModal.css';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodEnd: string | null;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  currentPeriodEnd,
}: CancelSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'your billing period ends';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleContinueToCancel = async () => {
    setIsLoading(true);
    try {
      await openSubscriptionCancel();
    } catch (error) {
      console.error('Failed to open cancellation portal:', error);
      setIsLoading(false);
    }
  };

  const featuresLost = [
    'Unlimited events',
    'Unlimited guests per event',
    'Email invitations & reminders',
    'Custom branding on PDFs',
    'Remove "Made with Seatify" watermark',
    'Priority support',
  ];

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-modal-header">
          <div className="cancel-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2>Cancel your subscription?</h2>
        </div>

        <div className="cancel-modal-content">
          <p className="cancel-modal-access-note">
            Your Pro access will continue until <strong>{formatDate(currentPeriodEnd)}</strong>.
            After that, you&apos;ll be downgraded to the Free plan.
          </p>

          <div className="cancel-modal-features">
            <p className="cancel-modal-features-title">You&apos;ll lose access to:</p>
            <ul>
              {featuresLost.map((feature) => (
                <li key={feature}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M12 4L4 12M4 4L12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="cancel-modal-free-limits">
            <p>Free plan limits:</p>
            <span>5 events</span>
            <span>200 guests per event</span>
          </div>
        </div>

        <div className="cancel-modal-actions">
          <button
            className="cancel-modal-keep-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep My Subscription
          </button>
          <button
            className="cancel-modal-cancel-btn"
            onClick={handleContinueToCancel}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Continue to Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
