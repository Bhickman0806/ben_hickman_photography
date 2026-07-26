#!/usr/bin/env node
import { readFileSync } from 'fs';
import { chromium } from 'playwright';

const captures = JSON.parse(readFileSync(new URL('./figma-captures-remaining.json', import.meta.url), 'utf8'));

for (const job of captures) {
  const { label, captureId, url, width, height } = job;
  const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
  console.log(`\n=== ${label} ===`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.route('**/api/**', (route) => route.abort());

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    const scriptRes = await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js');
    await page.evaluate((s) => {
      const el = document.createElement('script');
      el.textContent = s;
      document.head.appendChild(el);
    }, await scriptRes.text());
    await page.waitForTimeout(500);

    const result = await Promise.race([
      page.evaluate(
        ({ captureId, endpoint }) =>
          window.figma.captureForDesign({ captureId, endpoint, selector: 'body' }),
        { captureId, endpoint }
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('capture timeout 120s')), 120000)),
    ]);

    console.log('OK:', JSON.stringify({ label, captureId, result }));
  } catch (err) {
    console.error('WARN:', label, String(err));
  } finally {
    await browser.close();
  }
  await new Promise((r) => setTimeout(r, 2000));
}

console.log('\nAll remaining captures triggered.');
