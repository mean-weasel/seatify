import { chromium } from 'playwright';

const APP_URL = 'http://localhost:5173/seating-arrangement/';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting Interactive Seating Demo recording...');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './recordings',
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    // Navigate to app
    console.log('Step 1: Opening app...');
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Clear any existing state
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await sleep(1500);

    // Make sure we're on Floor Plan view
    const floorPlanTab = page.locator('nav button, nav a, .nav-item, [data-tab]').filter({ hasText: 'Floor Plan' });
    if (await floorPlanTab.count() > 0) {
      await floorPlanTab.first().click();
      await sleep(500);
    }

    // Step 1: Create two round tables
    console.log('Step 2: Creating two round tables...');

    // Look for the toolbar button with "Round" text
    const roundBtn = page.locator('.canvas-toolbar button').first();
    await roundBtn.waitFor({ state: 'visible', timeout: 10000 });

    await roundBtn.click();
    await sleep(1000);
    await roundBtn.click();
    await sleep(1000);

    console.log('Step 3: Tables created, positioning...');

    // Move tables apart by dragging them
    const tables = page.locator('.table-component');
    await tables.first().waitFor({ state: 'visible', timeout: 5000 });

    // Get table positions and move them apart
    const table1 = tables.first();
    const table2 = tables.nth(1);

    // Drag first table to the left side
    const t1Box = await table1.boundingBox();
    if (t1Box) {
      await page.mouse.move(t1Box.x + t1Box.width / 2, t1Box.y + t1Box.height / 2);
      await page.mouse.down();
      await page.mouse.move(500, 400, { steps: 10 });
      await page.mouse.up();
      await sleep(500);
    }

    // Drag second table to the right side
    const t2Box = await table2.boundingBox();
    if (t2Box) {
      await page.mouse.move(t2Box.x + t2Box.width / 2, t2Box.y + t2Box.height / 2);
      await page.mouse.down();
      await page.mouse.move(800, 400, { steps: 10 });
      await page.mouse.up();
      await sleep(500);
    }

    // Deselect
    await page.locator('.canvas').click({ position: { x: 100, y: 100 } });
    await sleep(800);

    // Step 3: Add 10 guests
    console.log('Step 4: Adding 10 guests...');

    const guestNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];

    // Expand sidebar - it's collapsed showing "Guests" vertically
    const collapsedSidebar = page.locator('.sidebar-toggle-collapsed');
    if (await collapsedSidebar.isVisible()) {
      await collapsedSidebar.click();
      await sleep(500);
    }

    for (const name of guestNames) {
      // Click Add Guest button (has class add-guest-btn)
      const addGuestBtn = page.locator('.add-guest-btn').first();
      await addGuestBtn.waitFor({ state: 'visible', timeout: 5000 });
      await addGuestBtn.click();
      await sleep(400);

      // Fill in name - first input in the form modal
      const nameInput = page.locator('.guest-form-modal input').first();
      await nameInput.waitFor({ state: 'visible', timeout: 5000 });
      await nameInput.fill(name);
      await sleep(200);

      // Submit form - find button with Add or Save text
      const submitBtn = page.locator('.guest-form-modal button[type="submit"]');
      await submitBtn.click();
      await sleep(400);
    }

    await sleep(1000);
    console.log('Step 5: All guests added');

    // Take a screenshot to debug
    await page.screenshot({ path: './recordings/debug-after-guests.png' });

    // Keep sidebar open to see guests in the list
    // The canvas guests appear at x=80 which might be covered, but we can see them in sidebar
    await sleep(500);

    // Step 4-6: Drag guests to tables
    console.log('Step 6: Assigning guests to tables...');

    // Get table positions for dragging guests
    const tableElements = page.locator('.table-component');
    const tblA = tableElements.first();
    const tblB = tableElements.nth(1);

    const table1Box = await tblA.boundingBox();
    const table2Box = await tblB.boundingBox();

    if (!table1Box || !table2Box) {
      throw new Error('Could not find table positions');
    }

    const table1Center = {
      x: table1Box.x + table1Box.width / 2,
      y: table1Box.y + table1Box.height / 2
    };
    const table2Center = {
      x: table2Box.x + table2Box.width / 2,
      y: table2Box.y + table2Box.height / 2
    };

    // Get canvas guests
    const canvasGuests = page.locator('.canvas-guest');

    // Assign first 5 guests to table 1
    for (let i = 0; i < 5; i++) {
      const guestCount = await canvasGuests.count();
      if (guestCount === 0) break;

      const guest = canvasGuests.first();
      const guestBox = await guest.boundingBox();

      if (guestBox) {
        const guestCenter = {
          x: guestBox.x + guestBox.width / 2,
          y: guestBox.y + guestBox.height / 2
        };

        // Drag guest to table
        await page.mouse.move(guestCenter.x, guestCenter.y);
        await sleep(150);
        await page.mouse.down();
        await sleep(100);
        await page.mouse.move(table1Center.x, table1Center.y, { steps: 15 });
        await sleep(200);
        await page.mouse.up();
        await sleep(600);
      }
    }

    console.log('Step 7: First 5 guests assigned to Table 1');

    // Assign remaining 5 guests to table 2
    for (let i = 0; i < 5; i++) {
      const guestCount = await canvasGuests.count();
      if (guestCount === 0) break;

      const guest = canvasGuests.first();
      const guestBox = await guest.boundingBox();

      if (guestBox) {
        const guestCenter = {
          x: guestBox.x + guestBox.width / 2,
          y: guestBox.y + guestBox.height / 2
        };

        await page.mouse.move(guestCenter.x, guestCenter.y);
        await sleep(150);
        await page.mouse.down();
        await sleep(100);
        await page.mouse.move(table2Center.x, table2Center.y, { steps: 15 });
        await sleep(200);
        await page.mouse.up();
        await sleep(600);
      }
    }

    console.log('Step 8: All 10 guests assigned');
    await sleep(1500);

    // Step 7: Detach a guest and reassign
    console.log('Step 9: Detaching and reassigning a guest...');

    // Find a seated guest (orbit guest around table 1)
    const seatedGuests = page.locator('.seat-guest-circle, .seat-guest');
    const seatedCount = await seatedGuests.count();

    if (seatedCount > 0) {
      const firstSeated = seatedGuests.first();
      const seatedBox = await firstSeated.boundingBox();

      if (seatedBox) {
        const seatedCenter = {
          x: seatedBox.x + seatedBox.width / 2,
          y: seatedBox.y + seatedBox.height / 2
        };

        // Drag away from table first (detach)
        await page.mouse.move(seatedCenter.x, seatedCenter.y);
        await sleep(200);
        await page.mouse.down();
        await sleep(100);

        // Move away to detach
        const detachX = (seatedCenter.x + table2Center.x) / 2;
        const detachY = (seatedCenter.y + table2Center.y) / 2;
        await page.mouse.move(detachX, detachY, { steps: 10 });
        await sleep(300);

        // Continue to table 2 to reassign
        await page.mouse.move(table2Center.x, table2Center.y, { steps: 10 });
        await sleep(300);
        await page.mouse.up();
        await sleep(800);

        console.log('Step 10: Guest reassigned!');
      }
    }

    // Final pause to show result
    await sleep(2500);

    console.log('Recording complete!');
  } catch (error) {
    console.error('Error during recording:', error);
    // Take a screenshot to help debug
    await page.screenshot({ path: './recordings/error-screenshot.png' });
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log('Video saved to ./recordings/');
}

main().catch(console.error);
