#!/usr/bin/env node
import { readFileSync } from 'fs';
import { chromium } from 'playwright';

const captures = JSON.parse(readFileSync(new URL('./figma-captures-batch.json', import.meta.url), 'utf8'));

for (const job of captures) {
  const { label, captureId, url, width, height } = job;
  const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
  console.log(`\n=== Capturing: ${label} (${width}x${height}) ===`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });

  await page.route('**/api/**', (route) => route.abort());
  await page.route('**/*umami*', (route) => route.abort());

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const scriptRes = await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js');
    await page.evaluate((s) => {
      const el = document.createElement('script');
      el.textContent = s;
      document.head.appendChild(el);
    }, await scriptRes.text());
    await page.waitForTimeout(800);

    const result = await page.evaluate(
      async ({ captureId, endpoint }) => {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('captureForDesign timed out after 120s')), 120000)
        );
        return Promise.race([
          window.figma.captureForDesign({ captureId, endpoint, selector: 'body' }),
          timeout,
        ]);
      },
      { captureId, endpoint }
    );

    console.log('OK:', JSON.stringify({ label, captureId, result }));
  } catch (err) {
    console.error('FAIL:', label, String(err));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
