'use client';

import { useState, useEffect, useMemo } from 'react';
import { render } from '@react-email/components';
import { InvitationEmail } from '@/lib/email/templates/invitation';
import { ReminderEmail } from '@/lib/email/templates/reminder';
import { ConfirmationEmail } from '@/lib/email/templates/confirmation';
import './EmailPreview.css';

export interface EmailPreviewProps {
  templateType: 'invitation' | 'reminder' | 'confirmation';
  previewData: {
    guestName: string;
    eventName: string;
    eventDate?: string;
    hostName?: string;
    customMessage?: string;
    deadline?: string;
  };
  customization: {
    primaryColor: string;
    headerImageUrl?: string;
    hideBranding: boolean;
  };
}

type ViewMode = 'desktop' | 'mobile';

export function EmailPreview({
  templateType,
  previewData,
  customization,
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate the email HTML based on template type
  const emailComponent = useMemo(() => {
    const commonProps = {
      guestName: previewData.guestName,
      eventName: previewData.eventName,
      eventDate: previewData.eventDate,
      hostName: previewData.hostName,
      primaryColor: customization.primaryColor,
      headerImageUrl: customization.headerImageUrl,
      hideBranding: customization.hideBranding,
    };

    switch (templateType) {
      case 'invitation':
        return InvitationEmail({
          ...commonProps,
          rsvpUrl: 'https://seatify.app/rsvp/preview-token',
          customMessage: previewData.customMessage,
          deadline: previewData.deadline,
        });
      case 'reminder':
        return ReminderEmail({
          ...commonProps,
          rsvpUrl: 'https://seatify.app/rsvp/preview-token',
          deadline: previewData.deadline,
          daysUntilDeadline: previewData.deadline
            ? Math.max(0, Math.ceil((new Date(previewData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 3,
        });
      case 'confirmation':
        return ConfirmationEmail({
          ...commonProps,
          isAttending: true,
          plusOneCount: 1,
          mealPreference: 'Chicken',
          dietaryRestrictions: ['Gluten-free'],
          calendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
          venueAddress: '123 Example Venue, City, State 12345',
        });
      default:
        return null;
    }
  }, [templateType, previewData, customization]);

  // Render the email HTML
  useEffect(() => {
    let cancelled = false;

    async function renderEmail() {
      if (!emailComponent) {
        setError('Invalid template type');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const html = await render(emailComponent);
        if (!cancelled) {
          setEmailHtml(html);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render email');
          setIsLoading(false);
        }
      }
    }

    renderEmail();

    return () => {
      cancelled = true;
    };
  }, [emailComponent]);

  const templateLabels: Record<string, string> = {
    invitation: 'Invitation Email',
    reminder: 'Reminder Email',
    confirmation: 'Confirmation Email',
  };

  const subjectLines: Record<string, string> = {
    invitation: `You're Invited: ${previewData.eventName}`,
    reminder: `Reminder: Please RSVP for ${previewData.eventName}`,
    confirmation: `RSVP Confirmed: ${previewData.eventName}`,
  };

  return (
    <div className="email-preview-container">
      {/* Preview Header */}
      <div className="email-preview-header">
        <span className="preview-label">Preview</span>
        <span className="template-type">{templateLabels[templateType]}</span>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop')}
            title="Desktop view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
            title="Mobile view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Email Client Mockup */}
      <div className={`email-client-mockup ${viewMode}`}>
        {/* Toolbar */}
        <div className="email-toolbar">
          <div className="toolbar-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="toolbar-actions">
            <button className="toolbar-btn" disabled title="Reply">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
            <button className="toolbar-btn" disabled title="Forward">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 17 20 12 15 7" />
                <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
              </svg>
            </button>
            <button className="toolbar-btn" disabled title="Archive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <button className="toolbar-btn" disabled title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Email Header */}
        <div className="email-header-info">
          <div className="email-subject">{subjectLines[templateType]}</div>
          <div className="email-meta">
            <div className="sender-info">
              <div className="sender-avatar" style={{ backgroundColor: customization.primaryColor }}>
                S
              </div>
              <div className="sender-details">
                <span className="sender-name">Seatify</span>
                <span className="sender-email">noreply@seatify.app</span>
              </div>
            </div>
            <div className="email-time">Just now</div>
          </div>
          <div className="recipient-info">
            <span className="to-label">To:</span>
            <span className="recipient-email">{previewData.guestName.toLowerCase().replace(/\s+/g, '.')}@example.com</span>
          </div>
        </div>

        {/* Email Content */}
        <div className="email-content-wrapper">
          {isLoading ? (
            <div className="email-loading">
              <div className="loading-spinner" />
              <p>Generating preview...</p>
            </div>
          ) : error ? (
            <div className="email-error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          ) : (
            <iframe
              srcDoc={emailHtml}
              className="email-iframe"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailPreview;
