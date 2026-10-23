// Negative cases first: each checker must catch the problem it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findBrokenLinks, findPhoneNumbers, findDashes, findMissingFragments, sitemapUrls } from '../lib/checks.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-check-'));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
  return dir;
}

test('link check fails on a broken internal link', () => {
  const dir = fixture({ 'index.html': '<a href="/missing/">x</a><a href="/">home</a>' });
  assert.deepEqual(findBrokenLinks(dir, []), ['/ -> /missing/']);
});

test('link check fails on a missing asset', () => {
  const dir = fixture({ 'index.html': '<link href="/favicon.svg" rel="icon">' });
  assert.equal(findBrokenLinks(dir, []).length, 1);
});

test('link check ignores pending paths only when listed', () => {
  const dir = fixture({ 'index.html': '<a href="/work/">work</a>' });
  assert.equal(findBrokenLinks(dir, []).length, 1);
  assert.equal(findBrokenLinks(dir, ['/work/']).length, 0);
});

test('link check passes existing pages, files and fragments', () => {
  const dir = fixture({
    'index.html': '<a href="/a/#top">a</a><a href="/404.html">x</a><a href="#main">skip</a>',
    'a/index.html': 'a',
    '404.html': 'x',
  });
  assert.deepEqual(findBrokenLinks(dir, []), []);
});

test('phone check catches local, international and link forms', () => {
  assert.ok(findPhoneNumbers('<p>Call 0803 123 4567</p>').length);
  assert.ok(findPhoneNumbers('<p>+234 803 123 4567</p>').length);
  assert.ok(findPhoneNumbers('<p>2348031234567</p>').length);
  assert.ok(findPhoneNumbers('<a href="tel:123">x</a>').length);
  assert.ok(findPhoneNumbers('<a href="https://wa.me/1">x</a>').length);
  assert.deepEqual(findPhoneNumbers('<p>&#8358;268.36M in 6 months, 2,210 accounts, 2026</p>'), []);
});

test('dash check catches em and en dashes in visible text only', () => {
  assert.equal(findDashes('<p>Mar 2024 – Present</p>').length, 1);
  assert.equal(findDashes('<p>a — b</p>').length, 1);
  assert.equal(findDashes('<p>a &#8212; b</p>').length, 1);
  assert.deepEqual(findDashes('<style>/* — */</style><p>Mar 2024 to Present</p>'), []);
});

test('dash check catches named entities and SVG text', () => {
  assert.equal(findDashes('<p>a &mdash; b</p>').length, 1);
  assert.equal(findDashes('<p>2024&ndash;25</p>').length, 1);
  assert.equal(findDashes('<svg><text x="0" y="0">Step 1 – Discover</text></svg>').length, 1);
});

test('fragment check fails on a same-page link with no target', () => {
  assert.deepEqual(findMissingFragments('<a href="#contact">Contact</a><main id="main"></main>'), ['#contact']);
  assert.deepEqual(findMissingFragments('<a href="#contact">x</a><section id="contact"></section><a href="#">top</a>'), []);
});

test('sitemap parser reads every loc', () => {
  assert.deepEqual(sitemapUrls('<url><loc>https://x/</loc></url><url><loc>https://x/a/</loc></url>'), ['https://x/', 'https://x/a/']);
});

test('Lighthouse configs fail any category under 95, on mobile and desktop', () => {
  for (const file of ['lighthouserc.json', 'lighthouserc.desktop.json']) {
    const rc = JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
    const a = rc.ci.assert.assertions;
    for (const cat of ['performance', 'accessibility', 'best-practices', 'seo']) {
      assert.deepEqual(a[`categories:${cat}`], ['error', { minScore: 0.95 }], `${file} ${cat}`);
    }
  }
  const desktop = JSON.parse(readFileSync(new URL('../../lighthouserc.desktop.json', import.meta.url), 'utf8'));
  assert.equal(desktop.ci.collect.settings.preset, 'desktop');
});
