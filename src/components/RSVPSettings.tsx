'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { loadRSVPSettings, saveRSVPSettings } from '@/actions/rsvpSettings';
import { DEFAULT_RSVP_SETTINGS, DEFAULT_EMAIL_PRIMARY_COLOR } from '@/lib/constants/rsvp';
import { useSubscription } from '@/hooks/useSubscription';
import { copyToClipboard } from '@/utils/qrCodeUtils';
import { showToast } from './toastStore';
import { EmailPreview } from './EmailPreview';
import type { RSVPSettings as RSVPSettingsType } from '@/types';
import './RSVPSettings.css';

interface RSVPSettingsProps {
  eventId: string;
  eventName: string;
}

export function RSVPSettings({ eventId, eventName: _eventName }: RSVPSettingsProps) {
  const { isPro } = useSubscription();
  const [settings, setSettings] = useState<RSVPSettingsType>({
    eventId,
    ...DEFAULT_RSVP_SETTINGS,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newMealOption, setNewMealOption] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate RSVP URL
  const rsvpUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/rsvp/${eventId}`
    : '';

  // Load settings on mount
  useEffect(() => {
    async function fetchSettings() {
      const result = await loadRSVPSettings(eventId);
      if (result.data) {
        setSettings(result.data);
      } else if (result.error) {
        showToast('Failed to load RSVP settings', 'error');
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, [eventId]);

  // Save settings
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await saveRSVPSettings(settings);
    if (result.success) {
      showToast('RSVP settings saved', 'success');
    } else {
      showToast(result.error || 'Failed to save settings', 'error');
    }
    setIsSaving(false);
  }, [settings]);

  // Update a single setting
  const updateSetting = <K extends keyof RSVPSettingsType>(
    key: K,
    value: RSVPSettingsType[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Add meal option
  const handleAddMealOption = () => {
    const trimmed = newMealOption.trim();
    if (trimmed && !settings.mealOptions.includes(trimmed)) {
      updateSetting('mealOptions', [...settings.mealOptions, trimmed]);
      setNewMealOption('');
    }
  };

  // Remove meal option
  const handleRemoveMealOption = (option: string) => {
    updateSetting(
      'mealOptions',
      settings.mealOptions.filter(o => o !== option)
    );
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    const success = await copyToClipboard(rsvpUrl);
    if (success) {
      setCopied(true);
      showToast('RSVP link copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="rsvp-settings-loading">
        <div className="loading-spinner" />
        <p>Loading RSVP settings...</p>
      </div>
    );
  }

  return (
    <div className="rsvp-settings">
      <div className="rsvp-settings-header">
        <h2>RSVP Settings</h2>
        <p className="rsvp-settings-description">
          Configure how guests can respond to your event invitation
        </p>
      </div>

      {/* Enable Toggle */}
      <div className="rsvp-setting-group">
        <div className="setting-row toggle-row">
          <div className="setting-info">
            <label htmlFor="rsvp-enabled">Enable RSVP</label>
            <span className="setting-hint">Allow guests to respond online</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              id="rsvp-enabled"
              checked={settings.enabled}
              onChange={e => updateSetting('enabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* RSVP Link */}
          <div className="rsvp-setting-group">
            <h3>Shareable Link</h3>
            <div className="rsvp-link-container">
              <input
                type="text"
                className="rsvp-link-input"
                value={rsvpUrl}
                readOnly
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`rsvp-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyUrl}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              className="qr-toggle-btn"
              onClick={() => setShowQRCode(!showQRCode)}
            >
              {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQRCode && (
              <div className="rsvp-qr-container">
                <QRCode value={rsvpUrl} size={150} level="M" />
                <p className="qr-hint">Guests can scan to RSVP</p>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="rsvp-setting-group">
            <h3>Response Deadline</h3>
            <div className="setting-row">
              <input
                type="datetime-local"
                className="deadline-input"
                value={settings.deadline ? settings.deadline.slice(0, 16) : ''}
                onChange={e => updateSetting('deadline', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
              {settings.deadline && (
                <button
                  className="clear-btn"
                  onClick={() => updateSetting('deadline', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            <span className="setting-hint">Leave empty for no deadline</span>
          </div>

          {/* Plus-Ones */}
          <div className="rsvp-setting-group">
            <h3>Plus-Ones</h3>
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="allow-plus-ones">Allow plus-ones</label>
                <span className="setting-hint">Let guests bring additional people</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="allow-plus-ones"
                  checked={settings.allowPlusOnes}
                  onChange={e => updateSetting('allowPlusOnes', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            {settings.allowPlusOnes && (
              <div className="setting-row">
                <label htmlFor="max-plus-ones">Maximum per guest:</label>
                <select
                  id="max-plus-ones"
                  value={settings.maxPlusOnes}
                  onChange={e => updateSetting('maxPlusOnes', parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Meal Options */}
          <div className="rsvp-setting-group">
            <h3>Meal Options</h3>
            <span className="setting-hint">Add options for guests to choose from</span>
            <div className="meal-options-list">
              {settings.mealOptions.map((option, index) => (
                <div key={index} className="meal-option-item">
                  <span>{option}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveMealOption(option)}
                    aria-label={`Remove ${option}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="add-meal-option">
              <input
                type="text"
                placeholder="e.g., Chicken, Fish, Vegetarian..."
                value={newMealOption}
                onChange={e => setNewMealOption(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMealOption()}
              />
              <button onClick={handleAddMealOption} disabled={!newMealOption.trim()}>
                Add
              </button>
            </div>
          </div>

          {/* Data Collection */}
          <div className="rsvp-setting-group">
            <h3>Information to Collect</h3>
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="collect-dietary">Dietary restrictions</label>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="collect-dietary"
                  checked={settings.collectDietary}
                  onChange={e => updateSetting('collectDietary', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="collect-accessibility">Accessibility needs</label>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="collect-accessibility"
                  checked={settings.collectAccessibility}
                  onChange={e => updateSetting('collectAccessibility', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="collect-seating">Seating preferences</label>
                <span className="setting-hint">&quot;Who would you like to sit near?&quot;</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="collect-seating"
                  checked={settings.collectSeatingPreferences}
                  onChange={e => updateSetting('collectSeatingPreferences', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Custom Messages */}
          <div className="rsvp-setting-group">
            <h3>Custom Messages</h3>
            <div className="setting-row vertical">
              <label htmlFor="custom-message">Welcome message</label>
              <textarea
                id="custom-message"
                placeholder="Displayed at the top of the RSVP page..."
                value={settings.customMessage || ''}
                onChange={e => updateSetting('customMessage', e.target.value || undefined)}
                rows={3}
              />
            </div>
            <div className="setting-row vertical">
              <label htmlFor="confirmation-message">Confirmation message</label>
              <textarea
                id="confirmation-message"
                placeholder="Shown after guest submits their response..."
                value={settings.confirmationMessage || ''}
                onChange={e => updateSetting('confirmationMessage', e.target.value || undefined)}
                rows={3}
              />
            </div>
          </div>

          {/* Email Reminders (Pro Feature) */}
          <div className="rsvp-setting-group">
            <h3>
              Automatic Reminders
              {!isPro && <span className="pro-badge">Pro</span>}
            </h3>
            {isPro ? (
              <>
                <div className="setting-row toggle-row">
                  <div className="setting-info">
                    <label htmlFor="reminder-enabled">Enable automatic reminders</label>
                    <span className="setting-hint">Send email reminders to guests who haven&apos;t responded</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      id="reminder-enabled"
                      checked={settings.reminderEnabled || false}
                      onChange={e => updateSetting('reminderEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {settings.reminderEnabled && settings.deadline && (
                  <div className="setting-row">
                    <label htmlFor="reminder-days">Send reminder</label>
                    <select
                      id="reminder-days"
                      value={settings.reminderDaysBefore || 7}
                      onChange={e => updateSetting('reminderDaysBefore', parseInt(e.target.value))}
                    >
                      <option value={3}>3 days before deadline</option>
                      <option value={5}>5 days before deadline</option>
                      <option value={7}>7 days before deadline</option>
                      <option value={14}>14 days before deadline</option>
                    </select>
                  </div>
                )}
                {settings.reminderEnabled && !settings.deadline && (
                  <p className="setting-warning">Set a deadline above to enable automatic reminders.</p>
                )}
              </>
            ) : (
              <div className="pro-feature-promo">
                <p>Automatically remind guests who haven&apos;t responded yet.</p>
                <a href="/settings/billing" className="upgrade-link">Upgrade to Pro</a>
              </div>
            )}
          </div>

          {/* Email Customization */}
          <div className="rsvp-setting-group">
            <h3>Email Customization</h3>

            {/* Primary Color */}
            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="email-primary-color">Primary color</label>
                <span className="setting-hint">Button and accent color in emails</span>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  id="email-primary-color"
                  className="color-picker-input"
                  value={settings.emailPrimaryColor || DEFAULT_EMAIL_PRIMARY_COLOR}
                  onChange={e => updateSetting('emailPrimaryColor', e.target.value)}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={settings.emailPrimaryColor || DEFAULT_EMAIL_PRIMARY_COLOR}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      updateSetting('emailPrimaryColor', value);
                    }
                  }}
                  placeholder="#E07A5F"
                />
              </div>
            </div>

            {/* Sender Name */}
            <div className="setting-row vertical">
              <label htmlFor="email-sender-name">Sender name</label>
              <input
                type="text"
                id="email-sender-name"
                className="text-input"
                placeholder="Seatify"
                value={settings.emailSenderName || ''}
                onChange={e => updateSetting('emailSenderName', e.target.value || undefined)}
              />
              <span className="setting-hint">Display name guests see in their inbox</span>
            </div>

            {/* Subject Template */}
            <div className="setting-row vertical">
              <label htmlFor="email-subject-template">Subject line template</label>
              <input
                type="text"
                id="email-subject-template"
                className="text-input"
                placeholder="You're Invited: {eventName}"
                value={settings.emailSubjectTemplate || ''}
                onChange={e => updateSetting('emailSubjectTemplate', e.target.value || undefined)}
              />
              <span className="setting-hint">Use {'{eventName}'} as a placeholder</span>
            </div>

            {/* Header Image (Pro Only) */}
            <div className="setting-row vertical">
              <div className="setting-label-row">
                <label htmlFor="email-header-image">Header image URL</label>
                {!isPro && <span className="pro-badge">Pro</span>}
              </div>
              {isPro ? (
                <>
                  <input
                    type="url"
                    id="email-header-image"
                    className="text-input"
                    placeholder="https://example.com/your-logo.png"
                    value={settings.emailHeaderImageUrl || ''}
                    onChange={e => updateSetting('emailHeaderImageUrl', e.target.value || undefined)}
                  />
                  <span className="setting-hint">Replaces the Seatify logo in emails (max 200x80px recommended)</span>
                </>
              ) : (
                <div className="pro-feature-inline">
                  <span>Add your own logo to emails</span>
                  <a href="/settings/billing" className="upgrade-link-inline">Upgrade</a>
                </div>
              )}
            </div>

            {/* Hide Seatify Branding (Pro Only) */}
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="hide-branding">Hide Seatify branding</label>
                {!isPro && <span className="pro-badge">Pro</span>}
                <span className="setting-hint">Remove &quot;Powered by Seatify&quot; from emails</span>
              </div>
              {isPro ? (
                <label className="toggle">
                  <input
                    type="checkbox"
                    id="hide-branding"
                    checked={settings.hideSeatifyBranding || false}
                    onChange={e => updateSetting('hideSeatifyBranding', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              ) : (
                <a href="/settings/billing" className="upgrade-link-inline">Upgrade</a>
              )}
            </div>
          </div>

          {/* Confirmation Emails */}
          <div className="rsvp-setting-group">
            <h3>Confirmation Emails</h3>

            {/* Send Confirmation Email */}
            <div className="setting-row toggle-row">
              <div className="setting-info">
                <label htmlFor="send-confirmation">Send confirmation email</label>
                <span className="setting-hint">Automatically email guests after they RSVP</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="send-confirmation"
                  checked={settings.sendConfirmationEmail ?? true}
                  onChange={e => updateSetting('sendConfirmationEmail', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Include Calendar Invite */}
            {(settings.sendConfirmationEmail ?? true) && (
              <div className="setting-row toggle-row">
                <div className="setting-info">
                  <label htmlFor="include-calendar">Include calendar invite</label>
                  <span className="setting-hint">Add &quot;Add to Calendar&quot; button for confirmed guests</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    id="include-calendar"
                    checked={settings.includeCalendarInvite ?? true}
                    onChange={e => updateSetting('includeCalendarInvite', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            )}
          </div>

          {/* Email Preview */}
          <div className="rsvp-setting-group email-preview-group">
            <h3>Email Preview</h3>
            <EmailPreview
              templateType="invitation"
              previewData={{
                guestName: 'Jane Doe',
                eventName: _eventName,
                eventDate: settings.deadline,
                customMessage: settings.customMessage,
                deadline: settings.deadline,
              }}
              customization={{
                primaryColor: settings.emailPrimaryColor || DEFAULT_EMAIL_PRIMARY_COLOR,
                headerImageUrl: settings.emailHeaderImageUrl,
                hideBranding: settings.hideSeatifyBranding || false,
              }}
            />
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="rsvp-settings-footer">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
