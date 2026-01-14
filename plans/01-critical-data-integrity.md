# Phase 1: Critical Data Integrity

**Priority:** 🔴 Critical
**Estimated Effort:** 1-2 days
**Status:** ✅ Complete

## Overview

This phase addresses critical data persistence issues that cause users to lose their work. Currently, constraints and venue elements only exist in local state and are lost on page reload.

---

## Task 1.1: Fix Constraint Guest IDs Loading

### Problem
In `src/actions/loadEvent.ts:184`, the `guestIds` array is hardcoded to `[]`:
```typescript
constraints: Constraint[] = (dbConstraints || []).map(c => ({
  id: c.id,
  type: c.constraint_type,
  priority: c.priority,
  guestIds: [], // ❌ HARDCODED EMPTY ARRAY
}));
```

The `constraint_guests` junction table is never queried, so constraints load without knowing which guests they apply to.

### Solution

#### Step 1: Add constraint_guests query to loadEvent.ts

**File:** `src/actions/loadEvent.ts`

After loading constraints (around line 160), add:

```typescript
// Load constraint guest mappings
const constraintIds = dbConstraints?.map(c => c.id) || [];
let constraintGuestMappings: { constraint_id: string; guest_id: string }[] = [];

if (constraintIds.length > 0) {
  const { data: cgData } = await supabase
    .from('constraint_guests')
    .select('constraint_id, guest_id')
    .in('constraint_id', constraintIds);

  constraintGuestMappings = cgData || [];
}
```

#### Step 2: Map guest IDs to constraints

Update the constraint mapping (around line 184):

```typescript
// Create a lookup map for constraint guest IDs
const constraintGuestMap = new Map<string, string[]>();
for (const cg of constraintGuestMappings) {
  const existing = constraintGuestMap.get(cg.constraint_id) || [];
  existing.push(cg.guest_id);
  constraintGuestMap.set(cg.constraint_id, existing);
}

// Map constraints with their guest IDs
const constraints: Constraint[] = (dbConstraints || []).map(c => ({
  id: c.id,
  type: c.constraint_type as Constraint['type'],
  priority: c.priority as Constraint['priority'],
  guestIds: constraintGuestMap.get(c.id) || [],
  description: c.description || undefined,
}));
```

### Verification
```bash
# After fix, constraints should load with their guestIds populated
# Check browser console or add temporary logging:
console.log('Loaded constraints:', constraints);
```

### Acceptance Criteria
- [x] Constraints load with correct `guestIds` array
- [x] Junction table `constraint_guests` is queried
- [x] Empty constraints (no guests) still work
- [x] Build passes with no type errors

---

## Task 1.2: Fix Bidirectional Relationship Loading

### Problem
In `src/actions/loadEvent.ts:114-124`, relationships are only loaded from the `guest_id` perspective:

```typescript
// Current code only gets relationships where guest is the source
const guestRelationships = dbRelationships?.filter(r => r.guest_id === dbGuest.id) || [];
```

If Guest A has a relationship to Guest B, Guest B doesn't see the reverse relationship.

### Solution

#### Step 1: Also include reverse relationships

**File:** `src/actions/loadEvent.ts`

Update the relationship mapping (around line 114):

```typescript
// Get relationships where this guest is either the source OR target
const guestRelationships = dbRelationships?.filter(
  r => r.guest_id === dbGuest.id || r.related_guest_id === dbGuest.id
) || [];

// Map relationships, handling both directions
const relationships: Relationship[] = guestRelationships.map(r => {
  // If this guest is the source, use related_guest_id as the target
  // If this guest is the target, use guest_id as the source (reverse direction)
  const isSource = r.guest_id === dbGuest.id;
  return {
    guestId: isSource ? r.related_guest_id : r.guest_id,
    type: r.relationship_type as Relationship['type'],
    strength: r.strength,
  };
});
```

#### Step 2: Deduplicate relationships

Add deduplication to prevent showing the same relationship twice:

```typescript
// Deduplicate relationships (same guest pair might appear twice if stored bidirectionally)
const uniqueRelationships = relationships.filter((rel, index, self) =>
  index === self.findIndex(r => r.guestId === rel.guestId)
);
```

### Verification
- Create two guests A and B
- Add a "partner" relationship from A to B
- Verify B also shows A as a partner

### Acceptance Criteria
- [ ] Relationships visible from both guest perspectives
- [ ] No duplicate relationships shown
- [ ] Relationship type and strength preserved
- [ ] Existing relationship data still works

---

## Task 1.3: Create Constraints Server Actions

### Problem
No server actions exist for constraint CRUD operations. Changes only persist in local Zustand store.

