import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';

// Mock the Stripe client
vi.mock('@/lib/stripe/client', () => ({
  openSubscriptionCancel: vi.fn().mockResolvedValue(undefined),
}));

describe('CancelSubscriptionModal', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  const futureDateString = futureDate.toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when closed', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <CancelSubscriptionModal
          isOpen={false}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('when open', () => {
    it('should render modal content', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(screen.getByText('Cancel your subscription?')).toBeInTheDocument();
    });

    it('should show access continuation date', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      // Check that the date message is shown
      expect(screen.getByText(/Your Pro access will continue until/)).toBeInTheDocument();
    });

    it('should list features that will be lost', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(screen.getByText("You'll lose access to:")).toBeInTheDocument();
      expect(screen.getByText('Unlimited events')).toBeInTheDocument();
      expect(screen.getByText('Unlimited guests per event')).toBeInTheDocument();
      expect(screen.getByText('Email invitations & reminders')).toBeInTheDocument();
      expect(screen.getByText('Custom branding on PDFs')).toBeInTheDocument();
    });

    it('should show free plan limits', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(screen.getByText('Free plan limits:')).toBeInTheDocument();
      expect(screen.getByText('5 events')).toBeInTheDocument();
      expect(screen.getByText('200 guests per event')).toBeInTheDocument();
    });

    it('should have Keep My Subscription button', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(screen.getByRole('button', { name: /Keep My Subscription/i })).toBeInTheDocument();
    });

    it('should have Continue to Cancel button', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      expect(screen.getByRole('button', { name: /Continue to Cancel/i })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClose when Keep My Subscription is clicked', () => {
      const onClose = vi.fn();
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={onClose}
          currentPeriodEnd={futureDateString}
        />
      );

      const keepButton = screen.getByRole('button', { name: /Keep My Subscription/i });
      fireEvent.click(keepButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={onClose}
          currentPeriodEnd={futureDateString}
        />
      );

      // Click the overlay (the outermost div with class cancel-modal-overlay)
      const overlay = document.querySelector('.cancel-modal-overlay');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={onClose}
          currentPeriodEnd={futureDateString}
        />
      );

      // Click inside the modal content
      const modalContent = document.querySelector('.cancel-modal');
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call openSubscriptionCancel when Continue to Cancel is clicked', async () => {
      const { openSubscriptionCancel } = await import('@/lib/stripe/client');

      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Continue to Cancel/i });
      fireEvent.click(cancelButton);

      expect(openSubscriptionCancel).toHaveBeenCalled();
    });

    it('should show loading state when Continue to Cancel is clicked', async () => {
      // Make the mock return a promise that doesn't resolve immediately
      const { openSubscriptionCancel } = await import('@/lib/stripe/client');
      vi.mocked(openSubscriptionCancel).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Continue to Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.getByRole('button', { name: /Loading.../i })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null currentPeriodEnd gracefully', () => {
      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={null}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Cancel your subscription?')).toBeInTheDocument();
      expect(screen.getByText(/Your Pro access will continue until/)).toBeInTheDocument();
    });

    it('should disable both buttons during loading', async () => {
      const { openSubscriptionCancel } = await import('@/lib/stripe/client');
      vi.mocked(openSubscriptionCancel).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Continue to Cancel/i });
      fireEvent.click(cancelButton);

      // Both buttons should be disabled
      expect(screen.getByRole('button', { name: /Loading.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Keep My Subscription/i })).toBeDisabled();
    });

    it('should handle error when openSubscriptionCancel fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { openSubscriptionCancel } = await import('@/lib/stripe/client');
      vi.mocked(openSubscriptionCancel).mockRejectedValue(new Error('Portal failed'));

      render(
        <CancelSubscriptionModal
          isOpen={true}
          onClose={() => {}}
          currentPeriodEnd={futureDateString}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Continue to Cancel/i });
      fireEvent.click(cancelButton);

      // Wait for the error to be logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to open cancellation portal:',
          expect.any(Error)
        );
      });

      // Button should return to normal state after error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue to Cancel/i })).not.toBeDisabled();
      });

      consoleSpy.mockRestore();
    });
  });
});
