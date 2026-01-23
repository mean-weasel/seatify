# Production Deployment Plan for seatify.app

## Executive Summary

This plan covers the complete deployment of Seatify to production on the domain seatify.app. The application is a Next.js 16 app with Supabase backend, deploying to Vercel.

---

## Pre-Deployment Checklist

### 1. Environment Variables Audit

**Current State:**
- `.env.local` contains staging Supabase credentials
- `.env.test.local` uses local Supabase for E2E testing

**Required Production Variables:**
| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key | Supabase Dashboard |
| `NEXT_PUBLIC_APP_URL` | `https://seatify.app` | Hardcoded |
| `NEXT_PUBLIC_GA4_ID` | GA4 measurement ID | Google Analytics |

**Required Actions:**
1. Create production Supabase project and note URL/anon key
2. Add environment variables to Vercel for production
3. Verify Vercel secrets are configured (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)

**Priority:** Critical

---

### 2. Database Migration Status

**Current State:**
- 3 migrations exist in `/supabase/migrations/`
- Complete schema in `supabase/schema.sql`
- Production seed script at `supabase/seed-production.sql`
- Demo RLS policies at `supabase/demo-rls-policies.sql`

**Required Actions:**
1. Create production Supabase project
2. Apply migrations via `supabase db push` or Supabase dashboard
3. Run `seed-production.sql` to create demo event
4. Apply `demo-rls-policies.sql` for public demo access
5. Verify all tables have correct RLS policies enabled

**Priority:** Critical

---

### 3. Third-Party Service Configurations

| Service | Status | Configuration Needed |
|---------|--------|---------------------|
| Google OAuth | Configured | Add production redirect URI |
| GA4 Analytics | Configured | Verify property ID |
| Google Ads | Linked | Verify conversion tracking |
| Formspree | Configured | No changes needed |
| Resend SMTP | Configured | Already set up for seatify.app |

**Google OAuth (Critical):**
1. Go to Google Cloud Console > Credentials
2. Add production redirect URI: `https://seatify.app/auth/callback`
3. Update Supabase Auth settings with production site URL

**Priority:** Critical

---

## Domain & DNS Configuration

### 1. Domain Configuration on Vercel

**Required Actions:**

**Step 1: Add Domain to Vercel**
```
1. Go to Vercel Project Settings > Domains
2. Add domain: seatify.app
3. Add www subdomain: www.seatify.app
4. Configure redirect: www.seatify.app -> seatify.app (recommended)
```

**Step 2: DNS Records at Registrar**
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

**Priority:** Critical

---

### 2. SSL Certificate Setup

Vercel automatically provisions SSL via Let's Encrypt. Verify after DNS propagation (24-48 hours).

---

### 3. Email DNS Records for Resend

Already configured for `seatify.app`. Verify these records exist:
```
Type    Name                Value
TXT     _resend            (provided by Resend dashboard)
TXT     @                  v=spf1 include:_spf.resend.com ~all
CNAME   resend._domainkey  (provided by Resend)
```

**Priority:** High

---

## Supabase Production Setup

### 1. Production Project Configuration

**Required Actions:**

**Step 1: Create Production Project**
1. Go to Supabase Dashboard > New Project
2. Region: Choose closest to primary user base
3. Note: Project URL and anon key

**Step 2: Apply Schema**
```bash
# Option A: Via Supabase CLI
supabase link --project-ref <prod-project-ref>
supabase db push

# Option B: Via SQL Editor
# Run supabase/schema.sql in Supabase SQL Editor
```

**Step 3: Create Demo User**
1. Authentication > Users > Add User
2. Email: `demo@seatify.app`
3. Auto-confirm: Yes
4. Copy UUID for seed script

**Step 4: Seed Demo Data**
1. Update UUID in `seed-production.sql`
2. Run script in SQL Editor

**Priority:** Critical

---

### 2. RLS Policies Verification

Run verification query after migration:
```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

Verify all tables have RLS enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Priority:** Critical

---

### 3. Database Backups

1. Enable daily backups (Supabase Pro plan includes this)
2. Configure backup retention (7 days minimum)
3. Test restore procedure in staging first
4. Document backup recovery process

**Priority:** High

---

### 4. Connection Pooling

1. Enable connection pooling in Supabase dashboard
2. Go to Settings > Database > Connection Pooling
3. Enable Supavisor
4. Note pooled connection string if needed

**Priority:** Medium

---

## Monitoring & Observability

### 1. Error Tracking

**Recommended: Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configuration:
1. Create Sentry project at sentry.io
2. Add DSN to environment variables
3. Configure `sentry.client.config.ts` and `sentry.server.config.ts`
4. Add `SENTRY_DSN` to Vercel environment variables

**Priority:** High

---

### 2. Performance Monitoring

**Current State:**
- Web Vitals tracking implemented in `src/utils/analytics.ts`
- Tracks CLS, FCP, LCP, TTFB, INP via GA4 events

**Required Actions:**
1. Verify Web Vitals are flowing to GA4
2. Set up GA4 dashboard for Core Web Vitals
3. Enable Vercel Analytics for server-side metrics
4. Set performance budgets:
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

**Priority:** Medium

---

### 3. Uptime Monitoring

**Recommended: Better Uptime (Free tier)**
1. Create account at betteruptime.com
2. Add monitors:
   - `https://seatify.app` (homepage)
   - `https://seatify.app/api/health` (create health endpoint)
