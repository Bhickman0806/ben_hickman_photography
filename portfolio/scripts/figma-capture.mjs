#!/usr/bin/env node
/**
 * Triggers a Figma html-to-design capture for a local page at a given viewport.
 * Usage: node figma-capture.mjs <captureId> <url> <width> <height> [label]
 */
import { chromium } from 'playwright';

const [captureId, url, widthStr, heightStr, label = ''] = process.argv.slice(2);
if (!captureId || !url || !widthStr || !heightStr) {
  console.error('Usage: node figma-capture.mjs <captureId> <url> <width> <height> [label]');
  process.exit(1);
}

const width = Number(widthStr);
const height = Number(heightStr);
const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width, height } });
const page = await context.newPage();

// Block chat API and analytics — they keep network active
await page.route('**/api/**', (route) => route.abort());
await page.route('**/*umami*', (route) => route.abort());

try {
  console.log(`Loading ${url} at ${width}x${height}...`);
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  const scriptRes = await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js');
  const scriptText = await scriptRes.text();
  await page.evaluate((s) => {
    const el = document.createElement('script');
    el.textContent = s;
    document.head.appendChild(el);
  }, scriptText);
  await page.waitForTimeout(500);

  console.log('Submitting capture to Figma...');
  const result = await page.evaluate(
    async ({ captureId, endpoint }) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('captureForDesign timed out after 300s')), 300000)
      );
      return Promise.race([
        window.figma.captureForDesign({ captureId, endpoint, selector: 'body' }),
        timeout,
      ]);
    },
    { captureId, endpoint }
  );

  console.log(JSON.stringify({ ok: true, label, width, height, url, result }));
} catch (err) {
  console.error(JSON.stringify({ ok: false, label, error: String(err) }));
  process.exit(1);
} finally {
  await browser.close();
}
