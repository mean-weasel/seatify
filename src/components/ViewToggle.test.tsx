import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from './ViewToggle';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  usePathname: () => '/dashboard/events/test-event-123/canvas',
  useParams: () => ({ eventId: 'test-event-123' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the store
vi.mock('../store/useStore', () => ({
  useStore: () => ({
    activeView: 'canvas',
    currentEventId: 'test-event-123',
  }),
}));

describe('ViewToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Paths', () => {
    it('should navigate to /dashboard/events/:id/canvas when clicking Canvas', async () => {
      const user = userEvent.setup();
      render(<ViewToggle />);

      const canvasButton = screen.getByTitle('Canvas');
      await user.click(canvasButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/events/test-event-123/canvas');
    });

    it('should navigate to /dashboard/events/:id/guests when clicking Guests', async () => {
      const user = userEvent.setup();
      render(<ViewToggle />);

      const guestsButton = screen.getByTitle('Guest List');
      await user.click(guestsButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/events/test-event-123/guests');
    });

    it('should navigate to /dashboard/events/:id/dashboard when clicking Dashboard', async () => {
      const user = userEvent.setup();
      render(<ViewToggle />);

      const dashboardButton = screen.getByTitle('Dashboard');
      await user.click(dashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/events/test-event-123/dashboard');
    });

    it('should use correct path prefix /dashboard/events/', async () => {
      const user = userEvent.setup();
      render(<ViewToggle />);

      // Click all view buttons and verify they all use the correct prefix
      const views = ['Canvas', 'Guest List', 'Dashboard'];
      for (const view of views) {
        const button = screen.getByTitle(view);
        await user.click(button);
      }

      // Verify all calls use the /dashboard/events/ prefix (not /events/)
      expect(mockPush).toHaveBeenCalledTimes(3);
      mockPush.mock.calls.forEach((call) => {
        expect(call[0]).toMatch(/^\/dashboard\/events\//);
        expect(call[0]).not.toMatch(/^\/events\//);
      });
    });
  });

  describe('Rendering', () => {
    it('should render all view toggle buttons', () => {
      render(<ViewToggle />);

      expect(screen.getByTitle('Canvas')).toBeInTheDocument();
      expect(screen.getByTitle('Guest List')).toBeInTheDocument();
      expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    });

    it('should show active state for current view', () => {
      render(<ViewToggle />);

      const canvasButton = screen.getByTitle('Canvas');
      expect(canvasButton).toHaveClass('active');
    });

    it('should render relationships button when callback provided', () => {
      const onToggle = vi.fn();
      render(<ViewToggle onToggleRelationships={onToggle} />);

      expect(screen.getByText('Relationships')).toBeInTheDocument();
    });
  });
});