### Solution

#### Step 1: Create the server actions file

**File:** `src/actions/constraints.ts` (NEW FILE)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ConstraintInput {
  type: 'must_sit_together' | 'must_not_sit_together' | 'near_front' | 'accessibility';
  priority: 'required' | 'preferred' | 'optional';
  guestIds: string[];
  description?: string;
}

export async function insertConstraint(eventId: string, constraint: ConstraintInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  // Insert the constraint
  const { data: newConstraint, error: constraintError } = await supabase
    .from('constraints')
    .insert({
      event_id: eventId,
      constraint_type: constraint.type,
      priority: constraint.priority,
      description: constraint.description,
    })
    .select()
    .single();

  if (constraintError || !newConstraint) {
    return { error: constraintError?.message || 'Failed to create constraint' };
  }

  // Insert constraint-guest mappings
  if (constraint.guestIds.length > 0) {
    const mappings = constraint.guestIds.map(guestId => ({
      constraint_id: newConstraint.id,
      guest_id: guestId,
    }));

    const { error: mappingError } = await supabase
      .from('constraint_guests')
      .insert(mappings);

    if (mappingError) {
      // Rollback: delete the constraint if mapping failed
      await supabase.from('constraints').delete().eq('id', newConstraint.id);
      return { error: mappingError.message };
    }
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { id: newConstraint.id } };
}

