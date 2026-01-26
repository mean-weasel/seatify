/**
 * Calendar utility functions for generating calendar events
 * Supports ICS file generation and calendar URL creation for Google and Outlook
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  url?: string;
}

/**
 * Formats a Date object to ICS date format (YYYYMMDDTHHMMSSZ)
 * @param date - The date to format
 * @returns Formatted date string in ICS format
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Formats a Date object to Google Calendar date format (YYYYMMDDTHHMMSSZ)
 * Same format as ICS but used in URL parameters
 * @param date - The date to format
 * @returns Formatted date string
 */
function formatGoogleCalendarDate(date: Date): string {
  return formatICSDate(date);
}

/**
 * Formats a Date object to Outlook Calendar date format (ISO 8601)
 * @param date - The date to format
 * @returns Formatted date string in ISO 8601 format
 */
function formatOutlookDate(date: Date): string {
  return date.toISOString();
}

/**
 * Escapes special characters in ICS text fields
 * According to RFC 5545, certain characters need to be escaped
 * @param text - The text to escape
 * @returns Escaped text
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Folds long lines in ICS content according to RFC 5545
 * Lines longer than 75 characters should be folded
 * @param line - The line to fold
 * @returns Folded line(s)
 */
function foldICSLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }

  const lines: string[] = [];
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const chunkLength = isFirst ? maxLength : maxLength - 1;
    const chunk = remaining.substring(0, chunkLength);
    remaining = remaining.substring(chunkLength);

    if (isFirst) {
      lines.push(chunk);
      isFirst = false;
    } else {
      lines.push(' ' + chunk);
    }
  }

  return lines.join('\r\n');
}

/**
 * Generates a unique identifier for ICS events
 * @returns A unique identifier string
 */
function generateUID(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}@seatify.app`;
}

/**
 * Generates ICS (iCalendar) file content for a calendar event
 * Follows RFC 5545 specification
 * @param event - The calendar event details
 * @returns Valid .ics format string
 */
export function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Seatify//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    foldICSLine(`SUMMARY:${escapeICSText(event.title)}`),
  ];

  if (event.description) {
    lines.push(foldICSLine(`DESCRIPTION:${escapeICSText(event.description)}`));
  }

  if (event.location) {
    lines.push(foldICSLine(`LOCATION:${escapeICSText(event.location)}`));
  }

  if (event.url) {
    lines.push(foldICSLine(`URL:${event.url}`));
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // ICS files use CRLF line endings
  return lines.join('\r\n');
}

/**
 * Generates a Google Calendar URL for adding an event
 * @param event - The calendar event details
 * @returns Google Calendar add event URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.startDate)}/${formatGoogleCalendarDate(endDate)}`,
  });

  if (event.description) {
    // Google Calendar accepts HTML in details, but we keep it simple
    let details = event.description;
    if (event.url) {
      details += `\n\nMore info: ${event.url}`;
    }
    params.set('details', details);
  } else if (event.url) {
    params.set('details', `More info: ${event.url}`);
  }

  if (event.location) {
    params.set('location', event.location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates an Outlook Calendar URL for adding an event
 * Uses the Outlook.com web calendar
 * @param event - The calendar event details
 * @returns Outlook Calendar add event URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    subject: event.title,
    startdt: formatOutlookDate(event.startDate),
    enddt: formatOutlookDate(endDate),
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  if (event.description) {
    let body = event.description;
    if (event.url) {
      body += `\n\nMore info: ${event.url}`;
    }
    params.set('body', body);
  } else if (event.url) {
    params.set('body', `More info: ${event.url}`);
  }

  if (event.location) {
    params.set('location', event.location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Triggers download of an ICS file in the browser
 * @param event - The calendar event details
 * @param filename - Optional filename (defaults to event title)
 */
export function downloadICS(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
