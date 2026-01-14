# Phase 4: Feature Completion

**Priority:** 🟡 Medium
**Estimated Effort:** 3-5 days
**Status:** Not Started

## Overview

This phase completes partially implemented features, including spatial constraints, the survey system, and store improvements. These are not blocking issues but are needed for a polished product.

---

## Task 4.1: Implement `near_front` Constraint

### Problem
The `near_front` constraint type exists in the type system but has no implementation. Currently ignored with a comment: "Note: 'near_front' and 'accessibility' constraints would need spatial logic"

### Solution

The `near_front` constraint should place guests at tables closest to a reference point (usually the head table or stage).

#### Step 1: Define "front" reference point

Add to the Event type or use venue elements:

```typescript
// Option 1: Add to Event
interface Event {
  // ... existing fields
  frontPosition?: { x: number; y: number }; // Reference point for "front"
}

// Option 2: Use venue element (stage) as reference
// Find stage element and use its position
```

#### Step 2: Add spatial scoring to optimizeSeating

**File:** `src/store/useStore.ts`

In the `optimizeSeating` function, add spatial constraint handling:

```typescript
// Calculate distance from "front" for each table
const calculateDistanceFromFront = (table: Table, frontPos: { x: number; y: number }) => {
  const tableCenterX = table.x + table.width / 2;
  const tableCenterY = table.y + table.height / 2;
  return Math.sqrt(
    Math.pow(tableCenterX - frontPos.x, 2) +
    Math.pow(tableCenterY - frontPos.y, 2)
  );
};

// Sort tables by distance from front
const getSortedTablesByFrontDistance = (tables: Table[], frontPos: { x: number; y: number }) => {
  return [...tables].sort((a, b) =>
    calculateDistanceFromFront(a, frontPos) - calculateDistanceFromFront(b, frontPos)
  );
};

// When processing near_front constraints:
const nearFrontConstraints = constraints.filter(c => c.type === 'near_front');
for (const constraint of nearFrontConstraints) {
  const frontTables = getSortedTablesByFrontDistance(tables, frontPosition);
  const guestsToSeatNearFront = constraint.guestIds
    .filter(id => confirmedGuestIds.includes(id));

  // Prioritize these guests for front tables
  for (const guestId of guestsToSeatNearFront) {
    for (const table of frontTables) {
      const currentSeated = guestAssignments.get(table.id)?.length || 0;
      if (currentSeated < table.capacity) {
        // Assign to this front table
        assignGuestToTable(guestId, table.id);
        break;
      }
    }
  }
}
```

#### Step 3: Add UI for setting front reference

In the canvas view, allow users to:
1. Auto-detect from stage venue element
2. Click to set "front" position
3. Show visual indicator of front direction

### Acceptance Criteria
- [ ] near_front constraint places guests at tables closer to front
- [ ] Front position can be set (auto or manual)
- [ ] Visual indicator shows front area
- [ ] Tests cover near_front constraint behavior

---

## Task 4.2: Implement `accessibility` Constraint

### Problem
The `accessibility` constraint type exists but has no implementation. Should ensure guests with accessibility needs are seated at accessible tables.

### Solution

#### Step 1: Add accessibility flag to tables

**File:** `src/types/index.ts`

```typescript
interface Table {
  // ... existing fields
  isAccessible?: boolean; // Near entrance, wheelchair accessible, etc.
}
```

#### Step 2: Update database schema

**File:** `supabase/schema.sql`

```sql
ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT false;
```

#### Step 3: Add accessibility handling to optimization

**File:** `src/store/useStore.ts`

```typescript
// Get accessible tables
const accessibleTables = tables.filter(t => t.isAccessible);

// Process accessibility constraints
const accessibilityConstraints = constraints.filter(c => c.type === 'accessibility');
for (const constraint of accessibilityConstraints) {
  const guestsNeedingAccessibility = constraint.guestIds
    .filter(id => confirmedGuestIds.includes(id));

  // Prioritize accessible tables for these guests
  for (const guestId of guestsNeedingAccessibility) {
    // Try accessible tables first
    for (const table of accessibleTables) {
      const currentSeated = guestAssignments.get(table.id)?.length || 0;
      if (currentSeated < table.capacity) {
        assignGuestToTable(guestId, table.id);
        break;
      }
    }

    // If no accessible tables available, use any table
    // but flag as a warning
  }
}
```

#### Step 4: Add UI to mark tables as accessible

In the table properties panel, add a checkbox for "Wheelchair Accessible" or similar.

