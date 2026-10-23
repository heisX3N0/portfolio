// Post-launch check (P5), run by hand against the live site, never in CI (README "Launch check"):
//   node scripts/launch-check.mjs [--site https://boluwatife.olapade.site] [--mirror https://boluwatife-portfolio.pages.dev]
// 14 requests per run against the live site (2026-10-23). Exits 1 and lists every failure; the checks are in scripts/lib/launch.mjs.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { parseHeaders } from './lib/headers.mjs';
import { launchCheck, DOMAIN, MIRROR } from './lib/launch.mjs';

const { values } = parseArgs({ options: { site: { type: 'string', default: DOMAIN }, mirror: { type: 'string', default: MIRROR } } });
const rules = parseHeaders(readFileSync(new URL('../public/_headers', import.meta.url), 'utf8'));
const expected = rules.find((r) => r.pattern === '/*').headers;

const { failures, requests } = await launchCheck({ site: values.site, mirror: values.mirror, expected });
console.log(`Launch check: ${values.site} (copy: ${values.mirror}), ${requests} requests`);
if (failures.length) {
  for (const failure of failures) console.log(`  FAIL ${failure}`);
  console.log(`${failures.length} failure(s)`);
  process.exitCode = 1;
} else {
  console.log('  OK: HTTPS, http:// redirect, headers, sitemap pages, canonicals, no noindex, pages.dev canonical');
}
