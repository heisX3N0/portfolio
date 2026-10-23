// Negative cases first: each checker must catch the problem it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findBrokenLinks, findPhoneNumbers, findDashes, findMissingFragments, sitemapUrls, findLiveClaims, findUnlabelledProjections } from '../lib/checks.mjs';
import { approvedFigures, findUnapprovedNumbers } from '../lib/figures.mjs';
import { parseHeaders, parseCsp, findCspProblems, sha256 } from '../lib/headers.mjs';

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
  // Lighthouse visits must never be reported to Cloudflare Web Analytics as traffic (P4).
  for (const file of ['lighthouserc.json', 'lighthouserc.desktop.json']) {
    const config = JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
    assert.deepEqual(config.ci.collect.settings?.blockedUrlPatterns, ['*cloudflareinsights.com/cdn-cgi/rum*'], file);
  }
});

// P3 (SPEC 5.2, 5.4 and 11): Performance Buddy is never described as live, and projected aggregator figures are labelled.
test('live check catches Performance Buddy described as live, launched or piloted', () => {
  assert.deepEqual(findLiveClaims('The dashboard went live in March.'), ['live']);
  assert.deepEqual(findLiveClaims('It launched to all regions.'), ['launched']);
  assert.deepEqual(findLiveClaims('Now in pilot with two teams.'), ['pilot']);
  assert.deepEqual(findLiveClaims('It was piloted, then rolled out.'), ['piloted', 'rolled out']);
  assert.deepEqual(findLiveClaims('Deliver a single, testable access model. The project is in progress.'), []);
});

test('projection check fails projected aggregator figures that are not labelled as projected', () => {
  assert.deepEqual(findUnlabelledProjections('The portal will handle 2M+ transactions and ₦100M+ revenue in year one.'), ['2M+', '₦100M+']);
  assert.deepEqual(findUnlabelledProjections('Projected: 2M+ transactions. Revenue reached ₦100M+ in year one.'), ['₦100M+']);
  assert.deepEqual(findUnlabelledProjections('99.9% uptime. Projected for year one: 2M+ transactions and ₦100M+ revenue.'), []);
  assert.deepEqual(findUnlabelledProjections('2M+ transactions (projected)'), []);
});

// P4 (SPEC 9.4): the figures check. Negative cases first.
const SPEC_62 = `### 6.2 Approved figures (the only numbers allowed on the site)

| Figure | Where it's used |
|---|---|
| ₦268.36M deposits, 2,210 savings accounts, 6 months | Beta 2.0 (proof strip) |
| Scores 76–79; 147 merged PRs | Aimery |
| 2M+ transactions; 99.9% uptime; 9x growth; $0 running cost | Other |

### 6.3 Next section
| 999 | not approved |
`;

test('figures check fails numbers that are not in SPEC 6.2', () => {
  const approved = approvedFigures(SPEC_62);
  assert.deepEqual(findUnapprovedNumbers('Grew deposits to ₦300M in 6 months.', approved), ['₦300M']);
  assert.deepEqual(findUnapprovedNumbers('A 50% lift and 3,000+ users in 12 weeks.', approved), ['50%', '3,000+', '12']);
  assert.deepEqual(findUnapprovedNumbers('Scores 76 to 81.', approved), ['81']);
  // The same digits with a different unit or sign are a different figure.
  assert.deepEqual(findUnapprovedNumbers('268.36M deposits, 2M transactions, ₦0 cost, 99.9 uptime', approved), ['268.36M', '2M', '₦0', '99.9']);
  // Rows after Section 6.2 are not approved; a number shaped like a year but written as a count is not exempt.
  assert.deepEqual(findUnapprovedNumbers('999 accounts and 2,500 agents', approved), ['999', '2,500']);
  assert.deepEqual(findUnapprovedNumbers('2025% growth', approved), ['2025%']);
  // Units in lower case or more than one letter are part of the figure, not a reason to skip it.
  assert.deepEqual(findUnapprovedNumbers('100k downloads and ₦5bn in deposits', approved), ['100k', '₦5bn']);
  // A count that looks like a year is only a year next to a month or in brackets.
  assert.deepEqual(findUnapprovedNumbers('onboarded 2050 agents and 1999 accounts', approved), ['2050', '1999']);
});

test('figures check allows SPEC 6.2 figures, ranges written with "to", years, dates and sequence labels', () => {
  const approved = approvedFigures(SPEC_62);
  for (const ok of [
    '₦268.36M deposits and 2,210 savings accounts in 6 months (Beta 2.0).',
    'Scores 76 to 79 across 147 merged PRs.',
    'Projected 2M+ transactions, 99.9% uptime, 9x growth, $0 running cost.',
    'Mar 2024 to Present. BSc (2021). MBA (expected 2027). Last updated October 2026. 6 Oct 2025, 20 June 2025.',
    'Promoted in 2026. Period 2024 to Present. Period 2026. From 2023 to 2024.',
    'Side Quest 3, Phase 1, Step 4, Branch 001, Pi360 and n8n.',
  ]) assert.deepEqual(findUnapprovedNumbers(ok, approved), [], ok);
});

