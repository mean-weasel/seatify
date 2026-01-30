'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { openCustomerPortal, openPaymentMethodUpdate, openSubscriptionChange } from '@/lib/stripe/client';
import { CancelSubscriptionModal } from '@/components/CancelSubscriptionModal';
import type { SubscriptionPlan, PlanLimits } from '@/types/subscription';
import { PRICING_TIERS } from '@/types/subscription';
import './billing.css';

interface Invoice {
  id: string;
  number: string | null;
  date: string | null;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string;
}

interface BillingPageClientProps {
  user: {
    id: string;
    email: string;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    limits: PlanLimits;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  };
  usage: {
    eventCount: number;
    maxGuestsInEvent: number;
  };
}

export function BillingPageClient({ user, subscription, usage }: BillingPageClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch invoices on mount
  useEffect(() => {
    async function fetchInvoices() {
      if (!subscription.stripeCustomerId) return;

      setLoadingInvoices(true);
      try {
        const response = await fetch('/api/stripe/invoices?limit=5');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    }

    fetchInvoices();
  }, [subscription.stripeCustomerId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setPortalLoading(true);
    try {
      await openPaymentMethodUpdate();
    } catch (error) {
      console.error('Failed to open payment method update:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setPortalLoading(true);
    try {
      await openSubscriptionChange();
    } catch (error) {
      console.error('Failed to open plan change:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanPrice = () => {
    const tier = PRICING_TIERS.find(t => t.plan === subscription.plan);
    if (!tier || tier.monthlyPrice === 0) return null;
    return `$${tier.monthlyPrice}/month`;
  };

  const getStatusBadge = () => {
    if (subscription.cancelAtPeriodEnd) {
      return <span className="status-badge canceling">Canceling</span>;
    }
    switch (subscription.status) {
      case 'active':
        return <span className="status-badge active">Active</span>;
      case 'past_due':
        return <span className="status-badge past-due">Past Due</span>;
      case 'canceled':
        return <span className="status-badge canceled">Canceled</span>;
      case 'trialing':
        return <span className="status-badge trialing">Trial</span>;
      default:
        return <span className="status-badge">{subscription.status}</span>;
    }
  };

  const isPro = subscription.plan === 'pro' || subscription.plan === 'enterprise';

  return (
    <div className="billing-layout">
      <header className="billing-header">
        <Link href="/dashboard" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1>Billing & Subscription</h1>
      </header>

      <main className="billing-main">
        {/* Alert Banners */}
        {subscription.status === 'past_due' && (
          <div className="alert alert-error">
            <strong>Payment Failed</strong>
            <p>Your last payment failed. Please update your payment method to continue using Pro features.</p>
            <button onClick={handleUpdatePaymentMethod} disabled={portalLoading}>
              Update Payment Method
            </button>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="alert alert-warning">
            <strong>Subscription Ending</strong>
            <p>
              Your Pro subscription will end on {formatDate(subscription.currentPeriodEnd)}.
              You&apos;ll keep Pro access until then.
            </p>
            <button onClick={handleManageSubscription} disabled={portalLoading}>
              Reactivate Subscription
            </button>
          </div>
        )}

        {/* Current Plan */}
        <section className="billing-section">
          <h2>Current Plan</h2>
          <div className="billing-card plan-card">
            <div className="plan-header">
              <div className="plan-info">
                <span className={`plan-badge ${subscription.plan}`}>
                  {subscription.plan === 'pro' ? 'Pro' : subscription.plan === 'enterprise' ? 'Enterprise' : 'Free'}
                </span>
                {getStatusBadge()}
              </div>
              {getPlanPrice() && (
                <span className="plan-price">{getPlanPrice()}</span>
              )}
            </div>

            {isPro && subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
              <div className="billing-info">
                <div className="info-row">
                  <span className="info-label">Next billing date</span>
                  <span className="info-value">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              </div>
            )}

            <div className="plan-actions">
              {isPro ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={handleChangePlan}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Loading...' : 'Change Plan'}
                  </button>
                  {!subscription.cancelAtPeriodEnd && (
                    <button
                      className="btn-text-danger"
                      onClick={() => setShowCancelModal(true)}
                      disabled={portalLoading}
                    >
                      Cancel Subscription
                    </button>
                  )}
                </>
              ) : (
                <Link href="/pricing" className="btn-primary">
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Usage */}
        <section className="billing-section">
          <h2>Usage</h2>
          <div className="billing-card">
            <div className="usage-grid">
              <div className="usage-item">
                <div className="usage-header">
                  <span className="usage-label">Events</span>
                  <span className="usage-value">
                    {usage.eventCount}
                    {subscription.limits.maxEvents !== -1 && (
                      <span className="usage-limit"> / {subscription.limits.maxEvents}</span>
                    )}
                  </span>
                </div>
                {subscription.limits.maxEvents !== -1 && (
                  <div className="usage-bar">
                    <div
                      className="usage-fill"
                      style={{
                        width: `${Math.min(100, (usage.eventCount / subscription.limits.maxEvents) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="usage-item">
                <div className="usage-header">
                  <span className="usage-label">Max Guests (largest event)</span>
                  <span className="usage-value">
                    {usage.maxGuestsInEvent}
                    {subscription.limits.maxGuestsPerEvent !== -1 && (
                      <span className="usage-limit"> / {subscription.limits.maxGuestsPerEvent}</span>
                    )}
                  </span>
                </div>
                {subscription.limits.maxGuestsPerEvent !== -1 && (
                  <div className="usage-bar">
                    <div
                      className="usage-fill"
                      style={{
                        width: `${Math.min(100, (usage.maxGuestsInEvent / subscription.limits.maxGuestsPerEvent) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="billing-section">
          <h2>Plan Features</h2>
          <div className="billing-card">
            <div className="features-list">
              <div className={`feature-item ${subscription.limits.maxEvents === -1 ? 'included' : ''}`}>
                <span className="feature-icon">{subscription.limits.maxEvents === -1 ? '✓' : '○'}</span>
                <span>Unlimited events</span>
              </div>
              <div className={`feature-item ${subscription.limits.maxGuestsPerEvent === -1 ? 'included' : ''}`}>
                <span className="feature-icon">{subscription.limits.maxGuestsPerEvent === -1 ? '✓' : '○'}</span>
                <span>Unlimited guests per event</span>
              </div>
              <div className={`feature-item ${subscription.limits.canRemoveBranding ? 'included' : ''}`}>
                <span className="feature-icon">{subscription.limits.canRemoveBranding ? '✓' : '○'}</span>
                <span>Remove Seatify branding</span>
              </div>
              <div className={`feature-item ${subscription.limits.hasCustomLogo ? 'included' : ''}`}>
                <span className="feature-icon">{subscription.limits.hasCustomLogo ? '✓' : '○'}</span>
                <span>Custom logo on PDFs</span>
              </div>
              <div className={`feature-item ${subscription.limits.hasPrioritySupport ? 'included' : ''}`}>
                <span className="feature-icon">{subscription.limits.hasPrioritySupport ? '✓' : '○'}</span>
                <span>Priority support</span>
              </div>
            </div>

            {!isPro && (
              <div className="upgrade-cta">
                <p>Unlock all features with Pro</p>
                <Link href="/pricing" className="btn-primary">
                  View Plans
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Invoice History */}
        {subscription.stripeCustomerId && (
          <section className="billing-section">
            <h2>Invoice History</h2>
            <div className="billing-card">
              {loadingInvoices ? (
                <div className="loading-state">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="empty-state">
                  <p>No invoices yet</p>
                  <span>Your invoices will appear here after your first payment.</span>
                </div>
              ) : (
                <div className="invoices-table">
                  <div className="invoices-header">
                    <span>Date</span>
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span></span>
                  </div>
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="invoice-row">
                      <span>{formatDate(invoice.date)}</span>
                      <span>{invoice.description}</span>
                      <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                      <span className={`invoice-status ${invoice.status}`}>
                        {invoice.status === 'paid' ? 'Paid' : invoice.status}
                      </span>
                      <span className="invoice-actions">
                        {invoice.pdfUrl && (
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" title="Download PDF">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </a>
                        )}
                        {invoice.hostedUrl && (
                          <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer" title="View Invoice">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {invoices.length > 0 && (
                <div className="invoices-footer">
                  <button onClick={handleManageSubscription} className="btn-text" disabled={portalLoading}>
                    View all invoices in billing portal
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Account Info */}
        <section className="billing-section">
          <h2>Billing Account</h2>
          <div className="billing-card">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            {subscription.stripeCustomerId && (
              <div className="info-row">
                <span className="info-label">Payment method</span>
                <button onClick={handleUpdatePaymentMethod} className="btn-text" disabled={portalLoading}>
                  Update payment method
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        currentPeriodEnd={subscription.currentPeriodEnd}
      />
    </div>
  );
}
