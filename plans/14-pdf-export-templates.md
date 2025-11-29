# Plan: PDF Export with Templates

## Overview
Comprehensive PDF export system supporting six export types with three template styles, all working client-side using jsPDF + jspdf-autotable + html2canvas.

## Priority
**High** - Essential for professional event management workflow.

---

## Dependencies

```bash
npm install jspdf jspdf-autotable html2canvas
npm install --save-dev @types/jspdf
```

---

## Export Types

### 1. Floor Plan Export
Visual representation of the entire venue layout.

**Features:**
- Captures canvas as image using html2canvas
- Adds header with event name and date
- Footer with legend and statistics
- Landscape orientation

### 2. Table Cards (4 per page)
Detailed cards for each table, suitable for staff reference.

**Layout per card:**
- Table name and shape
- Guest list with dietary icons
- Occupancy indicator
- Cut marks for printing

### 3. Place Cards (8 per page)
Printable tent-fold name cards.

**Layout:**
- 4" x 2" when folded
- Guest name centered
- Table name below
- Fold line in middle
- Both halves identical (for tent fold)

### 4. Master Guest List
Alphabetical listing with table assignments.

**Columns:**
- #, Guest Name, Table, Group, Dietary
- Sortable by name, table, or group
- Pagination for large lists
- Summary footer

### 5. Dietary Summary Report
Breakdown for catering staff.

**Sections:**
- Summary by restriction (count, percentage)
- Breakdown by table
- Accessibility needs
- Full list by restriction type

### 6. Seating Chart
Table-by-table guest listing.

**Format:**
- Each table as a block
- Guest names in 2-column layout
- Dietary icons inline
- Unassigned section at end

---

## Template Styles

### Elegant
- Serif fonts (Times)
- Warm brown colors (#8B7355)
- Decorative borders and lines
- Script-like headings
- Best for: Weddings, galas

### Modern
- Sans-serif fonts (Helvetica)
- Minimal black/gray (#1A1A1A)
- Clean lines, no decorations
- Bold geometric shapes
- Best for: Corporate events

### Classic
- Serif fonts (Times)
- Navy blue (#1A365D)
- Traditional borders
- Formal layout
- Best for: Formal dinners

---

## Type Definitions

```typescript
// src/types/pdf.ts
export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
}

export interface PdfTemplate {
  id: 'elegant' | 'modern' | 'classic';
  name: string;
  description: string;
  fonts: {
    heading: FontConfig;
    subheading: FontConfig;
    body: FontConfig;
    caption: FontConfig;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
  };
  pageSize: 'letter' | 'a4';
  headerStyle: 'minimal' | 'elegant' | 'corporate';
  showPageNumbers: boolean;
  showCutMarks: boolean;
  decorativeBorders: boolean;
}

export interface ExportOptions {
  exportType: 'floor-plan' | 'table-cards' | 'place-cards' |
              'guest-list' | 'dietary-report' | 'seating-chart';
  template: PdfTemplate;
  sortBy?: 'alphabetical' | 'table' | 'group';
}
```

---

## File Structure

```
src/
├── types/
│   └── pdf.ts
├── services/
│   └── pdf/
│       ├── index.ts                     # Main entry point
│       ├── templates/
│       │   ├── FloorPlanTemplate.ts
│       │   ├── TableCardTemplate.ts
│       │   ├── PlaceCardTemplate.ts
│       │   ├── GuestListTemplate.ts
│       │   ├── DietaryReportTemplate.ts
│       │   └── SeatingChartTemplate.ts
│       └── utils/
│           └── pdfHelpers.ts
├── components/
│   ├── ExportModal.tsx
│   └── ExportModal.css
└── data/
    └── pdfTemplates.ts
```

---

## Export Modal UI

```tsx
<div className="export-modal">
  <h2>Export PDF</h2>

  {/* Export Type Selection */}
  <div className="export-type-grid">
    {exportTypes.map(type => (
      <button
        className={selectedType === type.id ? 'selected' : ''}
        onClick={() => setSelectedType(type.id)}
      >
        <span className="name">{type.name}</span>
        <span className="desc">{type.description}</span>
      </button>
    ))}
  </div>

  {/* Template Selection */}
  <div className="template-options">
    {templates.map(template => (
      <button className={selected ? 'selected' : ''}>
        <TemplatePreview template={template} />
        <span>{template.name}</span>
      </button>
    ))}
  </div>

  {/* Sort Options (for guest list) */}
  {selectedType === 'guest-list' && (
    <RadioGroup options={['alphabetical', 'table', 'group']} />
  )}

  {/* Actions */}
  <button onClick={handleExport}>Download PDF</button>
</div>
```

---

## Implementation Example: Guest List

```typescript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateGuestListPdf(
  event: Event,
  template: PdfTemplate,
  sortBy: 'alphabetical' | 'table' | 'group'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: template.pageSize === 'a4' ? 'a4' : 'letter',
  });

  // Header
  renderHeader(doc, event, template, 'GUEST LIST');

  // Sort guests
  const sortedGuests = sortGuests(event.guests, sortBy);

  // Generate table
  autoTable(doc, {
    head: [['#', 'Guest Name', 'Table', 'Group', 'Dietary']],
    body: sortedGuests.map((guest, i) => [
      i + 1,
      guest.name,
      getTableName(guest.tableId),
      guest.group || '-',
      guest.dietaryRestrictions?.join(', ') || '-',
    ]),
    headStyles: {
      fillColor: hexToRgb(template.colors.primary),
      textColor: [255, 255, 255],
    },
    didDrawPage: (data) => {
      // Page numbers
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - 40,
        pageHeight - 20,
        { align: 'right' }
      );
    },
  });

  return doc;
}
```

---

## Integration Points

### Header.tsx
Add "Export PDF" button:
```tsx
<button onClick={() => setShowExportModal(true)}>
  Export PDF
</button>

{showExportModal && (
  <ExportModal onClose={() => setShowExportModal(false)} />
)}
```

### Floor Plan Capture
```typescript
const canvasElement = document.querySelector('.canvas-content');
const canvas = await html2canvas(canvasElement, {
  scale: 2,
  backgroundColor: '#ffffff',
});
const imgData = canvas.toDataURL('image/png');
doc.addImage(imgData, 'PNG', x, y, width, height);
```

---

## Testing Checklist

- [ ] Floor plan captures canvas correctly
- [ ] Table cards render 4 per page
- [ ] Place cards fold lines align
- [ ] Guest list paginates properly
- [ ] Dietary report shows accurate counts
- [ ] All templates render distinctly
- [ ] PDF text is selectable
- [ ] Works in Chrome, Firefox, Safari
- [ ] Handles 500+ guests
- [ ] Unicode characters work

---

## Edge Cases

1. **No guests** - Show "No guests" message
2. **No tables** - Disable floor plan export
3. **Long names** - Truncate with ellipsis
4. **Large events** - Show progress indicator
5. **Missing date** - Omit gracefully

---

## Estimated Timeline
**31-41 hours** total across all templates and UI.