### Acceptance Criteria
- [ ] Tables can be marked as accessible
- [ ] accessibility constraint prioritizes accessible tables
- [ ] Warning shown if no accessible tables available
- [ ] Tests cover accessibility constraint behavior

---

## Task 4.3: Add updateConstraint Store Method

### Problem
Cannot edit constraints after creation - only add/remove. Users must delete and recreate to make changes.

### Solution

**File:** `src/store/useStore.ts`

Add the missing method to the store:

```typescript
// In the store interface (around line 213)
interface StoreState {
  // ... existing
  addConstraint: (constraint: Omit<Constraint, 'id'>) => void;
  removeConstraint: (constraintId: string) => void;
  updateConstraint: (constraintId: string, updates: Partial<Constraint>) => void; // ADD THIS
}

// In the store implementation
updateConstraint: (constraintId: string, updates: Partial<Constraint>) => {
  set((state) => {
    const event = state.events.find(e => e.id === state.currentEventId);
    if (!event) return state;

    return {
      ...state,
      events: state.events.map(e =>
        e.id === state.currentEventId
          ? {
              ...e,
              constraints: e.constraints.map(c =>
                c.id === constraintId
                  ? { ...c, ...updates }
                  : c
              ),
            }
          : e
      ),
    };
  });
},
```

### Acceptance Criteria
- [ ] updateConstraint method added to store
- [ ] Can modify constraint type, priority, guestIds
- [ ] Changes persist correctly
- [ ] UI allows editing existing constraints

---

## Task 4.4: Create Survey Server Actions

### Problem
Survey UI exists but no server actions to persist questions/responses.

### Solution

**File:** `src/actions/surveys.ts` (NEW FILE)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface SurveyQuestionInput {
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  required?: boolean;
  orderIndex?: number;
}

