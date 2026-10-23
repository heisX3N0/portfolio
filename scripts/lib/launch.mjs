// The post-launch check (P5, SPEC 10 phase 5 and 11): what only exists once the domain is connected. HTTPS, the
// http:// redirect, the security headers as served, every sitemap URL answering 200 on the domain with its own
// canonical and no noindex, and the pages.dev copy pointing its canonical at the domain. `fetch` is a parameter so
// the tests can send the live addresses to a local server serving a broken copy.
import { sitemapUrls } from './checks.mjs';

export const DOMAIN = 'https://boluwatife.olapade.site';
export const MIRROR = 'https://boluwatife-portfolio.pages.dev';

const REDIRECTS = new Set([301, 302, 307, 308]);
// A request that gets no answer in this time is a failure, so the check always finishes.
const TIMEOUT_MS = 15_000;
const canonicalOf = (html) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
// Every robots meta tag, including crawler-specific ones such as googlebot.
const robotsMeta = (html) => [...html.matchAll(/<meta name="(?:robots|googlebot|bingbot)" content="([^"]*)"/gi)].map((m) => m[1]).join(',');
// A URL from the server (a Location header, a sitemap loc), or null when it is not one.
const toUrl = (value, base) => {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
};

/**
 * `expected`: the headers every page must carry, as in the `/*` rule of public/_headers (lower-case names).
 * Returns every failure as a readable line (empty when the launch is good) and the number of requests made.
 */
export async function launchCheck({ site = DOMAIN, mirror = MIRROR, canonical = DOMAIN, expected, fetch = globalThis.fetch }) {
  const failures = [];
  let requests = 0;
  const get = async (url, init = {}) => {
    requests++;
    try {
      return await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
    } catch (error) {
      failures.push(`${url}: request failed (${error.cause?.message ?? error.message}): no HTTPS certificate, no DNS or no answer?`);
      return null;
    }
  };

  const base = new URL(site);
  if (base.protocol !== 'https:') failures.push(`${site}: not HTTPS`);
  else {
    const http = new URL('/', site);
    http.protocol = 'http:';
    const res = await get(http.href);
    const location = res?.headers.get('location');
    const to = location ? toUrl(location, http) : null;
    if (res && !(REDIRECTS.has(res.status) && to?.protocol === 'https:' && to.host === base.host)) {
      failures.push(`${http.href} does not redirect to https:// (status ${res.status}, Location ${location ?? 'missing'})`);
    }
  }

  // Every page in the sitemap, as its path on the site under test.
  const paths = [];
  const index = await get(new URL('/sitemap-index.xml', site).href);
  if (index && index.status !== 200) failures.push(`/sitemap-index.xml: status ${index.status}`);
  else if (index) {
    for (const loc of sitemapUrls(await index.text())) {
      const url = toUrl(loc);
      if (!url) {
        failures.push(`sitemap-index.xml: loc is not a URL: ${loc}`);
        continue;
      }
      const sitemap = await get(new URL(url.pathname, site).href);
      if (sitemap && sitemap.status !== 200) failures.push(`${loc}: status ${sitemap.status}`);
      else if (sitemap) {
        for (const page of sitemapUrls(await sitemap.text())) {
          const pageUrl = toUrl(page);
          if (!pageUrl) failures.push(`${loc}: loc is not a URL: ${page}`);
          else if (!page.startsWith(`${canonical}/`)) failures.push(`sitemap URL not on ${canonical}: ${page}`);
          else paths.push(pageUrl.pathname);
        }
      }
    }
    if (!paths.length) failures.push('the sitemap lists no pages');
  }

  for (const path of paths) {
    const res = await get(new URL(path, site).href);
    if (!res) continue;
    if (res.status !== 200) {
      failures.push(`${path}: status ${res.status}`);
      continue;
    }
    for (const [name, value] of Object.entries(expected)) {
      if (value === null) continue;
      const served = res.headers.get(name);
      if (served === null) failures.push(`${path}: missing ${name}`);
      else if (served !== value) failures.push(`${path}: ${name} differs from public/_headers: ${served}`);
    }
    if (/noindex/i.test(res.headers.get('x-robots-tag') ?? '')) failures.push(`${path}: X-Robots-Tag noindex`);
    const html = await res.text();
    if (/noindex/i.test(robotsMeta(html))) failures.push(`${path}: robots meta noindex`);
    const href = canonicalOf(html);
    if (href !== `${canonical}${path}`) failures.push(`${path}: canonical is ${href ?? 'missing'}, not ${canonical}${path}`);
  }

  // The pages.dev copy keeps serving (owner decision 2026-10-23); its canonical sends search engines to the domain.
  const copy = await get(new URL('/', mirror).href);
  if (copy && copy.status !== 200) failures.push(`${mirror}/: status ${copy.status}`);
  else if (copy) {
    const href = canonicalOf(await copy.text());
    if (href !== `${canonical}/`) failures.push(`${mirror}/: canonical is ${href ?? 'missing'}, not ${canonical}/`);
  }

  return { failures, requests };
}
