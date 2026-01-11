# Seatify Full-Stack Migration Plan

> Detailed technical plan for migrating from React/Vite (client-side) to Next.js/Supabase/Vercel (full-stack SaaS)

## Executive Summary

**Current State**: Client-side React 19 + Vite app with Zustand/localStorage persistence
**Target State**: Next.js 15 App Router + Supabase + Vercel
**Estimated Effort**: 2-3 weeks for Phase 1 (MVP), 4-6 weeks total
**Risk Level**: Low-Medium (clean codebase, no major blockers)

---

## Codebase Analysis Summary

| Metric | Value |
|--------|-------|
| Source Files | 88 .tsx/.ts files |
| Lines of Code | ~25,381 |
| Component Files | 52 with hooks/effects |
| React Router Routes | 20+ routes |
| Zustand Store Size | ~1,500 lines |
| E2E Tests | 24 test files (Playwright) |
| Code Portability | ~80% direct port |

### Key Findings

1. **No blockers** - All dependencies Next.js compatible
2. **Clean routing** - URL structure maps 1:1 to App Router
3. **Heavy browser APIs** - Need `'use client'` boundaries
4. **localStorage hydration** - Needs SSR-safe wrapper
5. **No env vars** - Need to externalize config

---

## Phase 1: Foundation (Days 1-5)

### Day 1: Project Setup

**Task 1.1: Initialize Next.js Project**
```bash
npx create-next-app@latest seatify-next --typescript --tailwind --eslint --app --src-dir
```

Configuration choices:
- ✅ TypeScript
- ✅ ESLint
- ✅ App Router
- ✅ `src/` directory
- ❌ Tailwind (using custom CSS)
- ❌ Turbopack (stick with webpack for stability)

**Task 1.2: Copy Core Files**
```
src/
├── types/           → Copy as-is
├── utils/           → Copy as-is (add window guards)
├── data/            → Copy as-is
├── store/           → Copy + add hydration wrapper
└── styles/          → Copy to app/globals.css
```

**Task 1.3: Configure next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for shareable links
  output: 'standalone',

  // Optimize heavy dependencies
  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'jspdf',
      'xlsx',
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
```

**Task 1.4: Create Environment Files**
```bash
# .env.local
NEXT_PUBLIC_GA4_ID=G-52TRCMRJDL
NEXT_PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/xkongbre
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Day 2: Supabase Setup

**Task 2.1: Create Supabase Project**
- Create project at supabase.com
- Note: URL and anon key for .env.local
- Enable Email auth provider
- Enable Google OAuth (optional)

**Task 2.2: Run Database Schema**
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  display_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL DEFAULT 'other',
  date DATE,
  venue_name VARCHAR,
  venue_address VARCHAR,
  guest_capacity_limit INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tables
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  shape VARCHAR NOT NULL DEFAULT 'round',
  capacity INTEGER NOT NULL DEFAULT 8,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 120,
  height NUMERIC NOT NULL DEFAULT 120,
  rotation NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guests
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  company VARCHAR,
  job_title VARCHAR,
  group_name VARCHAR,
  rsvp_status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  seat_index INTEGER,
  canvas_x NUMERIC,
  canvas_y NUMERIC,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guest Relationships
CREATE TABLE public.guest_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  related_guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  relationship_type VARCHAR NOT NULL,
  strength INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(guest_id, related_guest_id)
);

-- Constraints
CREATE TABLE public.constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  constraint_type VARCHAR NOT NULL,
  priority VARCHAR NOT NULL DEFAULT 'preferred',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Constraint-Guest junction
