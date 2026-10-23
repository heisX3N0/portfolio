// Runs against the built site: `pnpm build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { listHtmlFiles, pagePath, findBrokenLinks, findPhoneNumbers, findDashes, findMissingFragments, sitemapUrls, findRoleLinks, readRoles, visibleText, findLiveClaims, findUnlabelledProjections, PENDING_PATHS } from '../lib/checks.mjs';

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

// P2: role pages, root and About (SPEC 3, 4.0, 4.1, 4.4). Negative cases first.
const roles = readRoles(fileURLToPath(new URL('../../src/content/roles/', import.meta.url)));
const page = (path) => pages.find((p) => p.path === path);
const allSitemapUrls = () =>
  sitemapUrls(readFileSync(join(dist, 'sitemap-index.xml'), 'utf8')).flatMap((u) => sitemapUrls(readFileSync(join(dist, new URL(u).pathname), 'utf8')));
// The HTML of the element that opens with `open`, up to its matching close tag (same tag name, nesting counted).
function element(html, open) {
  const start = html.search(open);
  if (start < 0) return '';
  const tag = html.slice(start + 1).match(/^[a-z0-9]+/)[0];
  const re = new RegExp(`<(/?)${tag}\\b`, 'g');
  re.lastIndex = start;
  let depth = 0;
  for (const m of html.matchAll(re)) {
    if (m.index < start) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, html.indexOf('>', m.index) + 1);
  }
  return html.slice(start);
}
const workSlugs = (html) => [...html.matchAll(/href="\/work\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);

test('a role with published: false is not built, linked or in the sitemap', () => {
  const hidden = roles.filter((r) => !r.published);
  assert.ok(hidden.length > 0, 'expected the unpublished PM and Product role files (SPEC 9.2)');
  const urls = allSitemapUrls();
  for (const r of hidden) {
    assert.ok(!existsSync(join(dist, r.slug)), `${r.slug} was built`);
    for (const p of pages) assert.deepEqual(findRoleLinks(p.html, [r.slug]), [], `${p.path} links to ${r.slug}`);
    assert.ok(!urls.some((u) => new URL(u).pathname.startsWith(`/${r.slug}`)), `${r.slug} is in the sitemap`);
  }
});

test('role pages never link to another role page', () => {
  const live = roles.filter((x) => x.published);
  assert.ok(live.length > 0, 'no published role');
  for (const r of live) {
    const p = page(`/${r.slug}/`);
    assert.ok(p, `/${r.slug}/ not built`);
    const others = roles.filter((x) => x.slug !== r.slug).map((x) => x.slug);
    assert.deepEqual(findRoleLinks(p.html, others), [], r.slug);
  }
});

test('no TODO(owner) marker for the BA CV, and the CV is a PDF out of the sitemap', () => {
  assert.doesNotMatch(page('/business-analyst/')?.html ?? 'TODO(owner)', /TODO\(owner\)/);
  const cv = join(dist, 'cv', 'business-analyst.pdf');
  assert.ok(existsSync(cv), 'CV missing from dist');
  assert.equal(readFileSync(cv).subarray(0, 5).toString(), '%PDF-');
  assert.ok(!allSitemapUrls().some((u) => u.includes('/cv/')), 'CV in the sitemap');
});

test('root page: name, root line, one card per published role, 3 selected works, no proof strip', () => {
  const html = page('/').html;
  assert.match(html, /<h1[^>]*>Boluwatife Olapade<\/h1>/);
  assert.match(html, /I work where business, delivery and product meet\./);
  for (const r of roles) assert.equal(new RegExp(`href="/${r.slug}/"`).test(html), r.published, `${r.slug} card`);
  assert.deepEqual(workSlugs(element(html, /<section[^>]*id="selected-work"/)), [
    'aimery-ai-requirements',
    'closa-cbn-compliance',
    'merge-x-requirements-from-failure',
  ]);
  assert.doesNotMatch(html, /data-proof-strip/);
});

test('BA page: CV title, five proof items in order, six featured cards in order', () => {
  const html = page('/business-analyst/')?.html ?? '';
  assert.match(html, /Business Analyst \| AI &amp; Digital Solutions \| CBAP \| PSPO II/);
  assert.doesNotMatch(visibleText(html), /Product Manager/);
  const figures = [...html.matchAll(/class="proof__figure"[^>]*>([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(figures, ['4 weeks', '₦268.36M', '10,000+', 'Live', 'CBAP']);
  assert.deepEqual(workSlugs(element(html, /<section[^>]*id="work"/)), [
    'closa-cbn-compliance',
    'performance-buddy-access-control',
    'aimery-ai-requirements',
    'merge-x-requirements-from-failure',
    'aggregator-onboarding-redesign',
    'gpt-investor-discovery',
  ]);
  assert.match(html, /href="#work"[^>]*>View my work/);
  assert.match(html, /href="\/cv\/business-analyst\.pdf"[^>]*data-download-cv/);
});

test('BA page: "How I work" is an HTML list of 5 steps with one example line each, then the tools line', () => {
  const html = page('/business-analyst/')?.html ?? '';
  const flow = element(html, /<ol[^>]*class="flow"/);
  assert.equal((flow.match(/<li\b/g) || []).length, 5);
  assert.doesNotMatch(flow, /<svg/);
  assert.equal((flow.match(/class="flow__example"/g) || []).length, 5);
  assert.match(visibleText(html), /Tools: Jira, Confluence, Azure DevOps, Linear, Draw\.io, Lucidchart, Miro, Mixpanel, SQL, Gemini, Claude\./);
});

test('BA page: writing shows at most 3 posts per group, newest first, each group ending with More on Substack', () => {
  const html = page('/business-analyst/')?.html ?? '';
  const groups = [...html.matchAll(/<div[^>]*class="writing__group"/g)].map((m) => element(html.slice(m.index), /<div/));
  assert.equal(groups.length, 2);
  for (const g of groups) {
    const dates = [...g.matchAll(/<time datetime="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(dates.length >= 1 && dates.length <= 3, `${dates.length} posts`);
    assert.deepEqual([...dates].sort().reverse(), dates, 'not newest first');
    assert.match(g, /href="https:\/\/xmusings\.substack\.com\/"[^>]*>More on Substack/);
  }
  assert.match(html, /href="https:\/\/xmusings\.substack\.com\/p\/rebuilding-the-engine-for-retail"/);
  assert.doesNotMatch(html, /side-quest-2/);
});

test('BA page ends with its contact line', () => {
  assert.match(page('/business-analyst/')?.html ?? '', /<section id="contact"[\s\S]*Hiring for a BA or AI BA role\? I(&#39;|')d like to hear about it\./);
});

test('About: timeline titles and dates as on the CV, certifications linked, education, how built, full writing list', () => {
  const html = page('/about/')?.html ?? '';
  const text = visibleText(html);
  for (const [role, dates] of [
    ['Business Analyst & Project Manager, Financial Inclusion', 'Mar 2024 to Present'],
    ['Business Analyst, Partnerships & Digital Capabilities', 'Jun 2023 to Feb 2024'],
    ['Curator / Product Manager', 'Sep 2022 to May 2023'],
    ['Founder, Product & BA Lead: Aimery', 'Sep 2026 to Present'],
    ['Founder, Product & BA Lead: Merge X', 'Oct 2026 to Present'],
    ['Product Lead: GPT Investor', 'Mar 2024 to Present'],
  ]) {
    assert.ok(text.includes(role), role);
    assert.ok(text.slice(text.indexOf(role), text.indexOf(role) + 200).includes(dates), `${role}: ${dates}`);
  }
  const at = (s) => text.indexOf(s);
  const timeline = ['Financial Inclusion', 'Partnerships & Digital', 'Curator / Product Manager', 'BA Lead: Aimery', 'BA Lead: Merge X', 'Product Lead: GPT Investor'].map(at);
  assert.deepEqual([...timeline].sort((x, y) => x - y), timeline, 'timeline not in experience.yaml order');
  const certs = ['(CBAP)', '(PSPO II)', 'Prompt Design in Vertex AI', 'ITIL 4 (training)'].map(at);
  assert.deepEqual([...certs].sort((x, y) => x - y), certs, 'certifications not in certifications.yaml order');
  for (const badge of ['badges.iiba.org/5710c675', 'credly.com/badges/16628871', 'udacity.com/certificate/e/ce684c50']) assert.ok(html.includes(badge), badge);
  assert.match(text, /ITIL 4 \(training\)/);
  assert.match(text, /MBA, Strategic Management, Babcock University \(expected 2027\)/);
  assert.match(text, /BSc, University of Ibadan \(2021\)/);
  assert.match(html, /id="how-this-site-was-built"/);
  assert.match(html, /href="https:\/\/github\.com\/heisX3N0\/portfolio"/);
  assert.match(html, /href="https:\/\/github\.com\/heisX3N0\/portfolio\/blob\/main\/SPEC\.md"/);
  assert.equal((html.match(/<time datetime=/g) || []).length, 7, 'full writing list');
});

// P3: case studies (SPEC 4.2, 4.3, 5 and 7). Negative cases first.
const STUDIES = [
  'closa-cbn-compliance',
  'performance-buddy-access-control',
  'aimery-ai-requirements',
  'merge-x-requirements-from-failure',
  'aggregator-onboarding-redesign',
  'gpt-investor-discovery',
];
const study = (slug) => page(`/work/${slug}/`)?.html ?? '';
const article = (html) => element(html, /<article[^>]*class="[^"]*\bcase\b/);
const cards = (html) => [...html.matchAll(/<article class="card[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);

test('Performance Buddy is never described as live, launched or piloted, on any page', () => {
  assert.ok(study('performance-buddy-access-control'), 'Performance Buddy page not built');
  // The previous and next links name other case studies ("From CBN circular to live limits"), so they don't count.
  const own = article(study('performance-buddy-access-control')).replace(/<nav\b[\s\S]*?<\/nav>/g, ' ');
  assert.deepEqual(findLiveClaims(visibleText(own)), []);
  for (const p of pages) {
    for (const card of cards(p.html)) {
      if (card.includes('/work/performance-buddy-access-control/')) assert.deepEqual(findLiveClaims(visibleText(card)), [], p.path);
    }
  }
});

test('projected aggregator figures are labelled as projected on every page', () => {
  assert.match(visibleText(study('aggregator-onboarding-redesign')), /2M\+/, 'aggregator page has no projection');
  for (const p of pages) assert.deepEqual(findUnlabelledProjections(visibleText(p.html)), [], p.path);
});

test('Performance Buddy shows no internal detail: fictional placeholders only, no email address', () => {
  const text = visibleText(article(study('performance-buddy-access-control')));
  assert.match(text, /Region A/);
  assert.match(text, /Branch 001/);
  assert.deepEqual([...text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((m) => m[0]), []);
});

test('tables are never inside a role="img" wrapper, which hides them from screen readers', () => {
  for (const p of pages) {
    for (const m of p.html.matchAll(/<[a-z]+[^>]*role="img"/g)) assert.doesNotMatch(element(p.html.slice(m.index), /</), /<table\b/, p.path);
  }
});

test('every case study has an artefact; each diagram has a caption and a text alternative, each table a caption and th scope', () => {
  for (const slug of STUDIES) {
    const html = article(study(slug));
    assert.ok(html, `${slug} not built`);
    const diagrams = [...html.matchAll(/<div[^>]*role="img"[^>]*>/g)].map((m) => m[0]);
    const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/g)].map((m) => m[0]);
    assert.ok(diagrams.length + tables.length >= 1, `${slug}: no artefact`);
    for (const d of diagrams) {
      const labelled = d.match(/aria-labelledby="([^"]+)"/)?.[1];
      const described = d.match(/aria-describedby="([^"]+)"/)?.[1];
      assert.ok(labelled && described, `${slug}: ${d}`);
      assert.match(html, new RegExp(`<figcaption[^>]*id="${labelled}"`), `${slug}: caption`);
      assert.ok(visibleText(element(html, new RegExp(`<[a-z]+[^>]*id="${described}"`))).trim().length > 40, `${slug}: empty text alternative`);
    }
    for (const t of tables) {
      assert.match(t, /<caption\b/, `${slug}: table caption`);
      assert.match(t, /<th scope="col"/, `${slug}: column headers`);
      assert.match(t, /<th scope="row"/, `${slug}: row headers`);
    }
  }
});

test('sanitised artefacts carry their label (SPEC 5 and 7)', () => {
  for (const [slug, label] of [
    ['closa-cbn-compliance', /Illustrative, simplified\./],
    ['performance-buddy-access-control', /Illustrative/],
    ['aggregator-onboarding-redesign', /Simplified\./],
    ['merge-x-requirements-from-failure', /Simplified\./],
  ]) {
    assert.match(visibleText(article(study(slug))), label, slug);
  }
});

test('each case study follows the template, in order (SPEC 4.3)', () => {
  const want = ['At a glance', 'Context', 'The problem', 'What I did', 'Artefacts', 'Outcome', 'What I learned'];
  for (const slug of STUDIES) {
    const html = article(study(slug));
    const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => visibleText(m[1]).trim());
    assert.deepEqual(h2.filter((h) => want.includes(h)), want, `${slug}: ${h2}`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${slug}: h1`);
    assert.match(html, /class="case__outcome"/, `${slug}: one-line outcome`);
    assert.match(html, /<dl class="case__meta"/, `${slug}: metadata row`);
    const learned = element(html, /<section[^>]*aria-labelledby="learned-heading"/);
    const bullets = (learned.match(/<li\b/g) || []).length;
    assert.ok(bullets >= 2 && bullets <= 3, `${slug}: ${bullets} learned bullets`);
  }
});

test('case study prose is 450 to 900 words, artefacts and navigation not counted (SPEC 4.3 target: 600 to 900)', () => {
  for (const slug of STUDIES) {
    const prose = article(study(slug))
      .replace(/<figure\b[\s\S]*?<\/figure>/g, ' ')
      .replace(/<nav\b[\s\S]*?<\/nav>/g, ' ');
    const words = visibleText(prose).split(' ').filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(words >= 450 && words <= 900, `${slug}: ${words} words`);
  }
});

test('previous and next follow the case study order, with Back to all work', () => {
  for (const [i, slug] of STUDIES.entries()) {
    const nav = element(study(slug), /<nav[^>]*aria-label="More case studies"/);
    assert.ok(nav, `${slug}: no case study navigation`);
    assert.match(nav, /href="\/work\/"[^>]*>Back to all work/, slug);
    assert.deepEqual(workSlugs(nav), [STUDIES[i - 1], STUDIES[i + 1]].filter(Boolean), slug);
  }
});

test('the GPT Investor case study ends with its further reading (SPEC 5.5)', () => {
  const text = visibleText(article(study('gpt-investor-discovery')));
  assert.match(text, /The Problem with Retail Investing/);
  assert.match(text, /Introducing Top Picks/);
});

test('/work/ lists every case study in order, with All, Banking and AI products filters that are plain links', () => {
  const html = page('/work/')?.html ?? '';
  assert.ok(html, '/work/ not built');
  assert.deepEqual(workSlugs(element(html, /<ul[^>]*class="card-grid/)), STUDIES);
  const chips = element(html, /<nav[^>]*aria-label="Filter case studies"/);
  for (const [href, name] of [['#all', 'All'], ['#banking', 'Banking'], ['#ai-products', 'AI products']]) {
    assert.match(chips, new RegExp(`href="${href}"[^>]*>${name}<`), name);
  }
  assert.doesNotMatch(html, /<script[^>]*\ssrc=/, 'filtering must not need a script file');
});

test('every case study card carries an artefact thumbnail', () => {
  for (const p of pages.filter((x) => x.path !== '/styleguide/')) {
    for (const card of cards(p.html)) {
      if (/href="\/work\//.test(card)) assert.match(card, /class="card__thumb"[\s\S]*<svg/, p.path);
    }
  }
});

test('no case study page is pending any more, and all are in the sitemap', () => {
  assert.deepEqual(PENDING_PATHS, []);
  const work = allSitemapUrls().map((u) => new URL(u).pathname).filter((p) => p.startsWith('/work/')).sort();
  assert.deepEqual(work, ['/work/', ...STUDIES.map((s) => `/work/${s}/`)].sort());
});