test('figures allow-list fails loudly when SPEC 6.2 is missing or empty', () => {
  assert.throws(() => approvedFigures('# Spec\n\n### 6.1 Experience\n'), /no Section 6\.2/);
  assert.throws(() => approvedFigures('### 6.2 Approved figures\n\n| Figure | Where |\n|---|---|\n\n### 6.3 X\n'), /no rows/);
});

// P4 (SPEC 9.5): the CSP must allow what the pages load and nothing more. Negative cases first.
const POLICY = parseCsp("default-src 'self'; script-src 'self' 'sha256-abc=' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self'; font-src 'self'");

test('CSP check fails an inline script whose hash is not in script-src', () => {
  const html = '<script>document.documentElement.dataset.theme = "dark";</script>';
  assert.deepEqual(findCspProblems(html, POLICY), [`inline script not in script-src: ${sha256('document.documentElement.dataset.theme = "dark";')}`]);
  const allowed = parseCsp(`script-src 'self' ${sha256('x()')}; style-src 'self'`);
  assert.deepEqual(findCspProblems('<script>x()</script>', allowed), []);
  assert.deepEqual(findCspProblems('<script>x() </script>', allowed).length, 1, 'one changed byte must fail');
  // Browsers hash the script after turning CRLF into LF, so a hash taken over CRLF bytes must not pass.
  const crlf = parseCsp(`script-src ${sha256('a()\r\nb()')}`);
  assert.equal(findCspProblems('<script>a()\r\nb()</script>', crlf).length, 1, 'hash over CRLF bytes');
  assert.deepEqual(findCspProblems('<script>a()\r\nb()</script>', parseCsp(`script-src ${sha256('a()\nb()')}`)), []);
});

test('CSP check fails unsafe script sources, inline styles and third-party loads', () => {
  assert.deepEqual(findCspProblems('', parseCsp("script-src 'self' 'unsafe-inline' 'unsafe-eval'")), ["script-src allows 'unsafe-inline'", "script-src allows 'unsafe-eval'"]);
  assert.deepEqual(findCspProblems('<style>p{}</style>', POLICY), ['inline <style> block']);
  assert.deepEqual(findCspProblems('<span style="color:red"></span>', POLICY), ['inline style attribute']);
  assert.deepEqual(findCspProblems('<script src="https://www.googletagmanager.com/gtag/js"></script>', POLICY), ['script-src blocks https://www.googletagmanager.com/gtag/js']);
  assert.deepEqual(findCspProblems('<link rel="stylesheet" href="https://fonts.googleapis.com/css">', POLICY), ['style-src blocks https://fonts.googleapis.com/css']);
  assert.deepEqual(findCspProblems('<img src="https://example.com/a.png" alt="">', POLICY), ['img-src blocks https://example.com/a.png']);
  // Protocol-relative and relative URLs are reported, never a crash; single-quoted style attributes count too.
  assert.deepEqual(findCspProblems('<script src="//cdn.example.com/x.js"></script>', POLICY), ['script-src blocks //cdn.example.com/x.js']);
  assert.deepEqual(findCspProblems('<img src="og/site.png" alt="">', POLICY), []);
  assert.deepEqual(findCspProblems("<p style='color:red'>x</p>", POLICY), ['inline style attribute']);
});

test('CSP check passes own files, the analytics beacon and JSON-LD', () => {
  const html = [
    '<script src="/_astro/page.js" type="module"></script>',
    '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token":"x"}\'></script>',
    '<script type="application/ld+json">{"@type":"Person"}</script>',
    '<link rel="stylesheet" href="/_astro/base.css"><link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>',
  ].join('');
  assert.deepEqual(findCspProblems(html, POLICY), []);
});

test('_headers parser reads rules, headers and comments', () => {
  const rules = parseHeaders('# comment\n/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src \'self\'\n\n/cv/*\n  ! Content-Security-Policy\n  X-Robots-Tag: noindex\n');
  assert.deepEqual(rules, [
    { pattern: '/*', headers: { 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'self'" } },
    { pattern: '/cv/*', headers: { 'content-security-policy': null, 'x-robots-tag': 'noindex' } },
  ]);
  assert.throws(() => parseHeaders('  X-Frame-Options: DENY\n'), /before any URL pattern/);
});
