import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionAlert, UpgradeSuccessAlert } from './SubscriptionAlert';
import type { Subscription } from '@/types/subscription';

// Mock the Stripe client
vi.mock('@/lib/stripe/client', () => ({
  openCustomerPortal: vi.fn().mockResolvedValue(undefined),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SubscriptionAlert', () => {
  const baseSubscription: Subscription = {
    id: 'sub-123',
    userId: 'user-123',
    plan: 'pro',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset getItem to use the default implementation (return from store)
    localStorageMock.getItem.mockImplementation((key: string) => null);
  });

  describe('when no alert needed', () => {
    it('should render nothing for active subscription', () => {
      const { container } = render(
        <SubscriptionAlert
          subscription={baseSubscription}
          isPendingCancellation={false}
          isPastDue={false}
          daysUntilRenewal={30}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when subscription is null', () => {
      const { container } = render(
        <SubscriptionAlert
          subscription={null}
          isPendingCancellation={false}
          isPastDue={false}
          daysUntilRenewal={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('past_due alert', () => {
    it('should render past_due alert when isPastDue is true', () => {
      render(
        <SubscriptionAlert
          subscription={{ ...baseSubscription, status: 'past_due' }}
          isPendingCancellation={false}
          isPastDue={true}
          daysUntilRenewal={null}
        />
      );

      expect(screen.getByText('Payment failed')).toBeInTheDocument();
      expect(screen.getByText(/Update your payment method/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Payment/i })).toBeInTheDocument();
    });

    it('should call openCustomerPortal when Update Payment is clicked', async () => {
      const { openCustomerPortal } = await import('@/lib/stripe/client');

      render(
        <SubscriptionAlert
          subscription={{ ...baseSubscription, status: 'past_due' }}
          isPendingCancellation={false}
          isPastDue={true}
          daysUntilRenewal={null}
        />
      );

      const button = screen.getByRole('button', { name: /Update Payment/i });
      fireEvent.click(button);

      expect(openCustomerPortal).toHaveBeenCalled();
    });
  });

  describe('pending_cancellation alert', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    it('should render pending_cancellation alert', () => {
      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={15}
        />
      );

      expect(screen.getByText('Subscription ending')).toBeInTheDocument();
      expect(screen.getByText(/Your Pro subscription ends on/)).toBeInTheDocument();
      expect(screen.getByText(/15 days of access remaining/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reactivate/i })).toBeInTheDocument();
    });

    it('should show dismiss button for pending_cancellation', () => {
      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={15}
        />
      );

      expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
    });

    it('should dismiss and store in localStorage when dismiss is clicked', () => {
      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={15}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'seatify_dismissed_subscription_alert',
        'pending_cancellation'
      );
    });
  });

  describe('priority', () => {
    it('should show past_due over pending_cancellation when both are true', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            status: 'past_due',
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={true}
          daysUntilRenewal={15}
        />
      );

      // past_due takes priority
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
      expect(screen.queryByText('Subscription ending')).not.toBeInTheDocument();
    });
  });

  describe('dismissed state', () => {
    it('should not render if variant was previously dismissed', () => {
      localStorageMock.getItem.mockReturnValue('pending_cancellation');

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const { container } = render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={15}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('additional edge cases', () => {
    it('should show singular "day" when daysUntilRenewal is 1', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: futureDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={1}
        />
      );

      expect(screen.getByText(/1 day of access remaining/)).toBeInTheDocument();
    });

    it('should not show days remaining when daysUntilRenewal is 0', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      render(
        <SubscriptionAlert
          subscription={{
            ...baseSubscription,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: pastDate.toISOString(),
          }}
          isPendingCancellation={true}
          isPastDue={false}
          daysUntilRenewal={0}
        />
      );

      expect(screen.queryByText(/days of access remaining/)).not.toBeInTheDocument();
      expect(screen.queryByText(/day of access remaining/)).not.toBeInTheDocument();
    });

    it('should apply className prop', () => {
      render(
        <SubscriptionAlert
          subscription={{ ...baseSubscription, status: 'past_due' }}
          isPendingCancellation={false}
          isPastDue={true}
          daysUntilRenewal={null}
          className="custom-class"
        />
      );

      const alert = document.querySelector('.subscription-alert');
      expect(alert).toHaveClass('custom-class');
    });
  });
});

describe('UpgradeSuccessAlert', () => {
  it('should render success message', () => {
    render(<UpgradeSuccessAlert onDismiss={() => {}} />);

    expect(screen.getByText('Welcome to Pro!')).toBeInTheDocument();
    expect(screen.getByText(/Your subscription is now active/)).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<UpgradeSuccessAlert onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should apply className prop', () => {
    render(<UpgradeSuccessAlert onDismiss={() => {}} className="custom-success-class" />);

    const alert = document.querySelector('.subscription-alert');
    expect(alert).toHaveClass('custom-success-class');
  });
});
