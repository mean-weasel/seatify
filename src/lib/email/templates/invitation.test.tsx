import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { InvitationEmail } from './invitation';

describe('InvitationEmail', () => {
  const requiredProps = {
    guestName: 'John Doe',
    eventName: 'Wedding Reception',
    rsvpUrl: 'https://seatify.app/rsvp/event-123/token-abc',
  };

  const allProps = {
    ...requiredProps,
    eventDate: '2026-03-15T18:00:00.000Z',
    hostName: 'Jane Smith',
    customMessage: 'We are so excited to celebrate with you!',
    deadline: '2026-02-28T23:59:59.000Z',
  };

  describe('rendering', () => {
    it('should render without errors with all props', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container).toBeTruthy();
    });

    it('should render with minimal props (only required: guestName, eventName, rsvpUrl)', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container).toBeTruthy();
    });
  });

  describe('guest name display', () => {
    it('should display guest name correctly', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container.textContent).toContain('Dear John Doe,');
    });

    it('should handle long names', () => {
      const longName = 'Alexandria Bartholomew Christopher Davidson-Wellington III';
      const { container } = render(
        <InvitationEmail {...requiredProps} guestName={longName} />
      );
      expect(container.textContent).toContain(`Dear ${longName},`);
    });

    it('should handle special characters in names', () => {
      const specialName = "Maria O'Connor-D'Angelo";
      const { container } = render(
        <InvitationEmail {...requiredProps} guestName={specialName} />
      );
      expect(container.textContent).toContain(`Dear ${specialName},`);
    });

    it('should handle names with unicode characters', () => {
      const unicodeName = 'Mller-Kse';
      const { container } = render(
        <InvitationEmail {...requiredProps} guestName={unicodeName} />
      );
      expect(container.textContent).toContain(`Dear ${unicodeName},`);
    });
  });

  describe('event date formatting', () => {
    it('should format event date using formatDate helper', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      // formatDate returns format like "Sunday, March 15, 2026"
      expect(container.textContent).toContain('Sunday, March 15, 2026');
    });

    it('should not render date section when eventDate is not provided', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      // The phrase " on " should not appear if there's no date
      expect(container.textContent).not.toContain(' on Sunday');
      expect(container.textContent).not.toContain(' on Monday');
    });

    it('should handle different date formats', () => {
      // Using full ISO string to avoid timezone ambiguity
      const { container } = render(
        <InvitationEmail {...requiredProps} eventDate="2026-12-25T12:00:00.000Z" />
      );
      expect(container.textContent).toContain('December 25, 2026');
    });
  });

  describe('custom message', () => {
    it('should render custom message when provided', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container.textContent).toContain('We are so excited to celebrate with you!');
    });

    it('should not render custom message section when not provided', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container.textContent).not.toContain('We are so excited');
    });

    it('should handle long custom messages', () => {
      const longMessage = 'This is a very long custom message that spans multiple lines and contains a lot of information about the event, including details about the venue, the schedule, and what guests should expect when they arrive. We hope this gives you all the information you need!';
      const { container } = render(
        <InvitationEmail {...requiredProps} customMessage={longMessage} />
      );
      expect(container.textContent).toContain(longMessage);
    });

    it('should handle custom message with special characters', () => {
      const specialMessage = "Don't forget: it's going to be amazing! <3 & more";
      const { container } = render(
        <InvitationEmail {...requiredProps} customMessage={specialMessage} />
      );
      expect(container.textContent).toContain(specialMessage);
    });
  });

  describe('deadline', () => {
    it('should show deadline text when deadline is provided', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container.textContent).toContain('Please respond by');
      expect(container.textContent).toContain('Saturday, February 28, 2026');
    });

    it('should not show deadline text when deadline is not provided', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container.textContent).not.toContain('Please respond by');
    });

    it('should format deadline date correctly', () => {
      const { container } = render(
        <InvitationEmail {...requiredProps} deadline="2026-01-31T23:59:59.000Z" />
      );
      expect(container.textContent).toContain('Saturday, January 31, 2026');
    });
  });

  describe('edge cases', () => {
    it('should handle missing optional fields', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      // Should not crash and should render basic content
      expect(container.textContent).toContain('Dear John Doe,');
      expect(container.textContent).toContain('Wedding Reception');
      expect(container.textContent).toContain('RSVP Now');
    });

    it('should handle empty strings for optional fields', () => {
      const { container } = render(
        <InvitationEmail
          {...requiredProps}
          hostName=""
          customMessage=""
        />
      );
      expect(container.textContent).toContain('Dear John Doe,');
    });

    it('should display event name in invitation text', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container.textContent).toContain('Wedding Reception');
    });

    it('should display host name in footer when provided', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container.textContent).toContain('Hosted by Jane Smith');
    });

    it('should not display host line when hostName is not provided', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container.textContent).not.toContain('Hosted by');
    });

    it('should include RSVP URL in button and text link', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      const html = container.innerHTML;
      // URL should appear in the link text
      expect(container.textContent).toContain(requiredProps.rsvpUrl);
      // URL should appear in href attributes
      expect(html).toContain(`href="${requiredProps.rsvpUrl}"`);
    });

    it('should include Seatify branding', () => {
      const { container } = render(<InvitationEmail {...requiredProps} />);
      expect(container.textContent).toContain('Seatify');
      expect(container.textContent).toContain('Powered by');
    });

    it('should include preview text', () => {
      const { container } = render(<InvitationEmail {...allProps} />);
      expect(container.textContent).toContain("You're invited to Wedding Reception! Please RSVP.");
    });

    it('should handle event name with special characters', () => {
      const specialEventName = "John & Jane's Wedding <Celebration>";
      const { container } = render(
        <InvitationEmail {...requiredProps} eventName={specialEventName} />
      );
      expect(container.textContent).toContain(specialEventName);
    });
  });
});
