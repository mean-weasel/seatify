import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function captureLogo() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set transparent background and exact viewport
  await page.setViewportSize({ width: 600, height: 200 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: transparent;
        }
        .logo {
          font-family: 'Caveat', cursive;
          font-size: 96px;
          font-weight: 700;
          color: #f97352;
          letter-spacing: -2px;
        }
      </style>
    </head>
    <body>
      <span class="logo">Seatify</span>
    </body>
    </html>
  `;

  await page.setContent(html);

  // Wait for font to load
  await page.waitForTimeout(1000);

  // Get the bounding box of the logo
  const logo = await page.locator('.logo');
  const box = await logo.boundingBox();

  // Screenshot just the logo with padding
  const padding = 20;
  await page.screenshot({
    path: join(__dirname, '../public/seatify-text-logo.png'),
    clip: {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
    omitBackground: true, // Transparent background
  });

  console.log('Logo saved to: public/seatify-text-logo.png');

  await browser.close();
}

captureLogo().catch(console.error);
