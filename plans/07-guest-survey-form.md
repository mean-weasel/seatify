# Plan: Guest-Facing Survey Form

## Overview
Create a public-facing survey page where guests can submit their preferences, dietary restrictions, and relationship information. Accessible via unique link without requiring the full app interface.

## Priority
**Medium Effort** - Critical for real event use. Enables actual data collection from guests.

## Implementation Steps

### Step 1: Hash-Based Routing
Add simple hash routing to `App.tsx` to show survey form at `#/survey`:

```tsx
function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.startsWith('#/survey')) {
    return <GuestSurveyPage />;
  }

  return <MainApp />;
}
```

### Step 2: Create GuestSurveyPage Component
New component `src/components/GuestSurveyPage.tsx`:

```tsx
function GuestSurveyPage() {
  const [step, setStep] = useState<'identify' | 'questions' | 'complete'>('identify');
  const [guest, setGuest] = useState<Guest | null>(null);

  return (
    <div className="survey-page">
      <header className="survey-header">
        <h1>{eventName}</h1>
        <p>Help us create the perfect seating arrangement</p>
      </header>

      {step === 'identify' && <GuestIdentification onFound={setGuest} />}
      {step === 'questions' && <SurveyQuestions guest={guest} onComplete={() => setStep('complete')} />}
      {step === 'complete' && <ThankYouMessage />}
    </div>
  );
}
```

### Step 3: Guest Identification Step
Allow guests to find themselves by email:

```tsx
function GuestIdentification({ onFound }) {
  const [email, setEmail] = useState('');
  const guests = useStore(s => s.guests);

  const handleSubmit = () => {
    const guest = guests.find(g => g.email.toLowerCase() === email.toLowerCase());
    if (guest) {
      onFound(guest);
    } else {
      setError('Email not found. Please contact the host.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Enter your email address</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">Continue</button>
    </form>
  );
}
```

### Step 4: Dynamic Question Rendering
Render questions based on their type:

```tsx
function QuestionRenderer({ question, value, onChange }) {
  switch (question.type) {
    case 'single_select':
      return (
        <div className="question-single">
          {question.options.map(opt => (
            <label key={opt}>
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'multiselect':
      return (
        <div className="question-multi">
          {question.options.map(opt => (
            <label key={opt}>
              <input
                type="checkbox"
                checked={value?.includes(opt)}
                onChange={() => toggleOption(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'text':
      return <textarea value={value} onChange={e => onChange(e.target.value)} />;

    case 'relationship':
      return <GuestRelationshipPicker value={value} onChange={onChange} />;
  }
}
```

### Step 5: Relationship Question Type
Special component for "Who do you know?" question:

```tsx
function GuestRelationshipPicker({ currentGuest, value, onChange }) {
  const guests = useStore(s => s.guests.filter(g => g.id !== currentGuest.id));

  return (
    <div className="relationship-picker">
      <p>Select people you know and how well:</p>
      {guests.map(guest => (
        <div key={guest.id} className="relationship-row">
          <span>{guest.name}</span>
          <select
            value={value[guest.id] || ''}
            onChange={e => onChange({ ...value, [guest.id]: e.target.value })}
          >
            <option value="">Don't know</option>
            <option value="acquaintance">Acquaintance</option>
            <option value="friend">Friend</option>
            <option value="close_friend">Close Friend</option>
            <option value="family">Family</option>
            <option value="avoid">Prefer not to sit with</option>
          </select>
        </div>
      ))}
    </div>
  );
}
```

### Step 6: Form Submission and Storage
Save responses to store:

```tsx
const handleSubmit = () => {
  const response: SurveyResponse = {
    id: crypto.randomUUID(),
    guestId: guest.id,
    submittedAt: new Date().toISOString(),
    answers: formData,
  };

  addSurveyResponse(response);

  // Also update guest with dietary info and relationships
  if (formData.dietary) {
    updateGuest(guest.id, { dietaryRestrictions: formData.dietary });
  }
  if (formData.relationships) {
    // Convert to relationship array format
    const relationships = Object.entries(formData.relationships)
      .filter(([_, type]) => type)
      .map(([guestId, type]) => ({ guestId, type, strength: getStrength(type) }));
    updateGuest(guest.id, { relationships });
  }

  setStep('complete');
};
```

### Step 7: Survey Page Styling
Create `GuestSurveyPage.css` with clean, mobile-first design:

```css
.survey-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f3 0%, #fff 100%);
  padding: 2rem 1rem;
}

.survey-header {
  text-align: center;
  margin-bottom: 2rem;
}

.survey-form {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2rem;
}

.question-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.question-label {
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: block;
}

.required::after {
  content: ' *';
  color: var(--color-primary);
}
```

### Step 8: Share Link Generation
Add method to copy survey link in Header:

```tsx
const copySurveyLink = () => {
  const link = `${window.location.origin}${window.location.pathname}#/survey`;
  navigator.clipboard.writeText(link);
  toast('Survey link copied!');
};
```

## Files to Create/Modify
- `src/components/GuestSurveyPage.tsx` (new)
- `src/components/GuestSurveyPage.css` (new)
- `src/App.tsx` (add routing)
- `src/components/Header.tsx` (add share link button)
- `src/store/useStore.ts` (add response storage)

## Testing Checklist
- [ ] Survey page loads at #/survey
- [ ] Email lookup finds correct guest
- [ ] All question types render correctly
- [ ] Required field validation works
- [ ] Responses save to store
- [ ] Guest record updates with dietary/relationships
- [ ] "Already submitted" detection
- [ ] Mobile responsive layout
- [ ] Share link copies correctly

## Estimated Complexity
Medium - New routing system, form handling, and response storage