3. Configure alerts (email, Slack)

**Priority:** High

---

### 4. Log Aggregation

1. Enable Vercel Log Drains (Pro plan) for long-term storage
2. Configure log retention policy
3. Set up alerts for error patterns

**Priority:** Medium

---

## Security

### 1. Security Headers

Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

**Priority:** High

---

### 2. Rate Limiting

Consider implementing rate limiting for API routes using Vercel Edge Config or Supabase rate limits.

**Priority:** Medium

---

### 3. CORS Configuration

Update Supabase project settings:
1. Add `https://seatify.app` to allowed origins
2. Add `https://www.seatify.app` if using www
3. Verify CORS in browser dev tools after deployment

**Priority:** Critical

---

### 4. Content Security Policy

Add CSP header (start permissive, tighten over time):
```typescript
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://formspree.io;
    frame-ancestors 'none';
  `.replace(/\n/g, '')
}
```

**Priority:** Medium

---

## Rollback Plan

### 1. Deployment Rollback Procedure

**Vercel Instant Rollback:**
1. Go to Vercel Dashboard > Deployments
2. Find previous successful deployment
3. Click "..." menu > "Promote to Production"
4. Rollback is instant (< 1 second)

**Git-Based Rollback:**
```bash
git revert HEAD
git push origin main
```

**Priority:** Critical documentation

---

### 2. Database Rollback Considerations

**Migration Rollback:**
- Supabase migrations are forward-only by default
- Create explicit "down" migrations for critical changes
- Document rollback SQL for each migration

**Data Rollback:**
1. Restore from Supabase backup
2. Point-in-time recovery (Supabase Pro)
3. Export/import specific tables if needed

**Priority:** High documentation

---

### 3. Feature Flag Emergency Shutoff

Recommended implementation:
```typescript
// src/lib/features.ts
export const FEATURES = {
  newOptimizer: process.env.NEXT_PUBLIC_FEATURE_NEW_OPTIMIZER === 'true',
  emailCapture: process.env.NEXT_PUBLIC_FEATURE_EMAIL_CAPTURE !== 'false',
};
```

**Priority:** Medium (for future)

---

## Implementation Timeline

### Phase 1: Critical (Day 1)
| Task | Effort |
|------|--------|
| Create production Supabase project | 30 min |
| Apply database schema and migrations | 30 min |
| Configure Vercel environment variables | 15 min |
| Add domain to Vercel | 15 min |
| Configure DNS records | 15 min |
| Update Google OAuth redirect URIs | 15 min |
| Configure Supabase CORS settings | 10 min |

### Phase 2: High Priority (Day 2)
| Task | Effort |
|------|--------|
| Seed demo event in production | 15 min |
| Verify RLS policies | 30 min |
| Add security headers | 30 min |
| Verify Resend SMTP working | 15 min |
| Set up uptime monitoring | 30 min |

### Phase 3: Medium Priority (Day 3-4)
| Task | Effort |
|------|--------|
| Implement Sentry error tracking | 1 hour |
| Configure connection pooling | 30 min |
| Add Content Security Policy | 1 hour |
| Document rollback procedures | 1 hour |
| Test complete user flows | 2 hours |

---

## Pre-Launch Checklist

```
[ ] Production Supabase project created
[ ] Database schema applied
[ ] Demo event seeded
[ ] RLS policies verified
[ ] Environment variables in Vercel
[ ] Domain added to Vercel
[ ] DNS records configured
[ ] SSL certificate active
[ ] Google OAuth redirect URIs updated
[ ] CORS settings configured
[ ] Security headers implemented
[ ] Resend SMTP verified
[ ] Uptime monitoring active
[ ] Error tracking configured
[ ] GA4 data flowing
[ ] Full user flow tested
[ ] Rollback procedure documented
```

---

## Post-Launch Checklist

```
[ ] Monitor error rates for 24 hours
[ ] Verify all analytics events flowing
[ ] Check Core Web Vitals in Google Search Console
[ ] Test signup/login flows
[ ] Verify demo mode works
[ ] Check email delivery (signup confirmation)
[ ] Monitor database performance
[ ] Review Vercel deployment logs
```