export async function insertSurveyQuestion(eventId: string, question: SurveyQuestionInput) {
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
    .from('survey_questions')
    .insert({
      event_id: eventId,
      question_text: question.questionText,
      question_type: question.questionType,
      options: question.options ? JSON.stringify(question.options) : null,
      required: question.required || false,
      order_index: question.orderIndex || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { id: data.id } };
}

export async function updateSurveyQuestion(
  questionId: string,
  eventId: string,
  updates: Partial<SurveyQuestionInput>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership through event
  const { data: question } = await supabase
    .from('survey_questions')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', questionId)
    .single();

  if (!question || (question as any).events?.user_id !== user.id) {
    return { error: 'Question not found or access denied' };
  }

  const dbUpdates: Record<string, unknown> = {};
  if (updates.questionText) dbUpdates.question_text = updates.questionText;
  if (updates.questionType) dbUpdates.question_type = updates.questionType;
  if (updates.options !== undefined) dbUpdates.options = JSON.stringify(updates.options);
  if (updates.required !== undefined) dbUpdates.required = updates.required;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

  const { error } = await supabase
    .from('survey_questions')
    .update(dbUpdates)
    .eq('id', questionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}

export async function deleteSurveyQuestion(questionId: string, eventId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership
  const { data: question } = await supabase
    .from('survey_questions')
    .select('id, event_id, events!inner(user_id)')
    .eq('id', questionId)
    .single();

  if (!question || (question as any).events?.user_id !== user.id) {
    return { error: 'Question not found or access denied' };
  }

  const { error } = await supabase
    .from('survey_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}/canvas`);
  return { data: { success: true } };
}

// Survey response submission (no auth required - guests submit)
export async function submitSurveyResponse(
  questionId: string,
  guestId: string,
  response: string | object
) {
  const supabase = await createClient();

  const responseData = typeof response === 'string'
    ? { response_text: response }
    : { response_data: response };

  const { error } = await supabase
    .from('survey_responses')
    .upsert({
      question_id: questionId,
      guest_id: guestId,
      ...responseData,
    }, {
      onConflict: 'question_id,guest_id'
    });

  if (error) {
    return { error: error.message };
  }

  return { data: { success: true } };
}

export async function getSurveyResponses(eventId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get all responses for questions in this event
  const { data, error } = await supabase
    .from('survey_responses')
    .select(`
      id,
      response_text,
      response_data,
      guest_id,
      question_id,
      survey_questions!inner(event_id)
    `)
    .eq('survey_questions.event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  return { data };
}
```

### Acceptance Criteria
- [ ] Survey questions can be created/updated/deleted
- [ ] Responses can be submitted by guests
- [ ] Event owners can view all responses
- [ ] Data persists across page refreshes

---

## Task 4.5: Load Survey Data in loadEvent

### Problem
Survey questions and responses are not loaded with event data.

### Solution

**File:** `src/actions/loadEvent.ts`

Add survey loading after other queries:

```typescript
// Load survey questions
const { data: dbSurveyQuestions } = await supabase
  .from('survey_questions')
  .select('*')
  .eq('event_id', eventId)
  .order('order_index');

// Load survey responses
const { data: dbSurveyResponses } = await supabase
  .from('survey_responses')
  .select(`
    id,
    question_id,
    guest_id,
    response_text,
    response_data
  `)
  .in('question_id', (dbSurveyQuestions || []).map(q => q.id));

// Transform and include in event
const surveyQuestions: SurveyQuestion[] = (dbSurveyQuestions || []).map(q => ({
  id: q.id,
  text: q.question_text,
  type: q.question_type,
  options: q.options ? JSON.parse(q.options) : undefined,
  required: q.required,
  orderIndex: q.order_index,
}));

const surveyResponses: SurveyResponse[] = (dbSurveyResponses || []).map(r => ({
  id: r.id,
  questionId: r.question_id,
  guestId: r.guest_id,
  text: r.response_text,
  data: r.response_data,
}));
```

### Acceptance Criteria
- [ ] Survey questions loaded with event
- [ ] Survey responses loaded with event
- [ ] Empty arrays if no survey data
- [ ] Type transformations correct

---

## Task 4.6: Generate Supabase Types

### Problem
Manual TypeScript types for database tables may drift from actual schema.

### Solution

#### Step 1: Install Supabase CLI (if not installed)

```bash
npm install -D supabase
```

#### Step 2: Generate types

```bash
npx supabase gen types typescript --project-id iwiliutxiliacdqyestd > src/types/database.ts
```

#### Step 3: Use generated types

**File:** `src/actions/loadEvent.ts`

```typescript
import type { Database } from '@/types/database';

type DbEvent = Database['public']['Tables']['events']['Row'];
type DbGuest = Database['public']['Tables']['guests']['Row'];
// etc.
```

### Acceptance Criteria
- [ ] Supabase types generated
- [ ] Types match actual schema
- [ ] Server actions use generated types
- [ ] IDE autocompletion works

---

## Task 4.7: Add Real-time Subscriptions (Optional)

### Problem
No real-time sync between browser sessions. Changes in one tab don't appear in another.

### Solution

This is optional but would improve multi-user/multi-tab experience.

**File:** `src/hooks/useRealtimeSync.ts` (NEW FILE)

```typescript
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

export function useRealtimeSync(eventId: string | null) {
  useEffect(() => {
    if (!eventId) return;

    const supabase = createClient();

    // Subscribe to guest changes
    const guestSubscription = supabase
      .channel(`guests:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Handle guest changes
          console.log('Guest change:', payload);
          // Trigger refresh or update store
        }
      )
      .subscribe();

    // Subscribe to table changes
    const tableSubscription = supabase
      .channel(`tables:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Table change:', payload);
        }
      )
      .subscribe();

    return () => {
      guestSubscription.unsubscribe();
      tableSubscription.unsubscribe();
    };
  }, [eventId]);
}
```

### Acceptance Criteria
- [ ] Changes sync across browser tabs
- [ ] Subscriptions clean up on unmount
- [ ] Doesn't cause duplicate updates
- [ ] Graceful handling of connection issues

---

## Summary Table

| Task | Type | Effort | Priority |
|------|------|--------|----------|
| 4.1 | Feature | 4-6 hours | Medium |
| 4.2 | Feature | 4-6 hours | Medium |
| 4.3 | Bug Fix | 1 hour | High |
| 4.4 | Feature | 2-3 hours | Medium |
| 4.5 | Feature | 1-2 hours | Medium |
| 4.6 | Infrastructure | 1 hour | Low |
| 4.7 | Feature | 3-4 hours | Low (Optional) |

---

## Completion Checklist

- [ ] Task 4.1: near_front constraint implemented
- [ ] Task 4.2: accessibility constraint implemented
- [ ] Task 4.3: updateConstraint method added
- [ ] Task 4.4: Survey server actions created
- [ ] Task 4.5: Survey data loaded in loadEvent
- [ ] Task 4.6: Supabase types generated
- [ ] Task 4.7: Real-time sync (optional)
- [ ] All new features have tests
- [ ] Documentation updated

---

## Post-Completion

After all phases are complete:

1. **Full regression test** - Test all user flows manually
2. **Performance audit** - Check Lighthouse scores
3. **Security review** - Verify RLS policies work correctly
4. **Load testing** - Test with realistic data volumes
5. **User acceptance testing** - Get feedback from potential users

The app should now be ready to show to potential users!
