// Layout rules measured in headless Chrome against the built site: `pnpm build` first.
// Needs Chrome or Edge (CHROME_PATH overrides the search in scripts/lib/browser.mjs).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles, pagePath } from '../lib/checks.mjs';
import { serve, launch } from '../lib/browser.mjs';
import { rowCount, outsideFirstScreen, overBudget } from '../lib/layout.mjs';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
if (!existsSync(dist)) throw new Error('dist/ missing: run pnpm build first');
const paths = listHtmlFiles(dist).map((f) => pagePath(dist, f)).map((p) => (p === '/404' ? '/404.html' : p));

let server;
let origin;
let browser;

before(async () => {
  ({ server, origin } = await serve(dist));
  browser = await launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

// The element's box, or null when it is missing or covered by something else at its centre (a box can be on screen but hidden).
const rect = (selector) =>
  `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + r.height / 2);
    if (!hit || !el.contains(hit)) return null;
    return { top: r.top, bottom: r.bottom };
  })()`;

for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  for (const path of ['/business-analyst/', '/styleguide/']) {
    test(`${path} hero: h1, proof strip and Download CV in the first screen at ${size.width}x${size.height}`, async () => {
      for (const scheme of ['light', 'dark']) {
        await browser.open(origin + path, { ...size, scheme });
        const items = {
          h1: await browser.evaluate(rect('.hero h1')),
          'proof strip': await browser.evaluate(rect('.hero [data-proof-strip]')),
          'Download CV': await browser.evaluate(rect('.hero [data-download-cv]')),
        };
        assert.deepEqual(outsideFirstScreen(items, size.height), [], `${scheme}: ${JSON.stringify(items)}`);
      }
    });
  }

  test(`root hero: name, root line and Download CV in the first screen at ${size.width}x${size.height}`, async () => {
    await browser.open(`${origin}/`, size);
    const items = {
      h1: await browser.evaluate(rect('.hero h1')),
      'root line': await browser.evaluate(rect('.hero .hero__positioning')),
      'Download CV': await browser.evaluate(rect('.hero [data-download-cv]')),
    };
    assert.deepEqual(outsideFirstScreen(items, size.height), [], JSON.stringify(items));
  });
}

// The BA proof strip shows ₦ in the serif; the About timeline shows it in Inter.
for (const [path, file, family] of [
  ['/business-analyst/', 'source-serif-4-naira.woff2', 'Source Serif 4'],
  ['/about/', 'inter-naira.woff2', 'Inter'],
]) {
  test(`${path}: the naira sign loads ${file}, not a latin-ext subset`, async () => {
    await browser.open(origin + path, { width: 1366, height: 768 });
    const fonts = await browser.evaluate(
      `performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.woff2')).map((e) => e.name.split('/').pop())`,
    );
    assert.ok(fonts.includes(file), `${file} not loaded: ${fonts}`);
    assert.ok(!fonts.some((f) => f.includes('latin-ext')), `latin-ext loaded: ${fonts}`);
    const loaded = await browser.evaluate(
      `[...document.fonts].filter((f) => f.unicodeRange.toUpperCase().includes('20A6') && f.status === 'loaded').map((f) => f.family)`,
    );
    assert.ok(loaded.some((f) => f.replace(/"/g, '') === family), `no loaded ${family} face covers U+20A6: ${loaded}`);
  });
}

test('the header stays on one row at 360px on every page', async () => {
  for (const path of paths) {
    await browser.open(origin + path, { width: 360, height: 740 });
    const rects = await browser.evaluate(
      `[...document.querySelectorAll('.site-header__brand, .site-nav > li')].filter((el) => el.offsetParent).map((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; })`,
    );
    assert.ok(rects.length >= 5, `${path}: header items not found`);
    assert.equal(rowCount(rects), 1, `${path}: header wraps`);
  }
});

test('no horizontal page scroll at 360px on any page, in either theme', async () => {
  for (const path of paths) {
    for (const scheme of ['light', 'dark']) {
      await browser.open(origin + path, { width: 360, height: 740, scheme });
      const { scroll, client } = await browser.evaluate(`({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })`);
      assert.ok(scroll <= client, `${path} (${scheme}): page is ${scroll}px wide in a ${client}px viewport`);
    }
  }
});

test('the theme toggle has a name that says what it does and changes with the theme', async () => {
  await browser.open(`${origin}/`, { width: 1366, height: 768 });
  const name = () => browser.evaluate(`document.querySelector('[data-theme-toggle]')?.getAttribute('aria-label') ?? ''`);
  const theme = () => browser.evaluate(`document.documentElement.getAttribute('data-theme')`);
  assert.equal(await theme(), 'light');
  assert.equal(await name(), 'Switch to dark theme');
  try {
    await browser.evaluate(`document.querySelector('[data-theme-toggle]').click()`);
    assert.equal(await theme(), 'dark');
    assert.equal(await name(), 'Switch to light theme');
  } finally {
    // The click saves the choice; clear it so later tests get the scheme they ask for.
    await browser.evaluate('localStorage.clear()');
  }
});

test('the Contact link lands on a contact section on every page', async () => {
  for (const path of paths) {
    await browser.open(origin + path, { width: 1366, height: 768 });
    const ok = await browser.evaluate(
      `(() => { const a = document.querySelector('.site-nav a[href="#contact"]'); const t = document.getElementById('contact'); return Boolean(a && t && t.offsetParent); })()`,
    );
    assert.ok(ok, `${path}: Contact link or visible #contact section missing`);
  }
});

test('every page transfers 200 KB or less (SPEC 9.4)', async () => {
  const bytes = {};
  for (const path of paths) {
    await browser.open(origin + path, { width: 390, height: 844 });
    bytes[path] = await browser.evaluate(
      `[...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce((sum, e) => sum + e.transferSize, 0)`,
    );
  }
  assert.deepEqual(overBudget(bytes), [], JSON.stringify(bytes));
});
