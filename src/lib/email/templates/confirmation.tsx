import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
  Img,
} from '@react-email/components';

interface ConfirmationEmailProps {
  guestName: string;
  eventName: string;
  eventDate?: string;
  hostName?: string;
  isAttending: boolean;
  plusOneCount?: number;
  mealPreference?: string;
  dietaryRestrictions?: string[];
  calendarUrl?: string;
  venueAddress?: string;
  primaryColor?: string;
  headerImageUrl?: string;
  hideBranding?: boolean;
}

const DEFAULT_PRIMARY_COLOR = '#E07A5F';

export function ConfirmationEmail({
  guestName,
  eventName,
  eventDate,
  hostName,
  isAttending,
  plusOneCount,
  mealPreference,
  dietaryRestrictions,
  calendarUrl,
  venueAddress,
  primaryColor = DEFAULT_PRIMARY_COLOR,
  headerImageUrl,
  hideBranding = false,
}: ConfirmationEmailProps) {
  const previewText = isAttending
    ? `Your RSVP for ${eventName} is confirmed!`
    : `We've received your response for ${eventName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            {headerImageUrl ? (
              <Img
                src={headerImageUrl}
                alt="Event logo"
                style={headerImage}
              />
            ) : (
              <Text style={{ ...logo, color: primaryColor }}>Seatify</Text>
            )}
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {guestName},</Text>

            {isAttending ? (
              <>
                <Text style={paragraph}>
                  <strong>Thank you for confirming your attendance!</strong> We&apos;re
                  thrilled that you&apos;ll be joining us for{' '}
                  <strong>{eventName}</strong>.
                </Text>

                <Section style={{ ...responseSummary, borderLeft: `4px solid ${primaryColor}` }}>
                  <Text style={summaryTitle}>Your Response Summary</Text>
                  <Text style={summaryItem}>
                    <strong>Status:</strong> Attending
                  </Text>
                  {plusOneCount !== undefined && plusOneCount > 0 && (
                    <Text style={summaryItem}>
                      <strong>Additional Guests:</strong> {plusOneCount}
                    </Text>
                  )}
                  {mealPreference && (
                    <Text style={summaryItem}>
                      <strong>Meal Preference:</strong> {mealPreference}
                    </Text>
                  )}
                  {dietaryRestrictions && dietaryRestrictions.length > 0 && (
                    <Text style={summaryItem}>
                      <strong>Dietary Restrictions:</strong>{' '}
                      {dietaryRestrictions.join(', ')}
                    </Text>
                  )}
                </Section>

                {(eventDate || venueAddress) && (
                  <Section style={eventDetails}>
                    <Text style={eventDetailsTitle}>Event Details</Text>
                    <Text style={eventName_style}>{eventName}</Text>
                    {eventDate && (
                      <Text style={eventDetailItem}>
                        <strong>Date:</strong> {formatDate(eventDate)}
                      </Text>
                    )}
                    {venueAddress && (
                      <Text style={eventDetailItem}>
                        <strong>Location:</strong> {venueAddress}
                      </Text>
                    )}
                  </Section>
                )}

                {calendarUrl && (
                  <Section style={buttonContainer}>
                    <Button style={{ ...button, backgroundColor: primaryColor }} href={calendarUrl}>
                      Add to Calendar
                    </Button>
                  </Section>
                )}
              </>
            ) : (
              <>
                <Text style={paragraph}>
                  We&apos;ve received your response and understand that you won&apos;t
                  be able to attend <strong>{eventName}</strong>.
                </Text>

                <Section style={{ ...responseSummary, borderLeft: `4px solid ${primaryColor}` }}>
                  <Text style={summaryTitle}>Your Response Summary</Text>
                  <Text style={summaryItem}>
                    <strong>Status:</strong> Unable to Attend
                  </Text>
                </Section>

                <Text style={paragraph}>
                  We&apos;re sorry you can&apos;t make it, but we appreciate you
                  letting us know. If your plans change, please reach out to the
                  host.
                </Text>
              </>
            )}

            <Text style={paragraph}>
              If you need to make any changes to your response, please contact
              the event host.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            {hostName && (
              <Text style={footerText}>Hosted by {hostName}</Text>
            )}
            {!hideBranding && (
              <Text style={footerText}>
                Powered by{' '}
                <Link href="https://seatify.app" style={{ ...link, color: primaryColor }}>
                  Seatify
                </Link>
              </Text>
            )}
            <Text style={footerDisclaimer}>
              You received this email as confirmation of your RSVP for{' '}
              {eventName}. If you believe this was sent in error, please
              contact the event host.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px',
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  fontSize: '28px',
  fontWeight: '600' as const,
  fontFamily: '"Playfair Display", Georgia, serif',
  color: '#E07A5F',
  margin: '0',
  textAlign: 'center' as const,
  letterSpacing: '-0.02em',
};

const headerImage = {
  display: 'block',
  margin: '0 auto',
  maxWidth: '200px',
  maxHeight: '80px',
};

const content = {
  padding: '24px 48px',
};

const greeting = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#1f2937',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  marginBottom: '16px',
};

const responseSummary = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: '4px solid #E07A5F',
  marginBottom: '24px',
};

const summaryTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1f2937',
  marginTop: '0',
  marginBottom: '12px',
};

const summaryItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#374151',
  margin: '4px 0',
};

const eventDetails = {
  backgroundColor: '#fef7f5',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
};

const eventDetailsTitle = {
  fontSize: '14px',
  fontWeight: '500' as const,
  color: '#6b7280',
  marginTop: '0',
  marginBottom: '8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const eventName_style = {
  fontSize: '20px',
  fontWeight: '600' as const,
  color: '#1f2937',
  marginTop: '0',
  marginBottom: '12px',
};

const eventDetailItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#374151',
  margin: '4px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#E07A5F',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const link = {
  color: '#E07A5F',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  padding: '0 48px',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const footerDisclaimer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '16px',
};

export default ConfirmationEmail;