export async function updateConstraint(
  constraintId: string,
  eventId: string,
  updates: Partial<ConstraintInput>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns the event that owns this constraint
  const { data: constraint } = await supabase
    .from('constraints')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', constraintId)
    .single();

  if (!constraint || (constraint as any).events?.user_id !== user.id) {
    return { error: 'Constraint not found or access denied' };
  }

  // Update constraint properties
  const constraintUpdates: Record<string, unknown> = {};
  if (updates.type) constraintUpdates.constraint_type = updates.type;
  if (updates.priority) constraintUpdates.priority = updates.priority;
  if (updates.description !== undefined) constraintUpdates.description = updates.description;

  if (Object.keys(constraintUpdates).length > 0) {
    const { error } = await supabase
      .from('constraints')
      .update(constraintUpdates)
      .eq('id', constraintId);

    if (error) {
      return { error: error.message };
    }
  }

  // Update guest mappings if provided
  if (updates.guestIds) {
    // Delete existing mappings
    await supabase
      .from('constraint_guests')
      .delete()
      .eq('constraint_id', constraintId);

    // Insert new mappings
    if (updates.guestIds.length > 0) {
      const mappings = updates.guestIds.map(guestId => ({
        constraint_id: constraintId,
        guest_id: guestId,
      }));

      const { error: mappingError } = await supabase
        .from('constraint_guests')
        .insert(mappings);

      if (mappingError) {
        return { error: mappingError.message };
      }
    }
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}

export async function deleteConstraint(constraintId: string, eventId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership through event
  const { data: constraint } = await supabase
    .from('constraints')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', constraintId)
    .single();

  if (!constraint || (constraint as any).events?.user_id !== user.id) {
    return { error: 'Constraint not found or access denied' };
  }

  // Delete constraint (cascade will handle constraint_guests)
  const { error } = await supabase
    .from('constraints')
    .delete()
    .eq('id', constraintId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}
```

#### Step 2: Add sync hook for constraints

**File:** `src/hooks/useSyncToSupabase.ts`

Add constraint sync functions to the existing hook:

```typescript
import { insertConstraint, updateConstraint, deleteConstraint } from '@/actions/constraints';

// In the hook, add:
const syncConstraint = useCallback(async (
  action: 'add' | 'update' | 'delete',
  constraintId: string,
  data?: ConstraintInput
) => {
  if (!eventId) return;

  switch (action) {
    case 'add':
      if (data) await insertConstraint(eventId, data);
      break;
    case 'update':
      if (data) await updateConstraint(constraintId, eventId, data);
      break;
    case 'delete':
      await deleteConstraint(constraintId, eventId);
      break;
  }
}, [eventId]);
```

### Verification
1. Create a constraint in the UI
2. Refresh the page
3. Constraint should still be there

### Acceptance Criteria
- [ ] `insertConstraint` creates constraint and guest mappings
- [ ] `updateConstraint` updates constraint and remaps guests
- [ ] `deleteConstraint` removes constraint (cascade handles mappings)
- [ ] All actions verify user owns the event
- [ ] Path revalidation triggers after changes

---

## Task 1.4: Create Venue Elements Server Actions

### Problem
Venue elements (stages, bars, dance floors) only persist locally.

### Solution

#### Step 1: Create the server actions file

**File:** `src/actions/venueElements.ts` (NEW FILE)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface VenueElementInput {
  type: 'stage' | 'bar' | 'danceFloor' | 'buffet' | 'entrance' | 'dj' | 'photoArea' | 'giftTable' | 'other';
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export async function insertVenueElement(eventId: string, element: VenueElementInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found or access denied' };
  }

  const { data, error } = await supabase
    .from('venue_elements')
    .insert({
      event_id: eventId,
      element_type: element.type,
      label: element.label,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { id: data.id } };
}

export async function updateVenueElement(
  elementId: string,
  eventId: string,
  updates: Partial<VenueElementInput>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership
  const { data: element } = await supabase
    .from('venue_elements')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', elementId)
    .single();

  if (!element || (element as any).events?.user_id !== user.id) {
    return { error: 'Element not found or access denied' };
  }

  const dbUpdates: Record<string, unknown> = {};
  if (updates.type) dbUpdates.element_type = updates.type;
  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.x !== undefined) dbUpdates.x = updates.x;
  if (updates.y !== undefined) dbUpdates.y = updates.y;
  if (updates.width !== undefined) dbUpdates.width = updates.width;
  if (updates.height !== undefined) dbUpdates.height = updates.height;
  if (updates.rotation !== undefined) dbUpdates.rotation = updates.rotation;

  const { error } = await supabase
    .from('venue_elements')
    .update(dbUpdates)
    .eq('id', elementId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}

export async function deleteVenueElement(elementId: string, eventId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership
  const { data: element } = await supabase
    .from('venue_elements')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', elementId)
    .single();

  if (!element || (element as any).events?.user_id !== user.id) {
    return { error: 'Element not found or access denied' };
  }

  const { error } = await supabase
    .from('venue_elements')
    .delete()
    .eq('id', elementId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}
```

### Acceptance Criteria
- [ ] Venue elements persist to database
- [ ] Position, size, rotation all saved
- [ ] Elements survive page refresh
- [ ] Proper auth checks on all operations

---

## Task 1.5: Add Survey Database Tables

### Problem
Survey system has UI but no database tables to store questions/responses.

### Solution

#### Step 1: Add tables to schema

**File:** `supabase/schema.sql`

Add after the existing tables:

```sql
-- Survey questions for events
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text', -- text, multiple_choice, rating, etc.
  options JSONB, -- For multiple choice questions
  required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses from guests
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  response_text TEXT,
  response_data JSONB, -- For structured responses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, guest_id) -- One response per guest per question
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_questions_event_id ON public.survey_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_id ON public.survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_guest_id ON public.survey_responses(guest_id);

-- RLS Policies for survey_questions
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view survey questions for their events"
  ON public.survey_questions FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create survey questions for their events"
  ON public.survey_questions FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update survey questions for their events"
  ON public.survey_questions FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete survey questions for their events"
  ON public.survey_questions FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for survey_responses
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses for their events"
  ON public.survey_responses FOR SELECT
  USING (
    question_id IN (
      SELECT sq.id FROM public.survey_questions sq
      JOIN public.events e ON sq.event_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true); -- Guests submit without auth

CREATE POLICY "Users can update responses for their events"
  ON public.survey_responses FOR UPDATE
  USING (
    question_id IN (
      SELECT sq.id FROM public.survey_questions sq
      JOIN public.events e ON sq.event_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete responses for their events"
  ON public.survey_responses FOR DELETE
  USING (
    question_id IN (
      SELECT sq.id FROM public.survey_questions sq
      JOIN public.events e ON sq.event_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );
```

#### Step 2: Run migration on Supabase

```bash
# Run in Supabase SQL editor or via CLI
supabase db push
```

### Acceptance Criteria
- [ ] `survey_questions` table created
- [ ] `survey_responses` table created
- [ ] RLS policies allow event owners to manage questions
- [ ] Guests can submit responses without auth
- [ ] Cascade delete removes questions when event deleted

---

## Completion Checklist

- [ ] Task 1.1: Constraint guest IDs loading correctly
- [ ] Task 1.2: Bidirectional relationships working
- [ ] Task 1.3: Constraints server actions created and tested
- [ ] Task 1.4: Venue elements server actions created and tested
- [ ] Task 1.5: Survey tables added to database
- [ ] All changes committed with descriptive messages
- [ ] PR created and CI passes
- [ ] Manually tested in browser

## Next Phase

Once this phase is complete, proceed to [Phase 2: Test Coverage](./02-test-coverage.md).
