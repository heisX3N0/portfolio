// P4 (SPEC 9.3 to 9.5): sharing tags, JSON-LD, robots.txt, OG images, security headers, analytics and the
// figures check, run against the built site: `pnpm build` first. Negative cases first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'yaml';
import { listHtmlFiles, pagePath, visibleText, readRoles } from '../lib/checks.mjs';
import { approvedFigures, findUnapprovedNumbers } from '../lib/figures.mjs';
import { parseHeaders, parseCsp, findCspProblems } from '../lib/headers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = join(root, 'dist');
const SITE = 'https://boluwatife.olapade.site';
const pages = existsSync(join(dist, 'index.html')) ? listHtmlFiles(dist).map((f) => ({ path: pagePath(dist, f), html: readFileSync(f, 'utf8') })) : [];
const page = (path) => pages.find((p) => p.path === path);
const roles = readRoles(join(root, 'src/content/roles'));
const published = roles.filter((r) => r.published).map((r) => r.slug);
const isRole = (path) => published.some((slug) => path === `/${slug}/`);
const isStudy = (path) => /^\/work\/[^/]+\/$/.test(path);
// Attribute and text values decoded, so &#39; and ' compare equal.
const decode = (s) => (s === undefined ? s : visibleText(s).trim());
const meta = (html, key) => decode(html.match(new RegExp(`<meta (?:property|name)="${key.replace(/[.:]/g, '\\$&')}" content="([^"]*)"`))?.[1]);
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const site = parse(readFileSync(join(root, 'src/content/site.yaml'), 'utf8')).site;

test('the site is built', () => assert.ok(pages.length > 0, 'dist/ missing: run pnpm build first'));

// Figures (SPEC 9.4). /styleguide/ is exempt: it shows hex codes and contrast ratios (CLAUDE.md).
test('figures check: every number on every page except /styleguide/ is in SPEC 6.2', () => {
  const approved = approvedFigures(readFileSync(join(root, 'SPEC.md'), 'utf8'));
  for (const p of pages) {
    if (p.path === '/styleguide/') continue;
    assert.deepEqual(findUnapprovedNumbers(visibleText(p.html), approved), [], p.path);
    // Text people read in search results and link previews, though not on the page itself.
    const shared = [meta(p.html, 'description'), meta(p.html, 'og:image:alt'), ...jsonLd(p.html).flatMap((d) => [d.headline, d.description, d.jobTitle])];
    assert.deepEqual(findUnapprovedNumbers(shared.filter(Boolean).join(' . '), approved), [], `${p.path}: meta or JSON-LD`);
  }
});

// OG images (SPEC 10 phase 4): one per published role page, one site-wide image for every other page (owner decision 2026-10-23).
test('no OG image is built for an unpublished role', () => {
  for (const r of roles.filter((r) => !r.published)) assert.ok(!existsSync(join(dist, 'og', `${r.slug}.png`)), r.slug);
});

test('the 404 page has no sharing URL and no JSON-LD', () => {
  const html = page('/404')?.html ?? '';
  assert.ok(html, '404 not built');
  assert.equal(meta(html, 'og:url'), undefined);
  assert.deepEqual(jsonLd(html), []);
});

test('only a role page uses its role OG image; every other page uses the site image', () => {
  for (const p of pages.filter((p) => p.path !== '/404')) {
    const image = meta(p.html, 'og:image');
    const role = published.find((slug) => p.path === `/${slug}/`);
    assert.equal(image, `${SITE}/og/${role ?? 'site'}.png`, p.path);
  }
});

test('every OG image is a 1200x630 PNG under 150 KB', () => {
  for (const name of [...published, 'site']) {
    const file = join(dist, 'og', `${name}.png`);
    assert.ok(existsSync(file), `${name}.png missing`);
    const png = readFileSync(file);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', name);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], name);
    assert.ok(statSync(file).size < 150_000, `${name}.png is ${statSync(file).size} bytes`);
  }
});