CREATE TABLE public.constraint_guests (
  constraint_id UUID NOT NULL REFERENCES public.constraints(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  PRIMARY KEY (constraint_id, guest_id)
);

-- Venue Elements
CREATE TABLE public.venue_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  rotation NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guest Profile Data (arrays)
CREATE TABLE public.guest_profiles (
  guest_id UUID PRIMARY KEY REFERENCES public.guests(id) ON DELETE CASCADE,
  interests TEXT[],
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[]
);

-- Indexes
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_tables_event_id ON public.tables(event_id);
CREATE INDEX idx_guests_event_id ON public.guests(event_id);
CREATE INDEX idx_guests_table_id ON public.guests(table_id);
CREATE INDEX idx_guest_relationships_guest_id ON public.guest_relationships(guest_id);
CREATE INDEX idx_constraints_event_id ON public.constraints(event_id);
```

**Task 2.3: Enable Row Level Security**
```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraint_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events: Users can only access their own events
CREATE POLICY "Users can CRUD own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Tables: Access via event ownership
CREATE POLICY "Users can CRUD tables in own events" ON public.tables
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- Guests: Access via event ownership
CREATE POLICY "Users can CRUD guests in own events" ON public.guests
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- Relationships: Access via event ownership
CREATE POLICY "Users can CRUD relationships in own events" ON public.guest_relationships
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- Constraints: Access via event ownership
CREATE POLICY "Users can CRUD constraints in own events" ON public.constraints
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- Constraint guests: Access via constraint → event ownership
CREATE POLICY "Users can CRUD constraint_guests" ON public.constraint_guests
  FOR ALL USING (
    constraint_id IN (
      SELECT id FROM public.constraints
      WHERE event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
    )
  );

-- Venue elements: Access via event ownership
CREATE POLICY "Users can CRUD venue_elements in own events" ON public.venue_elements
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- Guest profiles: Access via guest → event ownership
CREATE POLICY "Users can CRUD guest_profiles" ON public.guest_profiles
  FOR ALL USING (
    guest_id IN (
      SELECT id FROM public.guests
      WHERE event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
    )
  );
```

**Task 2.4: Create Profile Trigger**
```sql
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Day 3: App Router Structure

**Task 3.1: Create Route Structure**
```
app/
├── layout.tsx                    # Root layout + providers
├── page.tsx                      # Landing page (SSR)
├── globals.css                   # Copied from src/index.css
│
├── (marketing)/                  # Route group for marketing pages
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── how-it-works/page.tsx
│   ├── wedding-seating/page.tsx
│   ├── corporate-events/page.tsx
│   ├── gala-seating/page.tsx
│   ├── team-offsite/page.tsx
│   └── private-party/page.tsx
│
├── (auth)/                       # Auth route group
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── callback/route.ts         # OAuth callback
│
├── dashboard/                    # Protected routes
│   ├── layout.tsx                # Auth check + header
│   ├── page.tsx                  # Event list
│   │
│   └── events/
│       └── [eventId]/
│           ├── layout.tsx        # Event context provider
│           ├── page.tsx          # Redirect to canvas
│           ├── canvas/page.tsx
│           ├── overview/page.tsx # Renamed from dashboard
│           └── guests/page.tsx
│
├── share/
│   └── [encodedData]/page.tsx    # Public shareable view
│
└── table/
    └── [encodedData]/page.tsx    # QR code table view
```

**Task 3.2: Create Root Layout**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'Seatify - Smart Seating Arrangements Made Easy',
  description: 'Create beautiful seating charts for weddings, corporate events, and parties.',
  openGraph: {
    title: 'Seatify',
    description: 'Smart Seating Arrangements Made Easy',
    images: ['/og-image.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Caveat:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers session={session}>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
```

**Task 3.3: Create Providers Wrapper**
```tsx
// app/providers.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/supabase-js'

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [supabase] = useState(() => createClientComponentClient())

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      {children}
    </SessionContextProvider>
  )
}
```

### Day 4-5: Core Component Migration

**Task 4.1: Create Hydration-Safe Store Wrapper**
```tsx
// src/store/useHydratedStore.ts
'use client'

import { useEffect, useState } from 'react'
import { useStore } from './useStore'

export function useHydratedStore() {
  const store = useStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  // Return empty/default state during SSR
  if (!hydrated) {
    return {
      ...store,
      events: [],
      event: null,
      isHydrated: false,
    }
  }

  return {
    ...store,
    isHydrated: true,
  }
}
```

**Task 4.2: Create Client Component Boundaries**

Components that need `'use client'` directive:
- Canvas.tsx (dnd-kit, window events)
- DashboardView.tsx (PDF generation, blob URLs)
- GuestManagementView.tsx (file imports)
- Header.tsx (theme toggle, dropdowns)
- Sidebar.tsx (filtering, store)
- All modal components
- OnboardingWizard.tsx
- GridControls.tsx

**Task 4.3: Update Router Hooks**
```tsx
// Migration mapping
// OLD: import { useNavigate, useParams, useLocation } from 'react-router-dom'
// NEW: import { useRouter, useParams, usePathname } from 'next/navigation'

// useNavigate() → useRouter().push()
// useLocation().pathname → usePathname()
// useParams() → useParams() (same API)
```

---

## Phase 2: Authentication & Data Layer (Days 6-10)

### Day 6-7: Auth Implementation

**Task 5.1: Create Auth Pages**
```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="auth-page">
      <h1>Sign In</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <button onClick={handleGoogleLogin} className="google-btn">
        Continue with Google
      </button>
      <p>
        Don't have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  )
}
```

**Task 5.2: Create Auth Callback Handler**
```tsx
// app/(auth)/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**Task 5.3: Create Protected Route Middleware**
```tsx
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
```

### Day 8-9: Data Sync Layer

