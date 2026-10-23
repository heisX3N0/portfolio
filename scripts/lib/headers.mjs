// Security headers (SPEC 9.5): Cloudflare Pages' _headers file and the Content-Security-Policy in it, checked
// against what the built pages actually load. Pure functions so tests can feed them bad input.
import { createHash } from 'node:crypto';

// The _headers format: a URL pattern on its own line, then indented "Name: value" lines. "! Name" removes a header.
export function parseHeaders(text) {
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: {} });
      continue;
    }
    const rule = rules.at(-1);
    if (!rule) throw new Error(`_headers: header before any URL pattern: ${line.trim()}`);
    const removed = line.trim().match(/^!\s*(\S+)$/);
    const m = line.trim().match(/^([^:]+):\s*(.*)$/);
    if (removed) rule.headers[removed[1].toLowerCase()] = null;
    else if (m) rule.headers[m[1].trim().toLowerCase()] = m[2];
  }
  return rules;
}

export function parseCsp(value) {
  const csp = new Map();
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) csp.set(name.toLowerCase(), sources);
  }
  return csp;
}

const sources = (csp, directive) => csp.get(directive) ?? csp.get('default-src') ?? [];

// Inline scripts the browser runs, with line endings normalised to LF as the HTML parser does before hashing.
// JSON-LD and other data blocks are not run, so CSP does not apply to them.
export function inlineScripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\ssrc=/i.test(attrs))
    .filter(([, attrs]) => {
      const type = attrs.match(/\stype="([^"]*)"/i)?.[1]?.toLowerCase();
      return !type || type === 'module' || type === 'text/javascript';
    })
    .map(([, , body]) => body.replace(/\r\n?/g, '\n'));
}

export const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

// Allowed when the source list has the URL's origin, or 'self' for a same-origin URL (relative or root-relative).
const SELF = 'https://self.invalid';
function allows(list, url) {
  if (url.startsWith('data:')) return list.includes('data:');
  const { origin } = new URL(url, `${SELF}/page/`);
  if (origin === SELF) return list.includes("'self'");
  return list.some((s) => s === origin || s === `${origin}/`);
}

// Everything on the page the policy would block, as readable messages. Empty when the page loads cleanly.
export function findCspProblems(html, csp) {
  const problems = [];
  const scriptSrc = sources(csp, 'script-src');
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'http:']) {
    if (scriptSrc.includes(bad)) problems.push(`script-src allows ${bad}`);
  }
  for (const body of inlineScripts(html)) {
    const hash = sha256(body);
    if (!scriptSrc.includes(hash)) problems.push(`inline script not in script-src: ${hash}`);
  }
  const styleSrc = sources(csp, 'style-src');
  if (!styleSrc.includes("'unsafe-inline'")) {
    if (/<style\b/i.test(html)) problems.push('inline <style> block');
    if (/<[a-z][^>]*\sstyle=["']/i.test(html)) problems.push('inline style attribute');
  }
  const loads = [
    ['script-src', /<script\b[^>]*\ssrc="([^"]+)"/gi],
    ['style-src', /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<link\b[^>]*href="([^"]+)"[^>]*rel="stylesheet"/gi],
    ['font-src', /<link\b[^>]*as="font"[^>]*href="([^"]+)"|<link\b[^>]*href="([^"]+)"[^>]*as="font"/gi],
    ['img-src', /<img\b[^>]*\ssrc="([^"]+)"/gi],
  ];
  for (const [directive, pattern] of loads) {
    for (const m of html.matchAll(pattern)) {
      const url = m[1] ?? m[2];
      if (!allows(sources(csp, directive), url)) problems.push(`${directive} blocks ${url}`);
    }
  }
  return problems;
}
