# Idea: Seatify Full-Stack Migration

> Transform Seatify from a client-side React/Vite app into a full-stack SaaS with user accounts, cloud persistence, SEO optimization, and shareable event links.

## The Problem

Seatify currently runs entirely client-side with localStorage persistence. This creates several limitations:

1. **No organic discovery** — Client-rendered pages rank poorly in search; can't compete for "seating chart maker" keywords
2. **Poor social sharing** — No server-rendered Open Graph tags means ugly/missing link previews when users share
3. **No user data** — Can't track real usage patterns, funnels, or feature adoption
4. **Data fragility** — User's work disappears if they clear browser data or switch devices
5. **No monetization path** — Can't implement accounts, plans, or billing without a backend

Google Ads validation showed real demand (576 clicks, $0.30 CPC, 114 pending conversions), but the current architecture can't capture or retain these users effectively.

## The Solution

Migrate to **Next.js App Router + Supabase + Vercel** to unlock:

- **SSR landing pages** for organic search ranking
- **Dynamic Open Graph tags** for social sharing of individual events
- **Cloud persistence** with user accounts (Supabase Auth + Postgres)
- **Real analytics** on the signup → activation funnel
- **Foundation for billing** when ready to monetize

### Why This Stack?

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js (App Router) | SSR for SEO, React compatibility, Vercel integration |
| Backend | Supabase | Familiar to team, fast to ship, auth + DB + RLS in one |
| Hosting | Vercel | Native Next.js support, edge functions, easy CI/CD |
| Analytics | PostHog or Mixpanel | Funnel tracking, feature flags, session replay |

The existing React codebase is ~80% reusable — components, hooks, and Zustand store port directly. Main work is routing and data fetching patterns.

## Target Users

**Primary**: Couples planning weddings (largest segment searching for seating tools)

**Secondary**: Event planners, corporate event coordinators, party hosts

**Where to find them**:
- Google search ("wedding seating chart maker", "seating arrangement tool")
- Pinterest (wedding planning boards)
- Wedding forums/subreddits
- Referrals from guests who see shared seating charts (viral loop)

## Competition & Differentiation

**Existing solutions**:
- AllSeated, Social Tables — Enterprise-focused, expensive, complex
- Free online tools — Clunky, outdated UIs, limited features
- Spreadsheets — What most people actually use today

**Seatify differentiators**:
- Modern, clean UI optimized for the task
- Constraint-based optimization (partners together, avoid conflicts)
- Free tier with generous limits
- Shareable links for guests to find their seats

## Riskiest Assumptions

1. **Migration timeline (1-2 weeks)** — Next.js App Router has learning curve nuances (server vs. client components, caching) that could slow things down

2. **SEO will drive meaningful organic traffic** — Assumption that ranking for seating-related keywords is achievable; competition may be higher than expected

3. **Shareable links create viral loops** — Assumption that guests viewing their seat assignment will convert to users for their own events

4. **Freemium conversion** — Assumption that some percentage of free users will pay for premium features (unvalidated)

## MVP Scope (Phase 1: Week 1-2)

**Must have**:
- [ ] Next.js App Router project setup with Vercel deployment
- [ ] SSR landing pages (/, /features, /pricing placeholder)
- [ ] Supabase Auth (email/password, Google OAuth)
- [ ] Postgres schema: users, events, tables, guests, constraints
- [ ] Row-level security policies (users see only their events)
- [ ] Migrate core canvas/seating components from Vite app
- [ ] Basic dashboard: list of user's events
- [ ] Analytics: PostHog or Mixpanel for funnel tracking
- [ ] Event tracking: signup, first_event_created, first_guest_added, first_assignment

**Defer to Phase 2**:
- Shareable view-only event links
- Open Graph image generation
- Guest search ("find my seat")

**Defer to v2**:
- Guest interactions (seat change requests, notes)
- Billing/subscription infrastructure
- RSVP integrations (API or enhanced CSV)
- Collaboration (invite co-planners)

## Possible Directions

