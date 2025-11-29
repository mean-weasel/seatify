# Survey Builder View - Mockup Implementation Plan

## Overview and Goals

Create a full-featured Survey Builder view for the SeatOptima application with drag-and-drop question ordering, live preview, and response analytics.

### Key Features
1. Drag-and-drop question reordering using @dnd-kit
2. Question type selector (text, multiselect, single_select, relationship)
3. Question editor panel with live preview
4. Options editor for multi/single select types
5. Required toggle for each question
6. Survey preview mode showing guest-facing view
7. Response statistics dashboard
8. Send survey button with email template preview

---

## Component Structure

### Main Layout

```
+---------------------------------------------------------------------+
| Header (with "Survey" nav button active)                             |
+---------------------------------------------------------------------+
|                                                                       |
|  +-----------------------------+  +-------------------------------+  |
|  |     SURVEY BUILDER          |  |      PREVIEW / ANALYTICS      |  |
|  |  (Left Panel - 55%)         |  |    (Right Panel - 45%)        |  |
|  |                             |  |                                |  |
|  |  [Template Selector]        |  |  [Tab: Preview | Statistics]   |  |
|  |  [+ Add Question]           |  |                                |  |
|  |                             |  |  +--------------------------+  |  |
|  |  +----------------------+   |  |  |   Live Preview or        |  |  |
|  |  | Question Card 1      |   |  |  |   Response Statistics    |  |  |
|  |  +----------------------+   |  |  +--------------------------+  |  |
|  |  +----------------------+   |  |                                |  |
|  |  | Question Card 2      |   |  |  [Send Survey Button]          |  |
|  |  +----------------------+   |  |                                |  |
|  +-----------------------------+  +-------------------------------+  |
+---------------------------------------------------------------------+
```

### Component Hierarchy

```
src/components/survey/
  SurveyBuilderView.tsx          # Main view container
  SurveyBuilderView.css

  builder/
    SurveyBuilderPanel.tsx       # Left panel - question management
    TemplateSelector.tsx         # Template dropdown with presets
    QuestionList.tsx             # Sortable list using @dnd-kit
    QuestionCard.tsx             # Individual draggable question card
    QuestionEditor.tsx           # Modal for editing questions
    OptionsEditor.tsx            # Sub-component for select options
    AddQuestionButton.tsx        # Button with question type dropdown

  preview/
    SurveyPreviewPanel.tsx       # Right panel container
    SurveyPreviewMode.tsx        # Guest-facing survey mockup
    QuestionPreview.tsx          # Individual question rendering
    StatisticsDashboard.tsx      # Response analytics view
    ResponseChart.tsx            # Bar charts for answers

  share/
    SendSurveyModal.tsx          # Email template preview modal
    EmailTemplateEditor.tsx      # Customize email content
    CopyLinkSection.tsx          # Share link generation
```

---

## UI/UX Design Details

### Question Card Design

```
+------------------------------------------------------------------+
| [Drag Handle]  Question Text Here...                   [Required] |
|                                                                    |
| Type: Single Select    Options: 4                                 |
|                                                                    |
| [Edit] [Duplicate] [Delete]                                       |
+------------------------------------------------------------------+
```

### Question Editor Modal

```
+--------------------------------------------------+
| Edit Question                               [X]   |
+--------------------------------------------------+
|                                                   |
|  QUESTION TEXT                                    |
|  +---------------------------------------------+ |
|  | What are your interests or hobbies?         | |
|  +---------------------------------------------+ |
|                                                   |
|  QUESTION TYPE                                    |
|  +------------------+                             |
|  | Single Select  v |                             |
|  +------------------+                             |
|                                                   |
|  OPTIONS (for select types)                       |
|  +--------------------------------------------+  |
|  | Option 1 [x]   Option 2 [x]   [+ Add]      |  |
|  +--------------------------------------------+  |
|                                                   |
|  [ ] Required question                            |
|                                                   |
| [Delete Question]              [Cancel] [Save]    |
+--------------------------------------------------+
```

### Statistics Dashboard

```
+--------------------------------------------------+
|  RESPONSE OVERVIEW                                |
+--------------------------------------------------+
|  +----------+  +----------+  +----------+        |
|  |    45    |  |    38    |  |    7     |        |
|  | Sent     |  | Responded|  | Pending  |        |
|  +----------+  +----------+  +----------+        |
|                                                   |
|  Response Rate: 84%  [====================    ]   |
+--------------------------------------------------+
|  QUESTION BREAKDOWN                               |
+--------------------------------------------------+
|  Q1: Which side are you here for?                 |
|  | Bride's side      [==============] 58%        |
|  | Groom's side      [==========] 35%            |
|  | Both              [===] 7%                    |
+--------------------------------------------------+
```

---

## Data Requirements

### Existing Types (from types/index.ts)

```typescript
export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiselect' | 'single_select' | 'relationship';
  options?: string[];
  required: boolean;
}

export interface SurveyResponse {
  guestId: string;
  questionId: string;
  answer: string | string[];
}
```

### New Store Actions Needed

```typescript
// Question CRUD
addSurveyQuestion: (question: Omit<SurveyQuestion, 'id'>) => void;
updateSurveyQuestion: (id: string, updates: Partial<SurveyQuestion>) => void;
removeSurveyQuestion: (id: string) => void;
reorderSurveyQuestions: (questionIds: string[]) => void;

// Template loading
loadSurveyTemplate: (templateId: 'wedding' | 'corporate' | 'social' | 'blank') => void;
```

---

## Survey Templates

```typescript
const surveyTemplates = {
  wedding: [
    { question: "Which side are you here for?", type: 'single_select', options: ["Bride's side", "Groom's side", "Both"], required: true },
    { question: "Who else attending do you know?", type: 'relationship', required: false },
    { question: "What are your interests?", type: 'text', required: false },
    { question: "Any dietary restrictions?", type: 'multiselect', options: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'], required: true },
  ],
  corporate: [
    { question: "What is your department?", type: 'single_select', options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'], required: true },
    { question: "Which colleagues do you work closely with?", type: 'relationship', required: false },
  ],
  // ...
};
```

---

## Drag-and-Drop Implementation

Using @dnd-kit/sortable:

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function QuestionList() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Reorder questions
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={questions} strategy={verticalListSortingStrategy}>
        {questions.map(q => <SortableQuestionCard key={q.id} question={q} />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

## Implementation Steps

| Step | Description |
|------|-------------|
| 1 | Create SurveyBuilderView with two-panel layout |
| 2 | Implement QuestionList with drag-and-drop |
| 3 | Build QuestionCard component |
| 4 | Create QuestionEditor modal |
| 5 | Add TemplateSelector dropdown |
| 6 | Implement SurveyPreviewMode |
| 7 | Build StatisticsDashboard with charts |
| 8 | Create SendSurveyModal |
| 9 | Add store actions for survey management |
| 10 | Integrate with Header navigation |