test('every page with a canonical URL has Open Graph and Twitter card tags that match it', () => {
  for (const p of pages.filter((p) => p.path !== '/404')) {
    const title = decode(p.html.match(/<title>([^<]+)<\/title>/)?.[1]);
    const description = meta(p.html, 'description');
    assert.equal(meta(p.html, 'og:url'), `${SITE}${p.path}`, p.path);
    // A case study shares its title without the name (owner decision 2026-10-23); every other page its page title.
    assert.equal(meta(p.html, 'og:title'), isStudy(p.path) ? title.replace(` | ${site.name}`, '') : title, p.path);
    assert.equal(meta(p.html, 'og:description'), description, p.path);
    assert.equal(meta(p.html, 'og:type'), isStudy(p.path) ? 'article' : 'website', p.path);
    assert.equal(meta(p.html, 'og:site_name'), site.name, p.path);
    assert.equal(meta(p.html, 'og:locale'), 'en_GB', p.path);
    assert.equal(meta(p.html, 'og:image:width'), '1200', p.path);
    assert.equal(meta(p.html, 'og:image:height'), '630', p.path);
    assert.ok(meta(p.html, 'og:image:alt'), `${p.path}: og:image:alt`);
    assert.equal(meta(p.html, 'twitter:card'), 'summary_large_image', p.path);
  }
});

// P4.5: search results and link previews cut titles at about 60 characters (opengraph.xyz check, 2026-10-23).
test('no page shares an og:title over 60 characters', () => {
  for (const p of pages.filter((p) => p.path !== '/404')) {
    const ogTitle = meta(p.html, 'og:title');
    assert.ok(ogTitle.length <= 60, `${p.path}: og:title is ${ogTitle.length} characters ("${ogTitle}")`);
  }
});

test('a case study keeps the name in its page title and shares its own title (the h1) as og:title', () => {
  for (const p of pages.filter((p) => isStudy(p.path))) {
    const h1 = decode(p.html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]);
    assert.equal(decode(p.html.match(/<title>([^<]+)<\/title>/)?.[1]), `${h1} | ${site.name}`, p.path);
    assert.equal(meta(p.html, 'og:title'), h1, p.path);
  }
});

test('the BA page: short title and description in search and sharing, the full CV title in the hero, image alt and JSON-LD', () => {
  const html = page('/business-analyst/')?.html ?? '';
  const cvTitle = 'Business Analyst | AI & Digital Solutions | CBAP | PSPO II';
  const short = 'I turn regulatory deadlines, tangled processes and AI ideas into requirements that banks and product teams can build.';
  assert.equal(decode(html.match(/<title>([^<]+)<\/title>/)?.[1]), `${site.name} | Business Analyst`);
  assert.equal(meta(html, 'og:title'), `${site.name} | Business Analyst`);
  assert.equal(meta(html, 'description'), short);
  assert.equal(meta(html, 'og:description'), short);
  // Refused: the short title anywhere the CV title must appear.
  assert.equal(decode(html.match(/<p class="hero__title"[^>]*>([^<]+)<\/p>/)?.[1]), cvTitle, 'hero');
  assert.equal(meta(html, 'og:image:alt'), `${site.name} | ${cvTitle}`, 'og:image:alt');
  assert.equal(jsonLd(html)[0]?.jobTitle, cvTitle, 'JSON-LD jobTitle');
});

// JSON-LD (SPEC 9.3): Person on the root page, each role page and About; Article on each case study; nowhere else.
test('JSON-LD appears only where SPEC 9.3 puts it, and every block parses', () => {
  for (const p of pages) {
    const types = jsonLd(p.html).map((d) => d['@type']);
    const person = p.path === '/' || p.path === '/about/' || isRole(p.path);
    assert.deepEqual(types, person ? ['Person'] : isStudy(p.path) ? ['Article'] : [], p.path);
  }
});