### Direction 1: Pure SEO Play
Focus entirely on organic acquisition. Build out a content strategy (blog posts, guides), optimize for long-tail keywords, defer user accounts until organic traffic is proven.

**Pros**: Lower engineering lift, tests organic channel before building infra
**Cons**: Slower feedback loop, can't track real usage
**When to choose**: If paid acquisition costs rise or ad budget is constrained

### Direction 2: Viral/Shareable Focus
Prioritize the shareable event link feature over SEO. Make it dead simple for hosts to share "find your seat" links, optimize for guest → host conversion.

**Pros**: Built-in distribution, word-of-mouth growth
**Cons**: Requires critical mass of events to generate meaningful guest traffic
**When to choose**: If early users show high sharing intent

### Direction 3: Full SaaS (Recommended)
Build the complete foundation: auth, persistence, SSR, analytics, billing scaffolding. Ship iteratively but with the architecture to support paid plans.

**Pros**: Can monetize when ready, real usage data, professional product feel
**Cons**: More upfront work, may build features users don't need
**When to choose**: If you have confidence in demand and time to invest

## Analytics & Instrumentation Plan

### Core Funnel Events
```
landing_page_view
signup_started
signup_completed
first_event_created
first_table_added
first_guest_added
first_seat_assigned
event_completed (all guests assigned)
event_shared
event_exported
```

### Key Metrics to Track
- **Activation rate**: signup → first_event_created (target: >50%)
- **Completion rate**: first_event_created → event_completed (target: >30%)
- **Time to value**: minutes from signup to first_seat_assigned
- **Feature usage**: which tools (optimizer, constraints, relationships) get used
- **Sharing rate**: what % of completed events get shared

### Session Replay
Enable for first 1000 users to watch where people get stuck. PostHog and Mixpanel both support this.

## New Pages Needed

| Page | Purpose | Priority |
|------|---------|----------|
| `/` | Landing page (SSR, SEO-optimized) | P0 |
| `/login`, `/signup` | Auth flows | P0 |
| `/dashboard` | List of user's events | P0 |
| `/event/[id]` | Event editor (canvas) | P0 |
| `/event/[id]/view` | Public shareable view | P1 |
| `/profile` | Account settings | P1 |
| `/pricing` | Plans/pricing (placeholder initially) | P2 |
| `/blog` | SEO content | P2 |

## Integration Opportunities (v2+)

### Guest List Import
- **Eventbrite API** — Good API, can pull attendee lists
- **Google Sheets** — OAuth integration, import from planning spreadsheets
- **CSV upload** — Already implemented, keep as fallback

### RSVP Platforms (Lower Priority)
- **The Knot, Zola** — Closed ecosystems, unlikely to get API access
- **WeddingWire** — Similar situation
- **Manual CSV export** — Users can export from these platforms

### Notifications
- **Email** — SendGrid/Resend for "your seating chart is ready" emails
- **SMS** — Twilio for "find your seat" links to guests (premium feature)

## Open Questions

- [ ] What's the right free tier limit? (X events? Y guests per event?)
- [ ] Should shareable links require the host to have a paid account?
- [ ] Is there demand for white-labeling (wedding planners using Seatify for clients)?
- [ ] How much would users pay? ($5/event? $10/month? $50/year?)

## Next Steps

### This Week
1. **Scaffold Next.js project** with App Router, Tailwind, Supabase client
2. **Design Postgres schema** for multi-tenant SaaS (users → events → tables → guests)
3. **Set up Supabase project** with Auth and RLS policies
4. **Port core components** from Vite (Canvas, Table, Guest, etc.)

### Next Week
5. **Build auth flows** (signup, login, password reset)
6. **Build dashboard** (list events, create new event)
7. **Connect canvas to Supabase** (replace localStorage with real persistence)
8. **Deploy to Vercel** with production domain
9. **Instrument analytics** (PostHog setup, core funnel events)

### Following Weeks
10. **Shareable view-only links** with Open Graph images
11. **Re-enable Google Ads** pointing to new landing page
12. **Monitor funnel metrics** and iterate based on drop-off points
