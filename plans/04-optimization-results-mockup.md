# Optimization Results View Mockup - Implementation Plan

## Overview and Goals

Enhance the OptimizeView with comprehensive results display providing detailed insight into optimization outcomes, enabling comparison and refinement of seating arrangements.

### Primary Goals
1. Display comprehensive optimization scores with category breakdowns
2. Enable before/after visual comparison of arrangements
3. Provide granular constraint satisfaction feedback
4. Surface table-by-table compatibility analysis
5. Highlight critical issues (avoid relationships, constraint violations)
6. Offer alternative arrangement suggestions
7. Track optimization history for version comparison

---

## UI/UX Design

### Layout Structure

```
+-----------------------------------------------------------------------+
|                          OPTIMIZATION RESULTS                          |
+-----------------------------------------------------------------------+
| [Back]                              History: v3 | v2 | v1  [Compare]  |
+-----------------------------------------------------------------------+
|                                                                        |
| +---------------------------+  +------------------------------------+  |
| |     OVERALL SCORE         |  |       SCORE BREAKDOWN              |  |
| |        87/100             |  |  [============] Constraints  95%   |  |
| |   "Excellent" Grade       |  |  [==========  ] Relationships 78%  |  |
| |                           |  |  [===========  ] Groups  85%       |  |
| +---------------------------+  |  [============] Capacity  100%     |  |
|                                +------------------------------------+  |
|                                                                        |
| +-------------------------------------------------------------------+  |
| |  CONSTRAINT CHECKLIST                                    [Expand] |  |
| +-------------------------------------------------------------------+  |
| | [x] Keep groups together           PASS    8/8 groups intact      |  |
| | [x] Respect "avoid" relationships  WARN    1 pair seated nearby   |  |
| | [!] Same table constraints         FAIL    2/5 constraints unmet  |  |
| | [x] Accessibility requirements     PASS    All accommodated       |  |
| +-------------------------------------------------------------------+  |
|                                                                        |
| +-------------------------------------------------------------------+  |
| |  ISSUES & WARNINGS                                       3 total  |  |
| +-------------------------------------------------------------------+  |
| | [!] John Smith & Jane Doe marked "avoid" but seated at Table 3    |  |
| | [!] "Marketing Team" split across Table 2 and Table 5             |  |
| | [i] Mike Wilson prefers front - assigned Table 7 (back section)   |  |
| +-------------------------------------------------------------------+  |
|                                                                        |
| +-------------------------------------------------------------------+  |
| |  TABLE-BY-TABLE ANALYSIS                                          |  |
| +-------------------------------------------------------------------+  |
| |  [Table 1 Card] [Table 2 Card] [Table 3 Card] [Table 4 Card] ...  |  |
| +-------------------------------------------------------------------+  |
|                                                                        |
| +-------------------------------------------------------------------+  |
| |  ALTERNATIVE SUGGESTIONS                                          |  |
| +-------------------------------------------------------------------+  |
| | Swap: Move John Smith to Table 5 for +8 compatibility points      |  |
| | Swap: Exchange seats between Table 2 & 3 to resolve avoid         |  |
| +-------------------------------------------------------------------+  |
|                                                                        |
| +-------------------------------------------------------------------+  |
| |  BEFORE / AFTER COMPARISON                               [Toggle] |  |
| +-------------------------------------------------------------------+  |
| |    BEFORE               |              AFTER                      |  |
| |  [Mini floor plan]      |         [Mini floor plan]              |  |
| |  Score: 62              |         Score: 87                      |  |
| +-------------------------------------------------------------------+  |
|                                                                        |
|              [ Apply Arrangement ]      [ Try Again ]                  |
+-----------------------------------------------------------------------+
```

---

## Component Structure

```
OptimizationResultsView/
├── ResultsHeader/
│   ├── BackButton
│   ├── VersionSelector
│   └── CompareToggle
├── ScoreSection/
│   ├── OverallScoreCard
│   └── ScoreBreakdownBars
├── ConstraintChecklist/
│   └── ConstraintCheckItem (repeated)
├── IssuesWarningsPanel/
│   └── IssueItem (repeated)
├── TableAnalysisGrid/
│   └── TableAnalysisCard (repeated)
├── AlternativeSuggestions/
│   └── SwapSuggestionCard (repeated)
├── BeforeAfterComparison/
│   ├── MiniFloorPlan (x2)
│   └── ComparisonStats
└── ActionButtons/
    ├── ApplyButton
    └── TryAgainButton
```

---

## Component Specifications

### 1. OverallScoreCard

- Large circular progress indicator (donut chart)
- Score number in center (0-100)
- Grade label (Excellent/Good/Fair/Poor)
- Color-coded: 90+ green, 70-89 yellow-green, 50-69 yellow, <50 red

### 2. ScoreBreakdownBars

Categories:
- Constraints Satisfied
- Relationship Score
- Group Cohesion
- Capacity Utilization
- Interest Matching

### 3. ConstraintChecklist

Status Types:
- `pass` - Green checkmark
- `warn` - Yellow warning
- `fail` - Red X

### 4. IssuesWarningsPanel

Issue Types:
- `critical` - Red, must resolve
- `warning` - Yellow, should address
- `info` - Blue, nice to know

### 5. TableAnalysisCard

- Table name and occupancy
- Compatibility score (0-100)
- Mini guest avatar arrangement
- Warning badge count
- Color-coded border

### 6. AlternativeSuggestionCard

- Swap description
- Expected score improvement
- One-click apply button

### 7. BeforeAfterComparison

- Side-by-side mini floor plans
- Key stats comparison
- Highlight changed assignments

---

## Data Types

```typescript
interface ExtendedOptimizationResult {
  assignments: Map<string, string>;
  score: number;

  scoreBreakdown: {
    constraints: { score: number; max: number };
    relationships: { score: number; max: number };
    groups: { score: number; max: number };
    capacity: { score: number; max: number };
  };

  constraintResults: ConstraintResult[];
  issues: OptimizationIssue[];
  tableAnalysis: Map<string, TableAnalysis>;
  suggestions: SwapSuggestion[];

  metadata: {
    timestamp: Date;
    version: number;
    durationMs: number;
  };
}

interface OptimizationIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'avoid_violation' | 'group_split' | 'constraint_violated';
  message: string;
  guestIds: string[];
  tableIds: string[];
}

interface SwapSuggestion {
  id: string;
  description: string;
  guestsInvolved: string[];
  scoreImprovement: number;
  fromTable?: string;
  toTable?: string;
}
```

---

## Store Extensions

```typescript
interface OptimizationState {
  currentResult: ExtendedOptimizationResult | null;
  optimizationHistory: OptimizationSnapshot[];
  comparisonMode: boolean;
  comparisonVersion: number | null;

  saveOptimizationToHistory: (result: ExtendedOptimizationResult) => void;
  loadHistoryVersion: (version: number) => void;
  applySuggestion: (suggestionId: string) => void;
}
```

---

## Implementation Steps

| Step | Description |
|------|-------------|
| 1 | Define ExtendedOptimizationResult types |
| 2 | Create score calculation utilities |
| 3 | Build OverallScoreCard with circular progress |
| 4 | Implement ScoreBreakdownBars |
| 5 | Create ConstraintChecklist component |
| 6 | Build IssuesWarningsPanel |
| 7 | Implement TableAnalysisCard grid |
| 8 | Create SwapSuggestionCard |
| 9 | Build BeforeAfterComparison with mini floor plans |
| 10 | Add optimization history to store |
| 11 | Integrate with existing OptimizeView |
