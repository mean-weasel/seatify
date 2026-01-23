# Custom SMTP Email Setup Plan

## Goal
Replace Supabase's default email sender with a custom SMTP provider for branded, reliable email delivery.

## Recommended Provider: Resend
- Modern API, excellent deliverability
- Free tier: 3,000 emails/month
- Easy domain verification
- Alternative: SendGrid (100 emails/day free)

## Setup Steps

### 1. Create Resend Account
- Sign up at resend.com
- Add and verify domain (DNS TXT record)
- Generate API key

### 2. Configure Supabase SMTP
Navigate to: Supabase Dashboard → Project Settings → Auth → SMTP Settings

| Setting | Value |
|---------|-------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_xxxxxx` (API key) |
| Sender email | `noreply@seatify.app` |
| Sender name | `Seatify` |

### 3. Customize Email Templates
Supabase Dashboard → Auth → Email Templates

Templates to customize:
- **Confirm signup** - Welcome + verify email
- **Magic Link** - Passwordless login
- **Change Email** - Email change confirmation
- **Reset Password** - Password reset link

### 4. DNS Records Required
```
TXT  _resend.seatify.app  → (provided by Resend)
```

## Cost Estimate
- Resend free tier sufficient for MVP
- Upgrade at ~$20/month if exceeding 3K emails

## Timeline
~30 minutes to complete setup and verify.
