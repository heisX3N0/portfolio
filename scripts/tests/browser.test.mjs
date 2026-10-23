// Layout rules measured in headless Chrome against the built site: `pnpm build` first.
// Needs Chrome or Edge (CHROME_PATH overrides the search in scripts/lib/browser.mjs).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listHtmlFiles, pagePath } from '../lib/checks.mjs';
import { serve, launch } from '../lib/browser.mjs';
import { rowCount, outsideFirstScreen, overBudget } from '../lib/layout.mjs';
import { parseHeaders } from '../lib/headers.mjs';
import { crc32, deflateSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
if (!existsSync(dist)) throw new Error('dist/ missing: run pnpm build first');
const paths = listHtmlFiles(dist).map((f) => pagePath(dist, f)).map((p) => (p === '/404' ? '/404.html' : p));

let server;
let origin;
let browser;

// Every page is served with the CSP from _headers, as Cloudflare serves it, so each check below also runs under it.
const csp = parseHeaders(readFileSync(join(dist, '_headers'), 'utf8')).find((r) => r.pattern === '/*')?.headers['content-security-policy'];
if (!csp) throw new Error('dist/_headers has no Content-Security-Policy for /*');

// P5 (SPEC 11): a test headshot, made here so no image is committed: a 320x320 PNG in one flat colour.
const HEADSHOT = '/__test/headshot.png';
function testPng(size = 320) {
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])));
    return Buffer.concat([length, Buffer.from(type), data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(size).fill([120, 140, 160]).flat())]);
  const pixels = deflateSync(Buffer.concat(Array(size).fill(row)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', pixels), chunk('IEND', Buffer.alloc(0))]);
}

before(async () => {
  ({ server, origin } = await serve(dist, { 'Content-Security-Policy': csp }, { [HEADSHOT]: { type: 'image/png', body: testPng() } }));
  browser = await launch();
  // Record anything the CSP blocks; this runs outside the page's CSP, before its own scripts.
  await browser.beforeEachLoad(`window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline')));`);
});

// SPEC 9.5 (P4): the CSP blocks nothing the site needs, in either theme (the theme script is the one inline script).
test('the CSP blocks nothing on any page', async () => {
  for (const path of paths) {
    for (const scheme of ['light', 'dark']) {
      await browser.open(origin + path, { width: 1366, height: 768, scheme });
      assert.deepEqual(await browser.evaluate('window.__csp'), [], `${path} (${scheme})`);
      // The theme script ran under the CSP: it follows the system preference when nothing is stored.
      assert.equal(await browser.evaluate('document.documentElement.dataset.theme'), scheme, `${path}: theme script blocked`);
    }
  }
});

// With a token in site.yaml, the analytics script loads under the CSP (its report to Cloudflare is blocked in tests).
test('the analytics script loads under the CSP when a token is set', async (t) => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  if (!html.includes('static.cloudflareinsights.com/beacon.min.js')) return t.skip('no analyticsToken in site.yaml');
  const token = JSON.parse(html.match(/data-cf-beacon="([^"]+)"/)[1].replace(/&quot;/g, '"')).token;
  await browser.open(`${origin}/`, { width: 1366, height: 768 });
  // The script ran: it records its settings on window. (Cross-origin timing hides the response status.)
  assert.equal(await browser.evaluate('window.__cfBeacon?.token ?? null'), token, 'beacon.min.js did not run');
  assert.deepEqual(await browser.evaluate('window.__csp'), []);
  // And the report is blocked, so test visits never reach the dashboard.
  const report = await browser.evaluate(`fetch('https://cloudflareinsights.com/cdn-cgi/rum', { mode: 'no-cors' }).then(() => 'sent', () => 'blocked')`);
  assert.equal(report, 'blocked');
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

// SPEC 11: with the headshot flag on, the hero holds at every width. The built pages have the flag off (site.yaml), so
// the test turns it on in the page as Hero.astro would: the intro gets hero__intro--headshot and the image goes first.
const heroSource = readFileSync(new URL('../../src/components/Hero.astro', import.meta.url), 'utf8');
const turnOnHeadshot = `(async () => {
  const intro = document.querySelector('.hero__intro');
  intro.classList.add('hero__intro--headshot');
  const img = document.createElement('img');
  Object.assign(img, { className: 'hero__headshot', src: ${JSON.stringify(HEADSHOT)}, alt: document.querySelector('.hero h1').textContent, width: 160, height: 160 });
  // Astro scopes Hero's styles with a data-astro-cid-* attribute on each of its elements: without it, no hero style applies.
  const scope = [...intro.attributes].find((a) => a.name.startsWith('data-astro-cid-'));
  if (!scope) throw new Error('no Astro scope attribute on .hero__intro');
  img.setAttribute(scope.name, '');
  intro.prepend(img);
  await img.decode();
  return img.naturalWidth;
})()`;
// Overflow: anything in the hero past the viewport's sides, text wider than its own box, the headshot outside the
// intro. Overlap: the headshot over any hero text, or any two hero parts over each other (the buttons, not the actions
// area: on desktop the proof strip rises into that area's bottom padding by design).
const headshotProblems = `(() => {
  const out = [];
  const name = (el) => el.className || el.tagName;
  const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
  const width = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > width) out.push('page scrolls sideways: ' + document.documentElement.scrollWidth + 'px');
  for (const el of document.querySelectorAll('.hero *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !el.offsetParent) continue;
    if (r.left < -0.5 || r.right > width + 0.5) out.push('outside the viewport: ' + name(el));
  }
  const text = [...document.querySelectorAll('.hero h1, .hero__title, .hero__positioning, .hero__supporting')];
  for (const el of text) if (el.scrollWidth > el.clientWidth + 1) out.push('text wider than its box: ' + name(el));
  const shot = document.querySelector('.hero__headshot').getBoundingClientRect();
  const intro = document.querySelector('.hero__intro').getBoundingClientRect();
  if (shot.left < intro.left - 0.5 || shot.right > intro.right + 0.5) out.push('headshot outside the intro');
  for (const el of text) if (overlap(shot, el.getBoundingClientRect())) out.push('headshot overlaps ' + name(el));
  const areas = [...document.querySelectorAll('.hero__intro, .hero__supporting, .hero__actions .button, .hero__contact, .hero [data-proof-strip]')].filter((el) => el.offsetParent);
  for (const [i, a] of areas.entries()) {
    for (const b of areas.slice(i + 1)) if (overlap(a.getBoundingClientRect(), b.getBoundingClientRect())) out.push(name(a) + ' overlaps ' + name(b));
  }
  return out;
})()`;

test('the headshot test turns it on the way Hero.astro does', () => {
  assert.match(heroSource, /'hero__intro--headshot': showHeadshot/);
  assert.match(heroSource, /<img class="hero__headshot" src=\{headshot!\.src\} alt=\{name\} width="160" height="160" \/>/);
});

for (const size of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 1366, height: 768 }]) {
  test(`headshot on: the hero neither overflows nor overlaps at ${size.width}x${size.height}`, async () => {
    for (const path of ['/', '/business-analyst/']) {
      for (const scheme of ['light', 'dark']) {
        await browser.open(origin + path, { ...size, scheme });
        assert.equal(await browser.evaluate(turnOnHeadshot), 320, `${path}: test image did not load`);
        assert.deepEqual(await browser.evaluate(headshotProblems), [], `${path} (${scheme})`);
        assert.deepEqual(await browser.evaluate('window.__csp'), [], `${path}: CSP blocked the headshot`);
      }
    }
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

// P3: case studies (SPEC 1.4, 4.2 and 7).
const studies = paths.filter((p) => /^\/work\/[a-z0-9-]+\/$/.test(p));

test('no figure scrolls sideways at 360px', async () => {
  for (const path of ['/styleguide/', ...studies]) {
    await browser.open(origin + path, { width: 360, height: 740 });
    const wide = await browser.evaluate(
      `[...document.querySelectorAll('.figure__body')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.parentElement.querySelector('figcaption')?.textContent.trim())`,
    );
    assert.deepEqual(wide, [], path);
  }
  assert.equal(studies.length, 6, 'case studies built');
});

test('diagram text stays inside its box at 360px and 1366px', async () => {
  assert.equal(studies.length, 6, 'case studies built');
  for (const path of studies) {
    for (const width of [360, 1366]) {
      await browser.open(origin + path, { width, height: 800 });
      const outside = await browser.evaluate(`(() => {
        const out = [];
        for (const g of document.querySelectorAll('svg .d-box, svg .d-lanehead')) {
          if (!g.getClientRects().length) continue;
          const box = g.querySelector('rect').getBoundingClientRect();
          for (const t of g.querySelectorAll('text')) {
            const r = t.getBoundingClientRect();
            if (r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5) out.push(t.textContent);
          }
        }
        return out;
      })()`);
      assert.deepEqual(outside, [], `${path} at ${width}px`);
    }
  }
});

for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`case study title, outcome and metadata in the first screen at ${size.width}x${size.height}`, async () => {
    assert.equal(studies.length, 6, 'case studies built');
    for (const path of studies) {
      await browser.open(origin + path, size);
      const items = {
        h1: await browser.evaluate(rect('.case h1')),
        outcome: await browser.evaluate(rect('.case__outcome')),
        metadata: await browser.evaluate(rect('.case__meta')),
      };
      assert.deepEqual(outsideFirstScreen(items, size.height), [], `${path}: ${JSON.stringify(items)}`);
    }
  });
}

test('the /work/ filters show only the matching cards, with CSS alone', async () => {
  // A query per filter makes each a fresh load: a hash-only change fires no load event.
  const shown = async (hash) => {
    await browser.open(`${origin}/work/?filter=${hash.slice(1)}${hash}`, { width: 1366, height: 768 });
    return browser.evaluate(
      `[...document.querySelectorAll('.card-grid > li')].filter((li) => li.offsetParent).map((li) => li.querySelector('h3 a').getAttribute('href').split('/')[2])`,
    );
  };
  assert.deepEqual(await shown('#banking'), ['closa-cbn-compliance', 'performance-buddy-access-control', 'aggregator-onboarding-redesign']);
  assert.deepEqual(await shown('#ai-products'), ['aimery-ai-requirements', 'merge-x-requirements-from-failure', 'gpt-investor-discovery']);
  assert.equal((await shown('#all')).length, 6);
  assert.equal((await shown('')).length, 6);
});
