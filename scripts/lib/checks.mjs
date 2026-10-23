// Checks run against the built site in dist/. Pure functions so tests can feed them bad input.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Internal paths the link check skips because a later backlog item builds them. Empty since P3 built /work/.
export const PENDING_PATHS = [];

export function listHtmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listHtmlFiles(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

// The URL path a built file is served at, for messages.
export function pagePath(distDir, file) {
  const rel = relative(distDir, file).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
}

// Internal href and src values (root-relative or same-page), without fragment or query.
export function internalLinks(html) {
  const links = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    links.push(url.split('#')[0].split('?')[0]);
  }
  return links;
}

// True when the path resolves to a file in dist the way a static host serves it.
export function resolves(distDir, path) {
  const clean = decodeURIComponent(path).replace(/^\//, '');
  const isFile = (p) => existsSync(join(distDir, p)) && statSync(join(distDir, p)).isFile();
  if (clean === '' || clean.endsWith('/')) return isFile(join(clean, 'index.html'));
  return isFile(clean) || isFile(clean + '.html') || isFile(join(clean, 'index.html'));
}

export function findBrokenLinks(distDir, pending = PENDING_PATHS) {
  const broken = [];
  for (const file of listHtmlFiles(distDir)) {
    for (const link of internalLinks(readFileSync(file, 'utf8'))) {
      if (pending.includes(link)) continue;
      if (!resolves(distDir, link)) broken.push(`${pagePath(distDir, file)} -> ${link}`);
    }
  }
  return broken;
}

const NAMED = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", mdash: '—', ndash: '–', minus: '−', hellip: '…' };

// Text a visitor can read, including SVG <text> in diagrams: tags, scripts, styles and comments removed, entities decoded.
export function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ');
}

// Nigerian phone numbers in local (0803...) or international (+234 / 234) form, with optional spaces or dashes.
const PHONE = /(?:\+?234|\b0)[\s-]?[789][01]\d(?:[\s-]?\d){7}\b/;
export function findPhoneNumbers(html) {
  const hits = [];
  const text = html.replace(/\s+/g, ' ');
  const m = text.match(PHONE);
  if (m) hits.push(m[0]);
  if (/href="(?:tel|sms):/i.test(html)) hits.push('tel: or sms: link');
  if (/wa\.me\/|api\.whatsapp\.com/i.test(html)) hits.push('WhatsApp link');
  return hits;
}

// Em and en dashes are banned in visible text (owner decision 2026-10-23).
export function findDashes(html) {
  const text = visibleText(html);
  const hits = [];
  for (const m of text.matchAll(/.{0,20}[–—].{0,20}/g)) hits.push(m[0].trim());
  return hits;
}

// Links to any of the given role pages (SPEC 2.4: role pages never link to each other), root-relative or absolute.
export function findRoleLinks(html, slugs) {
  const hits = [];
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    let path;
    try {
      path = new URL(m[1], 'https://boluwatife.olapade.site/').pathname;
    } catch {
      continue;
    }
    if (slugs.some((slug) => path === `/${slug}` || path.startsWith(`/${slug}/`))) hits.push(m[1]);
  }
  return hits;
}

// Slug and published flag of each role content file (src/content/roles/*.md), read from its frontmatter.
export function readRoles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const front = readFileSync(join(dir, name), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const slug = front.match(/^slug:\s*['"]?([^'"\s]+)/m)?.[1];
      if (!slug) throw new Error(`${name}: no slug in frontmatter`);
      return { file: name, slug, published: /^published:\s*true\b/m.test(front) };
    });
}

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// Same-page links (href="#id") whose id is not on the page. A bare "#" is ignored.
export function findMissingFragments(html) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const missing = new Set();
  for (const m of html.matchAll(/\shref="#([^"]+)"/g)) if (!ids.has(m[1])) missing.add(`#${m[1]}`);
  return [...missing];
}

// Words that describe Performance Buddy as live, launched or piloted (SPEC 5.2: it is in progress).
const LIVE = /\b(?:live|launch(?:ed|es)?|pilot(?:ed|ing|s)?|rolled out|in production)\b/gi;
export function findLiveClaims(text) {
  return [...text.matchAll(LIVE)].map((m) => m[0].toLowerCase());
}

// The aggregator's projected figures (SPEC 5.4) must share a sentence with the word "projected".
const PROJECTED = ['2M+', '₦100M+'];
export function findUnlabelledProjections(text) {
  const hits = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (/projected/i.test(sentence)) continue;
    for (const figure of PROJECTED) if (sentence.includes(figure)) hits.push(figure);
  }
  return hits;
}
