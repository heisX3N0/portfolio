// Runs against the built site: `pnpm build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { listHtmlFiles, pagePath, findBrokenLinks, findPhoneNumbers, findDashes, findMissingFragments, sitemapUrls } from '../lib/checks.mjs';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
const built = existsSync(join(dist, 'index.html'));
const pages = built ? listHtmlFiles(dist).map((f) => ({ path: pagePath(dist, f), html: readFileSync(f, 'utf8') })) : [];

test('the site is built', () => {
  assert.ok(built, 'dist/index.html missing: run pnpm build first');
});

test('no broken internal links', () => {
  assert.deepEqual(findBrokenLinks(dist), []);
});

test('no phone number, tel: or WhatsApp link on any page', () => {
  for (const p of pages) assert.deepEqual(findPhoneNumbers(p.html), [], p.path);
});

test('no em or en dashes in visible text', () => {
  for (const p of pages) assert.deepEqual(findDashes(p.html), [], p.path);
});

test('styleguide is built but not in the sitemap', () => {
  assert.ok(existsSync(join(dist, 'styleguide', 'index.html')), 'styleguide page missing');
  const index = join(dist, 'sitemap-index.xml');
  assert.ok(existsSync(index), 'sitemap-index.xml missing');
  const urls = sitemapUrls(readFileSync(index, 'utf8'))
    .flatMap((u) => sitemapUrls(readFileSync(join(dist, new URL(u).pathname), 'utf8')));
  assert.ok(urls.length > 0, 'sitemap is empty');
  assert.ok(!urls.some((u) => u.includes('/styleguide')), 'styleguide is in the sitemap');
  assert.ok(!urls.some((u) => u.includes('404')), '404 is in the sitemap');
});

test('no page emits noindex', () => {
  for (const p of pages) assert.doesNotMatch(p.html, /noindex/i, p.path);
});

test('every page has one main landmark, a skip link, lang and a unique title', () => {
  const titles = new Set();
  for (const p of pages) {
    assert.equal((p.html.match(/<main\b/g) || []).length, 1, `${p.path}: main count`);
    assert.match(p.html, /<main[^>]*id="main"/, `${p.path}: main id`);
    assert.match(p.html, /<a[^>]*href="#main"[^>]*>Skip to content<\/a>/, `${p.path}: skip link`);
    assert.match(p.html, /<html[^>]*lang="en-GB"/, `${p.path}: lang`);
    const title = p.html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `${p.path}: title`);
    assert.ok(!titles.has(title), `${p.path}: duplicate title ${title}`);
    titles.add(title);
    assert.match(p.html, /<meta name="description" content="[^"]+"/, `${p.path}: description`);
  }
});

test('header and footer carry the global links', () => {
  for (const p of pages) {
    assert.match(p.html, /href="mailto:olapadeben@gmail\.com"/, `${p.path}: email`);
    assert.match(p.html, /href="https:\/\/www\.linkedin\.com\/in\/boluwatife-olapade"/, `${p.path}: LinkedIn`);
    assert.match(p.html, /href="https:\/\/github\.com\/heisX3N0"/, `${p.path}: GitHub`);
    assert.match(p.html, /href="\/cv\/business-analyst\.pdf"/, `${p.path}: CV`);
    assert.match(p.html, /Last updated [A-Z][a-z]+ \d{4}/, `${p.path}: last updated`);
    assert.match(p.html, /href="\/about\/#how-this-site-was-built"/, `${p.path}: credit`);
  }
});

test('canonical matches each page, and the 404 page has none', () => {
  for (const p of pages) {
    const canonical = p.html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (p.path === '/404') assert.equal(canonical, undefined, '404 has a canonical');
    else assert.equal(canonical, `https://boluwatife.olapade.site${p.path}`, p.path);
  }
});

test('404 links to Home, Work and the BA role page', () => {
  const page = pages.find((p) => p.path === '/404');
  assert.ok(page, '404.html missing');
  for (const href of ['/', '/work/', '/business-analyst/']) assert.match(page.html, new RegExp(`href="${href}"`), href);
});

test('the theme toggle is hidden until the script runs', () => {
  for (const p of pages) assert.match(p.html, /<button[^>]*data-theme-toggle[^>]*hidden/, p.path);
});

test('every same-page link has a target, and Contact jumps to #contact', () => {
  for (const p of pages) {
    assert.deepEqual(findMissingFragments(p.html), [], p.path);
    assert.match(p.html, /<a[^>]*href="#contact"[^>]*>Contact<\/a>/, `${p.path}: header Contact link`);
    assert.doesNotMatch(p.html, /<nav[\s\S]*?href="mailto:[\s\S]*?<\/nav>/, `${p.path}: header still opens a mail app`);
  }
});

test('the theme toggle has an accessible name in the HTML before the script runs', () => {
  for (const p of pages) assert.match(p.html, /<button[^>]*data-theme-toggle[^>]*aria-label="Switch to (dark|light) theme"/, p.path);
});