**Task 6.1: Create Supabase Hooks**
```tsx
// src/hooks/useEvents.ts
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Event } from '@/types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEvents()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchEvents()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        tables (*),
        guests (*),
        constraints (*),
        venue_elements (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  async function createEvent(event: Partial<Event>) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function updateEvent(id: string, updates: Partial<Event>) {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  }
}
```

**Task 6.2: Create Full Event Sync**
```tsx
// src/hooks/useEventSync.ts
'use client'

import { useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useStore } from '@/store/useStore'
import type { Event, Table, Guest } from '@/types'

export function useEventSync(eventId: string) {
  const supabase = createClientComponentClient()
  const { setEvent, updateTable, updateGuest } = useStore()

  // Initial fetch
  useEffect(() => {
    if (!eventId) return

    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          tables (*),
          guests (*, guest_profiles (*)),
          constraints (*, constraint_guests (guest_id)),
          venue_elements (*),
          guest_relationships (*)
        `)
        .eq('id', eventId)
        .single()

      if (!error && data) {
        // Transform and set in Zustand
        setEvent(transformFromSupabase(data))
      }
    }

    fetchEvent()
  }, [eventId])

  // Realtime subscriptions
  useEffect(() => {
    if (!eventId) return

    const channel = supabase.channel(`event:${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `event_id=eq.${eventId}` },
        (payload) => handleTableChange(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        (payload) => handleGuestChange(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Save functions (called from store actions)
  const saveTable = useCallback(async (table: Table) => {
    const { error } = await supabase
      .from('tables')
      .upsert({
        id: table.id,
        event_id: eventId,
        name: table.name,
        shape: table.shape,
        capacity: table.capacity,
        x: table.x,
        y: table.y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
      })

    if (error) console.error('Failed to save table:', error)
  }, [eventId])

  const saveGuest = useCallback(async (guest: Guest) => {
    const { error } = await supabase
      .from('guests')
      .upsert({
        id: guest.id,
        event_id: eventId,
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        table_id: guest.tableId,
        seat_index: guest.seatIndex,
        group_name: guest.group,
        rsvp_status: guest.rsvpStatus,
        notes: guest.notes,
      })

    if (error) console.error('Failed to save guest:', error)
  }, [eventId])

  return { saveTable, saveGuest }
}
```

### Day 10: Dashboard Page

**Task 7.1: Create Event List Page**
```tsx
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { EventList } from '@/components/EventList'

export const metadata = {
  title: 'My Events - Seatify',
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_type, date, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>My Events</h1>
        <CreateEventButton />
      </header>
      <EventList initialEvents={events || []} />
    </div>
  )
}
```

---

## Phase 3: Core Features (Days 11-15)

### Day 11-12: Canvas Migration

**Task 8.1: Migrate Canvas Component**
```tsx
// app/dashboard/events/[eventId]/canvas/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CanvasClient } from './canvas-client'

export default async function CanvasPage({
  params,
}: {
  params: { eventId: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      tables (*),
      guests (*),
      venue_elements (*)
    `)
    .eq('id', params.eventId)
    .single()

  if (!event) {
    return <div>Event not found</div>
  }

  return <CanvasClient initialEvent={event} />
}
```

```tsx
// app/dashboard/events/[eventId]/canvas/canvas-client.tsx
'use client'

import { useEventSync } from '@/hooks/useEventSync'
import { Canvas } from '@/components/Canvas'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export function CanvasClient({ initialEvent }) {
  const { saveTable, saveGuest } = useEventSync(initialEvent.id)

  return (
    <div className="canvas-layout">
      <Header />
      <div className="canvas-content">
        <Canvas
          initialEvent={initialEvent}
          onTableUpdate={saveTable}
          onGuestUpdate={saveGuest}
        />
        <Sidebar />
      </div>
    </div>
  )
}
```

### Day 13-14: Guest Management & Overview

**Task 9.1: Migrate Guest Management View**
- Port GuestManagementView with `'use client'`
- Connect import wizard to Supabase batch insert
- Add relationship sync to guest_relationships table

**Task 9.2: Migrate Overview/Dashboard View**
- Port DashboardView (renamed to Overview)
- PDF export works as-is (client-side)
- Share link generation needs update for new URL structure

### Day 15: Shareable Views

**Task 10.1: Create Public Share Page**
```tsx
// app/share/[encodedData]/page.tsx
import { ShareableView } from '@/components/ShareableView'
import { decodeEventData } from '@/utils/encoding'

export async function generateMetadata({
  params,
}: {
  params: { encodedData: string }
}) {
  const event = decodeEventData(params.encodedData)

  return {
    title: `${event?.name || 'Event'} Seating Chart - Seatify`,
    description: `View the seating arrangement for ${event?.name}`,
    openGraph: {
      title: `${event?.name} Seating Chart`,
      description: 'View your table assignment',
      images: ['/og-share.png'], // TODO: Generate dynamic OG image
    },
  }
}

export default function SharePage({
  params,
}: {
  params: { encodedData: string }
}) {
  const event = decodeEventData(params.encodedData)

  if (!event) {
    return <div>Invalid or expired link</div>
  }

  return <ShareableView event={event} />
}
```

---

## Phase 4: Analytics & Polish (Days 16-20)

### Day 16-17: Analytics Integration

**Task 11.1: Set Up PostHog**
```tsx
// app/providers.tsx (add PostHog)
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // We'll capture manually
  })
}

