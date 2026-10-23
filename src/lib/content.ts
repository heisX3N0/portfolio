import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { PublishedRole } from './schemas';
import { cvTodo } from './cv';

/** Roles with published: true. Unpublished roles are never built, linked or listed (SPEC 3). */
export async function getPublishedRoles(): Promise<PublishedRole[]> {
  const roles = await getCollection('roles');
  return roles.flatMap((r) => (r.data.published ? [r.data] : [])).sort((a, b) => a.slug.localeCompare(b.slug));
}

export type Work = CollectionEntry<'work'>['data'];

/** Every case study by slug, drafts included. */
export async function getWork(): Promise<Map<string, Work>> {
  const work = await getCollection('work');
  return new Map(work.map((w) => [w.data.slug, w.data]));
}

/** Drafts are left out of production builds (SPEC 9.2). */
export const isPublished = (w: Work) => !(import.meta.env.PROD && w.draft);

/** Published case study entries in display order (`order`): /work/ and each case study's previous and next links share it. */
export async function getPublishedWorkEntries(): Promise<CollectionEntry<'work'>[]> {
  return (await getCollection('work')).filter((e) => isPublished(e.data)).sort((a, b) => a.data.order - b.data.order);
}

export async function getPublishedWork(): Promise<Work[]> {
  return (await getPublishedWorkEntries()).map((e) => e.data);
}

/** The published case studies for these slugs, in that order. A slug with no case study at all fails the build. */
export function pick(work: Map<string, Work>, slugs: string[], where: string): Work[] {
  return slugs.flatMap((slug) => {
    const item = work.get(slug);
    if (!item) throw new Error(`${where}: no case study "${slug}" in src/content/work/`);
    return isPublished(item) ? [item] : [];
  });
}

/** A YAML list collection in file order (see src/content.config.ts). */
export async function getOrdered<C extends 'experience' | 'certifications' | 'writing'>(name: C): Promise<CollectionEntry<C>['data'][]> {
  const entries: { data: { position: number } }[] = await getCollection(name);
  return entries.map((e) => e.data).sort((a, b) => a.position - b.position) as CollectionEntry<C>['data'][];
}

export const workHref = (slug: string) => `/work/${slug}/`;

// Astro builds from the project root; import.meta.url points into the build's own bundle, so it can't be used here.
const publicDir = join(process.cwd(), 'public');
const reported = new Set<string>();

/** The TODO(owner) marker for a missing CV, also printed once in the build output (the build report, SPEC 10). */
export function missingCv(cvFile: string): string | undefined {
  const todo = cvTodo(publicDir, cvFile);
  if (todo && !reported.has(cvFile)) {
    reported.add(cvFile);
    console.warn(`[build report] ${todo}`);
  }
  return todo;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "30 May 2026", as in SPEC 4.1 item 5. */
export const formatDate = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
