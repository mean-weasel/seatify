import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReminderEmail } from './reminder';

describe('ReminderEmail', () => {
  const requiredProps = {
    guestName: 'John Doe',
    eventName: 'Wedding Reception',
    rsvpUrl: 'https://seatify.app/rsvp/event-123/token-abc',
  };

  const allProps = {
    ...requiredProps,
    eventDate: '2026-03-15T18:00:00.000Z',
    hostName: 'Jane Smith',
    deadline: '2026-02-28T23:59:59.000Z',
    daysUntilDeadline: 5,
  };

  describe('rendering', () => {
    it('should render with all props', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container).toBeTruthy();
    });

    it('should render with minimal props', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container).toBeTruthy();
    });
  });

  describe('urgent banner', () => {
    it('should display urgent banner correctly', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('RSVP Reminder');
    });

    it('should always display the urgent banner', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container.textContent).toContain('RSVP Reminder');
    });
  });

  describe('daysUntilDeadline messaging', () => {
    it('should show correct message when daysUntilDeadline is provided', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('5 days');
      expect(container.textContent).toContain('left to respond');
    });

    it('should show "Today is the last day" when daysUntilDeadline === 0', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={0} />
      );
      expect(container.textContent).toContain('Today is the last day to respond!');
    });

    it('should handle pluralization correctly - 1 day (singular)', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={1} />
      );
      expect(container.textContent).toContain('1 day');
      expect(container.textContent).not.toContain('1 days');
    });

    it('should handle pluralization correctly - 2 days (plural)', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={2} />
      );
      expect(container.textContent).toContain('2 days');
    });

    it('should handle pluralization correctly - multiple days', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={10} />
      );
      expect(container.textContent).toContain('10 days');
    });

    it('should not show days remaining box when daysUntilDeadline is undefined', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container.textContent).not.toContain('left to respond');
      expect(container.textContent).not.toContain('Today is the last day');
    });

    it('should show deadline date in days remaining message when both provided', () => {
      const { container } = render(
        <ReminderEmail
          {...requiredProps}
          daysUntilDeadline={5}
          deadline="2026-02-28T23:59:59.000Z"
        />
      );
      expect(container.textContent).toContain('deadline: Saturday, February 28, 2026');
    });

    it('should not show "Today is the last day" for positive daysUntilDeadline', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={3} />
      );
      expect(container.textContent).not.toContain('Today is the last day');
    });
  });

  describe('event information', () => {
    it('should display guest name in greeting', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('Dear John Doe,');
    });

    it('should display event name', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('Wedding Reception');
    });

    it('should format event date correctly when provided', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('Sunday, March 15, 2026');
    });

    it('should not show date when eventDate is not provided', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      // Should not contain formatted date patterns
      expect(container.textContent).not.toContain('Sunday, March');
    });
  });

  describe('host and branding', () => {
    it('should display host name when provided', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('Hosted by Jane Smith');
    });

    it('should not display host section when hostName is not provided', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container.textContent).not.toContain('Hosted by');
    });

    it('should include Seatify branding', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container.textContent).toContain('Seatify');
      expect(container.textContent).toContain('Powered by');
    });
  });

  describe('RSVP link', () => {
    it('should include RSVP URL in button and text link', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      const html = container.innerHTML;
      // URL should appear in the link text
      expect(container.textContent).toContain(requiredProps.rsvpUrl);
      // URL should appear in href attributes
      expect(html).toContain(`href="${requiredProps.rsvpUrl}"`);
    });

    it('should have "Respond Now" button text', () => {
      const { container } = render(<ReminderEmail {...requiredProps} />);
      expect(container.textContent).toContain('Respond Now');
    });
  });

  describe('edge cases', () => {
    it('should handle long guest names', () => {
      const longName = 'Alexandria Bartholomew Christopher Davidson-Wellington III';
      const { container } = render(
        <ReminderEmail {...requiredProps} guestName={longName} />
      );
      expect(container.textContent).toContain(`Dear ${longName},`);
    });

    it('should handle special characters in names', () => {
      const specialName = "Maria O'Connor-D'Angelo";
      const { container } = render(
        <ReminderEmail {...requiredProps} guestName={specialName} />
      );
      expect(container.textContent).toContain(`Dear ${specialName},`);
    });

    it('should handle event name with special characters', () => {
      const specialEventName = "John & Jane's Wedding <Celebration>";
      const { container } = render(
        <ReminderEmail {...requiredProps} eventName={specialEventName} />
      );
      expect(container.textContent).toContain(specialEventName);
    });

    it('should include preview text', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain('Reminder: Please RSVP for Wedding Reception');
    });

    it('should include disclaimer about reminder', () => {
      const { container } = render(<ReminderEmail {...allProps} />);
      expect(container.textContent).toContain("haven't responded");
      expect(container.textContent).toContain("ignore this email");
    });

    it('should handle daysUntilDeadline with large values', () => {
      const { container } = render(
        <ReminderEmail {...requiredProps} daysUntilDeadline={30} />
      );
      expect(container.textContent).toContain('30 days');
    });
  });
});