test('Person JSON-LD: name, LinkedIn, CBAP and PSPO II, both universities; jobTitle only on role pages', () => {
  for (const p of pages.filter((p) => p.path === '/' || p.path === '/about/' || isRole(p.path))) {
    const [person] = jsonLd(p.html);
    assert.equal(person['@context'], 'https://schema.org', p.path);
    assert.equal(person.name, site.name, p.path);
    assert.equal(person.url, `${SITE}/`, p.path);
    assert.deepEqual(person.sameAs, [site.linkedin], p.path);
    assert.deepEqual(person.hasCredential.map((c) => c.name), ['Certified Business Analysis Professional (CBAP)', 'Professional Scrum Product Owner II (PSPO II)'], p.path);
    for (const c of person.hasCredential) assert.match(c.url, /^https:\/\//, p.path);
    assert.deepEqual(person.alumniOf.map((a) => a.name).sort(), ['Babcock University', 'University of Ibadan'], p.path);
    assert.ok(!JSON.stringify(person).includes('telephone'), `${p.path}: telephone`);
    if (!isRole(p.path)) assert.equal(person.jobTitle, undefined, `${p.path}: a role-neutral page has no jobTitle`);
  }
  // The role page's title, which must match that role's CV (SPEC 9.2).
  assert.equal(jsonLd(page('/business-analyst/')?.html ?? '')[0]?.jobTitle, 'Business Analyst | AI & Digital Solutions | CBAP | PSPO II');
});

test('Article JSON-LD on each case study: its title, summary, author and URL', () => {
  const studies = pages.filter((p) => isStudy(p.path));
  assert.ok(studies.length >= 6, 'case studies not built');
  for (const p of studies) {
    const [article] = jsonLd(p.html);
    assert.equal(article.headline, decode(p.html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]), p.path);
    assert.equal(article.description, meta(p.html, 'description'), p.path);
    assert.equal(article.url, `${SITE}${p.path}`, p.path);
    assert.equal(article.author?.name, site.name, p.path);
    assert.equal(article.image, `${SITE}/og/site.png`, p.path);
  }
});

test('robots.txt allows everything and points at the sitemap', () => {
  const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /Disallow:\s*\S/i);
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${SITE}/sitemap-index\\.xml$`, 'm'));
});

// Security headers (SPEC 9.5), from the _headers file Cloudflare Pages serves.
const rules = existsSync(join(dist, '_headers')) ? parseHeaders(readFileSync(join(dist, '_headers'), 'utf8')) : [];
const all = rules.find((r) => r.pattern === '/*')?.headers ?? {};

test('every page passes its CSP: inline scripts hashed, no inline styles, no third-party loads but the beacon', () => {
  const csp = parseCsp(all['content-security-policy'] ?? '');
  assert.ok(csp.size > 0, 'no Content-Security-Policy on /*');
  for (const p of pages) assert.deepEqual(findCspProblems(p.html, csp), [], p.path);
  const scriptHosts = (csp.get('script-src') ?? []).filter((s) => s.startsWith('https:'));
  assert.deepEqual(scriptHosts, ['https://static.cloudflareinsights.com'], 'the analytics host is the only third party');
  assert.deepEqual(csp.get('connect-src'), ["'self'", 'https://cloudflareinsights.com']);
  for (const [directive, value] of [['default-src', ["'self'"]], ['object-src', ["'none'"]], ['base-uri', ["'self'"]], ['frame-ancestors', ["'none'"]], ['form-action', ["'none'"]]]) {
    assert.deepEqual(csp.get(directive), value, directive);
  }
});

test('every page gets HSTS, nosniff, the referrer policy, a permissions policy and frame denial', () => {
  assert.match(all['strict-transport-security'] ?? '', /^max-age=(\d+)/);
  assert.ok(Number(all['strict-transport-security'].match(/max-age=(\d+)/)[1]) >= 31536000, 'HSTS under a year');
  assert.equal(all['x-content-type-options'], 'nosniff');
  assert.equal(all['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.equal(all['x-frame-options'], 'DENY');
  for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
    assert.match(all['permissions-policy'] ?? '', new RegExp(`\\b${feature}=\\(\\)`), feature);
  }
});

test('CVs stay out of search results, open without the page CSP, and fonts stay cached', () => {
  const cv = rules.find((r) => r.pattern === '/cv/*')?.headers ?? {};
  assert.equal(cv['x-robots-tag'], 'noindex');
  assert.equal(cv['content-security-policy'], null, 'the page CSP is not removed for PDFs');
  assert.match(rules.find((r) => r.pattern === '/fonts/*')?.headers['cache-control'] ?? '', /immutable/);
});

// Cloudflare Web Analytics (SPEC 9.1): cookieless, one beacon per page once the owner's token is in site.yaml.
test('the analytics beacon is on every page exactly once when a token is set, and nowhere when it is not', () => {
  const beacon = /<script defer src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js" data-cf-beacon="([^"]+)"><\/script>/g;
  for (const p of pages) {
    const found = [...p.html.matchAll(beacon)];
    assert.equal(found.length, site.analyticsToken ? 1 : 0, p.path);
    if (site.analyticsToken) assert.deepEqual(JSON.parse(found[0][1].replace(/&quot;/g, '"')), { token: site.analyticsToken }, p.path);
  }
});
