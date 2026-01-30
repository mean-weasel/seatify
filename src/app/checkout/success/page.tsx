'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import './success.css';

interface SessionData {
  status: string;
  paymentStatus: string;
  customerEmail: string | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  amountTotal: number | null;
  currency: string | null;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    async function verifySession() {
      try {
        const response = await fetch(`/api/stripe/session/${sessionId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to verify session');
        }
        const data = await response.json();
        setSessionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify session');
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!loading && !error && sessionData?.paymentStatus === 'paid') {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard?upgraded=true');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error, sessionData, router]);

  if (loading) {
    return (
      <div className="checkout-success-page">
        <div className="success-card">
          <div className="loading-spinner" />
          <h1>Verifying your payment...</h1>
          <p>Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-success-page">
        <div className="success-card error">
          <div className="icon-circle error">
            <span>!</span>
          </div>
          <h1>Something went wrong</h1>
          <p>{error}</p>
          <div className="actions">
            <Link href="/pricing" className="btn-secondary">
              Back to Pricing
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sessionData?.paymentStatus !== 'paid') {
    return (
      <div className="checkout-success-page">
        <div className="success-card warning">
          <div className="icon-circle warning">
            <span>?</span>
          </div>
          <h1>Payment Pending</h1>
          <p>Your payment is still being processed. This may take a few moments.</p>
          <div className="actions">
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Check Again
            </button>
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success-page">
      <div className="success-card">
        <div className="icon-circle success">
          <span>&#10003;</span>
        </div>
        <h1>Welcome to Pro!</h1>
        <p>Your subscription has been activated successfully.</p>

        <div className="subscription-details">
          <div className="detail-row">
            <span className="label">Plan</span>
            <span className="value">Pro</span>
          </div>
          {sessionData.subscription?.currentPeriodEnd && (
            <div className="detail-row">
              <span className="label">Next billing date</span>
              <span className="value">
                {new Date(sessionData.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
          {sessionData.amountTotal && sessionData.currency && (
            <div className="detail-row">
              <span className="label">Amount paid</span>
              <span className="value">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: sessionData.currency,
                }).format(sessionData.amountTotal / 100)}
              </span>
            </div>
          )}
        </div>

        <div className="features-unlocked">
          <h3>Features Unlocked</h3>
          <ul>
            <li>Unlimited events</li>
            <li>Unlimited guests</li>
            <li>Email invitations & reminders</li>
            <li>Custom branding</li>
            <li>Priority support</li>
          </ul>
        </div>

        <div className="actions">
          <Link href="/dashboard?upgraded=true" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>

        <p className="redirect-notice">
          Redirecting to dashboard in {redirectCountdown} seconds...
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="checkout-success-page">
          <div className="success-card">
            <div className="loading-spinner" />
            <h1>Loading...</h1>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
