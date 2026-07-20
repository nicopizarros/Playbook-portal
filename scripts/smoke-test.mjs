import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3100';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto(BASE + '/', { waitUntil: 'networkidle' });

// Theme toggle
const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await page.click('.nav-actions .theme-toggle');
await page.waitForTimeout(150);
const afterToggle = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
console.log('theme:', initialTheme, '->', afterToggle, afterToggle !== initialTheme ? 'OK' : 'FAIL');

const stored = await page.evaluate(() => localStorage.getItem('playbook_theme'));
console.log('localStorage persisted:', stored);

// Reload, confirm the theme survives (the beforeInteractive script re-runs
// on every navigation, before hydration — Next's actual mechanism queues it
// via self.__next_s for its bootstrap to execute, which can trail
// domcontentloaded by a beat in dev mode, hence the poll instead of an
// immediate read).
await page.reload({ waitUntil: 'networkidle' });
try {
  await page.waitForFunction(
    expected => document.documentElement.getAttribute('data-theme') === expected,
    afterToggle,
    { timeout: 3000 },
  );
  console.log('theme survives reload: OK');
} catch {
  const val = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`theme survives reload: FAIL (${val})`);
}

// Mobile drawer (resize to mobile width first)
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
const navToggle = page.locator('#nav-toggle');
await navToggle.click();
await page.waitForTimeout(300);
const drawerOpen = await page.evaluate(() => document.getElementById('nav-links').classList.contains('is-open'));
const overlayOpen = await page.evaluate(() => document.querySelector('.nav-overlay').classList.contains('is-open'));
console.log('drawer opens:', drawerOpen, overlayOpen ? 'OK' : 'FAIL (overlay)');

await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const drawerClosedAfterEsc = await page.evaluate(() => !document.getElementById('nav-links').classList.contains('is-open'));
console.log('Escape closes drawer:', drawerClosedAfterEsc ? 'OK' : 'FAIL');

// Search
await page.setViewportSize({ width: 1280, height: 900 });
await page.reload({ waitUntil: 'networkidle' });
await page.fill('.nav-search input[type="search"]', 'FIFA');
await page.waitForTimeout(200);
const resultsCount = await page.locator('#search-results .sr-item').count();
console.log('search results for "FIFA":', resultsCount, resultsCount > 0 ? 'OK' : 'FAIL');

console.log('console/page errors:', errors.length ? errors : 'none');

await browser.close();
process.exit(errors.length ? 1 : 0);
