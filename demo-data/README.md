# Demo Data for SeatOptima

## Available Demo Files

### 1. `wedding-demo.json` - Full Wedding Setup
A complete wedding event with:
- 27 guests across multiple groups (Wedding Party, Family, Friends, Work, Neighbors)
- 7 tables (1 head table + 6 round tables)
- Pre-configured relationships (partners, family, friends, avoid)
- 4 constraints including a "feuding uncles" scenario
- Survey questions ready to go
- Mix of RSVP statuses (confirmed, pending, declined)

**To load:** Click "Import" in the header → "Import Full Event (JSON)" → Select this file

### 2. `sample-guests.csv` - Corporate Guest List
A CSV file demonstrating the bulk import feature with:
- 13 guests with company, group, and job title info
- Ready for corporate event demos

**To load:** Click "Import" in the header → "Import Guest List (CSV)" → Select this file

---

## Demo Walkthrough Scripts

### Demo 1: Wedding Planning (5 minutes)

1. **Start fresh** - Click "Reset" to clear any existing data
2. **Import the wedding** - Import `wedding-demo.json`
3. **Show Dashboard** - Point out:
   - 27 guests, 24 confirmed, 2 pending, 1 declined
   - Seating progress (only wedding party assigned)
   - Constraint summary
4. **Floor Plan** - Show the table layout, drag a table to reposition
5. **Guest Management** -
   - Search for "Mitchell" (show filtering)
   - Click a guest to see detail panel with relationships
   - Show "Uncle Bob" note about the family feud
6. **Run Optimization** - Click Optimize tab → Run Optimization
   - Show score breakdown
   - Point out the feuding uncles are on different tables
   - Show table-by-table scores
7. **Apply & Fine-tune** - Apply the optimization, then drag a guest manually
8. **Export** - Show how to save the setup

### Demo 2: Corporate Event (3 minutes)

1. **Reset** - Start fresh
2. **Set event type** - Change to "Corporate" in header
3. **Add tables** - Add 3-4 tables on Floor Plan
4. **Import CSV** - Import `sample-guests.csv`
5. **Show grouping** - Filter by group (Marketing, Engineering, etc.)
6. **Add constraint** - Keep "VIP Clients" together
7. **Optimize** - Run and show networking-friendly arrangement

### Demo 3: Survey Builder (2 minutes)

1. **Go to Survey tab**
2. **Show default questions**
3. **Add a new question** - "What's your favorite cuisine?" (multiselect)
4. **Reorder** - Drag to reposition
5. **Preview** - Show how it would look to guests
6. **Statistics** - Explain this shows responses once collected

---

## Key Features to Highlight

- **Auto-save**: All changes persist automatically (localStorage)
- **Export/Import**: Full event backup and restore
- **Smart Optimization**: Respects relationships and constraints
- **Visual Score**: See exactly why seating works or doesn't
- **Responsive**: Works on tablets and phones
