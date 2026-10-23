// P5: the post-launch check (scripts/launch-check.mjs), run here against a local server serving the built site as
// Cloudflare would, through a fetch that sends the domain, its http:// address and the pages.dev copy to that server.
// Each negative case serves a broken copy and must fail. `pnpm build` first. Negative cases first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHeaders } from '../lib/headers.mjs';
import { launchCheck, DOMAIN, MIRROR } from '../lib/launch.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/ missing: run pnpm build first');
const pageHeaders = parseHeaders(readFileSync(join(root, 'public/_headers'), 'utf8')).find((r) => r.pattern === '/*').headers;
const TYPES = { '.html': 'text/html; charset=utf-8', '.xml': 'application/xml' };

// What the broken copy gets wrong; empty for a good copy.
let broken = {};
let server;
let origin;

before(async () => {
  server = createServer((req, res) => {
    const as = req.headers['x-test-as'];
    const path = new URL(req.url, 'http://x').pathname;
    if (as === 'http' && !broken.noRedirect) {
      res.writeHead(308, broken.noLocation ? {} : { Location: `${DOMAIN}${path}` }).end();
      return;
    }
    if (broken.badLoc && path === '/sitemap-0.xml') {
      res.writeHead(200, { 'Content-Type': 'application/xml' }).end('<urlset><url><loc>not a url</loc></url></urlset>');
      return;
    }
    let file = join(dist, path.endsWith('/') ? `${path}index.html` : path);
    if (path === broken.missing || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    let body = readFileSync(file, 'utf8');
    if (extname(file) === '.html') {
      if (path === broken.noindex) body = body.replace('<head>', '<head><meta name="robots" content="noindex">');
      if (path === broken.googlebot) body = body.replace('<head>', '<head><meta name="googlebot" content="noindex">');
      if (as === 'mirror' && broken.mirrorCanonical) body = body.replaceAll(`href="${DOMAIN}/`, `href="${MIRROR}/`);
      if (path === broken.canonical) body = body.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${DOMAIN}/">`);
    }
    const headers = { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' };
    for (const [name, value] of Object.entries(pageHeaders)) if (value !== null && name !== broken.dropHeader) headers[name] = value;
    if (path === broken.robotsHeader) headers['X-Robots-Tag'] = 'noindex';
    res.writeHead(200, headers).end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

// The live addresses, sent to the local server. A copy without HTTPS fails the way a missing certificate does.
async function localFetch(url, init = {}) {
  const u = new URL(url);
  let as;
  if (u.origin === DOMAIN) as = 'domain';
  else if (u.origin === DOMAIN.replace('https:', 'http:')) as = 'http';
  else if (u.origin === MIRROR) as = 'mirror';
  else throw new Error(`unexpected request to ${url}`);
  if (broken.noHttps && u.protocol === 'https:' && as === 'domain') throw new TypeError('fetch failed', { cause: new Error('no certificate') });
  return fetch(`${origin}${u.pathname}`, { ...init, headers: { ...init.headers, 'x-test-as': as } });
}

const check = async (copy) => {
  broken = copy;
  return (await launchCheck({ expected: pageHeaders, fetch: localFetch })).failures;
};
const fails = (failures, pattern) => assert.ok(failures.some((f) => pattern.test(f)), `expected a failure matching ${pattern}, got ${JSON.stringify(failures)}`);

test('refused: the domain serves without HTTPS', async () => {
  fails(await check({ noHttps: true }), /HTTPS|request failed/);
});

test('refused: the site is given as an http:// address', async () => {
  broken = {};
  const { failures } = await launchCheck({ site: DOMAIN.replace('https:', 'http:'), expected: pageHeaders, fetch: localFetch });
  fails(failures, /not HTTPS/);
});

test('refused: http:// does not redirect to https://', async () => {
  fails(await check({ noRedirect: true }), /does not redirect to https/);
});

for (const name of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy']) {
  test(`refused: ${name} is missing as served`, async () => {
    fails(await check({ dropHeader: name }), new RegExp(`missing ${name}`, 'i'));
  });
}

test('refused: a sitemap URL is not 200', async () => {
  fails(await check({ missing: '/about/' }), /\/about\/.*404/);
});

test('refused: a page has a noindex meta tag', async () => {
  fails(await check({ noindex: '/work/' }), /\/work\/.*noindex/);
});

test('refused: http:// answers a redirect with no Location, reported rather than crashing', async () => {
  fails(await check({ noLocation: true }), /does not redirect to https/);
});

test('refused: a sitemap loc that is not a URL, reported rather than crashing', async () => {
  fails(await check({ badLoc: true }), /not a url/);
});

test('refused: a page has a googlebot noindex meta tag', async () => {
  fails(await check({ googlebot: '/about/' }), /\/about\/.*noindex/);
});

test('refused: a page is served with X-Robots-Tag noindex', async () => {
  fails(await check({ robotsHeader: '/business-analyst/' }), /\/business-analyst\/.*noindex/);
});

test('refused: a page canonical is not its own URL on the domain', async () => {
  fails(await check({ canonical: '/about/' }), /\/about\/.*canonical/);
});

test('refused: the pages.dev copy has a canonical that is not the domain', async () => {
  fails(await check({ mirrorCanonical: true }), /pages\.dev.*canonical/);
});

test('happy path: a good copy of the built site passes', async () => {
  broken = {};
  const { failures, requests } = await launchCheck({ expected: pageHeaders, fetch: localFetch });
  assert.deepEqual(failures, []);
  // The Cost line in BACKLOG P5 estimates about 20 requests per run.
  assert.ok(requests > 10 && requests <= 25, `${requests} requests`);
});