export function Providers({ children, session }) {
  return (
    <PostHogProvider client={posthog}>
      <SessionContextProvider ...>
        {children}
      </SessionContextProvider>
    </PostHogProvider>
  )
}
```

**Task 11.2: Create Analytics Hooks**
```tsx
// src/hooks/useAnalytics.ts
'use client'

import { usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function usePageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + '?' + searchParams.toString()
      }
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, posthog])
}

export function useTrackEvent() {
  const posthog = usePostHog()

  return (event: string, properties?: Record<string, any>) => {
    posthog.capture(event, properties)
  }
}
```

**Task 11.3: Define Funnel Events**
```tsx
// Funnel tracking events
const FUNNEL_EVENTS = {
  // Acquisition
  LANDING_PAGE_VIEW: 'landing_page_view',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',

  // Activation
  FIRST_EVENT_CREATED: 'first_event_created',
  FIRST_TABLE_ADDED: 'first_table_added',
  FIRST_GUEST_ADDED: 'first_guest_added',
  FIRST_SEAT_ASSIGNED: 'first_seat_assigned',

  // Engagement
  EVENT_COMPLETED: 'event_completed', // All guests assigned
  EVENT_SHARED: 'event_shared',
  EVENT_EXPORTED: 'event_exported',
  OPTIMIZER_USED: 'optimizer_used',

  // Retention
  RETURN_VISIT: 'return_visit',
  SECOND_EVENT_CREATED: 'second_event_created',
}
```

### Day 18-19: Testing & Fixes

**Task 12.1: Update Playwright Config**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000', // Updated for Next.js
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  // ... rest of config
})
```

**Task 12.2: Update Test Helpers**
```typescript
// e2e/helpers.ts
export async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'testpassword123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

export async function enterApp(page: Page) {
  await loginAsTestUser(page)
  // Create or select test event
}
```

### Day 20: Deployment

**Task 13.1: Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_POSTHOG_KEY
vercel env add NEXT_PUBLIC_GA4_ID

# Deploy
vercel --prod
```

**Task 13.2: Configure Domain**
- Add custom domain in Vercel dashboard
- Update Supabase auth redirect URLs
- Update OAuth callback URLs (Google)

---

## Migration Checklist

### Pre-Migration
- [ ] Create Supabase project
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Backup current localStorage data migration script

### Phase 1: Foundation
- [ ] Initialize Next.js project
- [ ] Copy types, utils, styles
- [ ] Create database schema
- [ ] Enable RLS policies
- [ ] Set up root layout and providers

### Phase 2: Auth & Data
- [ ] Implement login/signup pages
- [ ] Create auth middleware
- [ ] Build Supabase hooks
- [ ] Create event sync layer

### Phase 3: Core Features
- [ ] Migrate Canvas component
- [ ] Migrate Guest Management
- [ ] Migrate Overview/Dashboard
- [ ] Create shareable views
- [ ] Migrate all modal components

### Phase 4: Polish
- [ ] Integrate PostHog analytics
- [ ] Update Playwright tests
- [ ] Performance optimization
- [ ] Deploy to production

### Post-Migration
- [ ] Re-enable Google Ads with new URLs
- [ ] Monitor error rates
- [ ] Track funnel metrics
- [ ] Gather user feedback

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| localStorage data loss | Create migration script to import existing data |
| Auth flow issues | Test OAuth locally with ngrok tunnel |
| Hydration mismatches | Use `suppressHydrationWarning` + `useHydratedStore` |
| Canvas performance | Keep canvas as pure client component |
| Test failures | Update selectors incrementally |
| Downtime during migration | Deploy to new domain first, then switch |

---

## Success Criteria

**Week 1 Complete When:**
- [ ] Users can sign up and log in
- [ ] Events persist to Supabase
- [ ] Basic canvas functionality works
- [ ] Deployed to Vercel

**Week 2 Complete When:**
- [ ] Full feature parity with current app
- [ ] All E2E tests passing
- [ ] Analytics tracking funnel events
- [ ] Shareable links working with OG previews

**Week 3 Complete When:**
- [ ] Performance matches or exceeds current app
- [ ] Google Ads pointing to new domain
- [ ] Monitoring dashboards set up
- [ ] Documentation updated
