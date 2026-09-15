import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('../validation/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = 4173;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

const server = http.createServer(async (request, response) => {
  try {
    const urlPath = new URL(request.url, `http://127.0.0.1:${port}`).pathname;
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const resolved = path.resolve(dist, relative);
    if (!resolved.startsWith(`${dist}${path.sep}`)) throw new Error('Invalid path');
    const content = await fs.readFile(resolved);
    response.writeHead(200, { 'content-type': mime[path.extname(resolved)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const errors = [];
const checks = [];

async function openPage(viewport, label) {
  console.log(`Browser QA: ${label} create page`);
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${label} console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`${label} page: ${error.message}`));
  console.log(`Browser QA: ${label} navigate`);
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(`Browser QA: ${label} wait for main`);
  await page.locator('#main').waitFor();
  console.log(`Browser QA: ${label} inspect geometry`);
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clipped: [...document.querySelectorAll('.panel, .lens-strip article, .dimension-grid article, .persona-stage article, .handoff-grid article')]
      .filter((element) => element.scrollWidth > element.clientWidth + 2)
      .map((element) => `${element.tagName}.${element.className}`),
  }));
  if (geometry.scrollWidth > geometry.clientWidth + 2) errors.push(`${label}: horizontal page overflow ${geometry.scrollWidth} > ${geometry.clientWidth}`);
  if (geometry.clipped.length) errors.push(`${label}: clipped panel content in ${geometry.clipped.join(', ')}`);
  checks.push({ label, viewport, geometry });
  return page;
}

try {
  console.log('Browser QA: opening desktop view');
  const desktop = await openPage({ width: 1440, height: 1000 }, 'desktop');
  await desktop.locator('#p1-strategies').fill('Only act');
  await desktop.locator('#game-form button[type="submit"]').click();
  if (!await desktop.locator('#diagnosis').getByText('Structure gate not yet passed').isVisible()) errors.push('desktop: invalid game was not rejected');
  await desktop.locator('#p1-strategies').fill('Enter, Stay out');
  await desktop.locator('.switch-row').nth(2).click();
  await desktop.locator('#game-form button[type="submit"]').click();
  if (!await desktop.locator('#diagnosis').getByText('Harsanyi lens').isVisible()) errors.push('desktop: private-information game was not classified as Harsanyi');

  await desktop.locator('#abstract-input').fill('Allocation matters. We build a tool.');
  await desktop.locator('#check-abstract').click();
  if (!await desktop.locator('#abstract-result').getByText('Revise sentence two').isVisible()) errors.push('desktop: weak abstract passed');
  await desktop.locator('#abstract-input').fill('Allocation matters. However, prior work leaves the behavioral gap unresolved. We test a mechanism.');
  await desktop.locator('#check-abstract').click();
  if (!await desktop.locator('#abstract-result').getByText('Gap pivot detected').isVisible()) errors.push('desktop: valid gap pivot failed');

  console.log('Browser QA: checking Boston rounds');
  for (let step = 0; step < 10 && await desktop.locator('#next-round').isEnabled(); step += 1) await desktop.locator('#next-round').click();
  if (!await desktop.locator('#stability-result').getByText('Not stable in this example.').isVisible()) errors.push('desktop: Boston blocking-pair result missing');
  await desktop.locator('#mechanism-select').selectOption('deferred');
  console.log('Browser QA: checking deferred-acceptance rounds');
  for (let step = 0; step < 10 && await desktop.locator('#next-round').isEnabled(); step += 1) await desktop.locator('#next-round').click();
  if (!await desktop.locator('#stability-result').getByText('Stable in this example.').isVisible()) errors.push('desktop: DA stability result missing');
  await desktop.locator('#run-comparison').click();
  if (!await desktop.locator('#comparison-dialog').isVisible()) errors.push('desktop: comparison dialog failed');
  await desktop.locator('.dialog-close').click();
  console.log('Browser QA: capturing desktop');
  await desktop.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await desktop.screenshot({ path: path.join(root, 'outputs', 'three_lens_desktop.png'), fullPage: true });
  await desktop.close();

  console.log('Browser QA: opening mobile view');
  const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
  console.log('Browser QA: capturing mobile');
  await mobile.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await mobile.screenshot({ path: path.join(root, 'outputs', 'three_lens_mobile.png'), fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

const report = { status: errors.length ? 'failed' : 'passed', checks, errors, method: 'Playwright Chromium at desktop and mobile widths with reduced motion' };
await fs.writeFile(path.join(root, 'outputs', 'browser_render_checks.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) throw new Error(errors.join('\n'));
console.log('Browser render checks passed at 1440×1000 and 390×844.');
