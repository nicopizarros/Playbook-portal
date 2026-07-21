import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3100';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

// Reuses the cookie jar built up earlier by curl (already past quota) is a
// different process/cookie store — start fresh and burn through the quota
// via the browser itself so this is a real, self-contained repro.
const ids = [
  'lana-fifa-super-bowl-halftime',
  'atp-wta-fusion-detenida',
  'nfl-fanatics-football-x-football',
  'liga-mx-sin-ascenso-descenso',
];
for (const id of ids) {
  await page.goto(`${BASE}/articulo?id=${id}`, { waitUntil: 'networkidle' });
}

const wallVisible = await page.locator('.email-wall-form').count();
console.log('email wall visible on 4th article:', wallVisible > 0 ? 'OK' : 'FAIL');

await page.fill('#email-wall-address', 'lector-de-prueba@example.com');
await page.click('.email-wall-form button[type="submit"]');
await page.waitForTimeout(2000);

const successVisible = await page.locator('.article-walled .nl-success').count();
const errorText = await page.locator('.email-wall-form .nl-error').textContent().catch(() => '');

console.log('success message shown:', successVisible > 0 ? 'YES' : 'no');
console.log('error message (expected without a real RESEND_API_KEY):', errorText || '(none)');
console.log('page errors:', errors.length ? errors : 'none');

await browser.close();
