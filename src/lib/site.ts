import { execSync } from 'node:child_process';
import { getEntry } from 'astro:content';

export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('src/content/site.yaml must have a top-level "site" key');
  return entry.data;
}

// "Last updated" in the footer: the last commit date, or the build date if git history is missing.
let lastUpdated: string | undefined;
export function getLastUpdated(): string {
  if (lastUpdated) return lastUpdated;
  let date = new Date();
  try {
    const iso = execSync('git log -1 --format=%cI', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (iso) date = new Date(iso);
  } catch {
    // no git in the build environment: fall back to the build date
  }
  lastUpdated = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
  return lastUpdated;
}
