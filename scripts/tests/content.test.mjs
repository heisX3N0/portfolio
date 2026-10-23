// Content schemas and helpers (SPEC 9.2). Negative cases first: each rule must refuse the content it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { roleSchema, workSchema, experienceSchema, writingGroupSchema } from '../../src/lib/schemas.ts';
import { cvTodo } from '../../src/lib/cv.ts';
import { findRoleLinks, readRoles } from '../lib/checks.mjs';

const proof = (n) => Array.from({ length: n }, (_, i) => ({ figure: `F${i}`, text: 'text' }));
const step = { step: 'Discover', line: 'Stakeholder interviews' };
const role = (over = {}) => ({
  slug: 'business-analyst',
  published: true,
  title: 'Business Analyst',
  positioning: 'p',
  supporting: 's',
  proofStrip: proof(5),
  howIWork: [step, step, step, step, step],
  tools: 'Jira',
  featuredWork: ['closa-cbn-compliance'],
  cvFile: '/cv/business-analyst.pdf',
  contactLine: 'c',
  ...over,
});

test('a proof strip with more than 5 items fails the schema', () => {
  assert.equal(roleSchema.safeParse(role({ proofStrip: proof(6) })).success, false);
  assert.equal(roleSchema.safeParse(role({ proofStrip: [] })).success, false);
});

test('"How I work" needs 4 to 6 steps', () => {
  assert.equal(roleSchema.safeParse(role({ howIWork: [step, step, step] })).success, false);
  assert.equal(roleSchema.safeParse(role({ howIWork: Array(7).fill(step) })).success, false);
});

test('a published role missing its page content fails; an unpublished one needs only slug and published', () => {
  const { title, ...noTitle } = role();
  assert.equal(roleSchema.safeParse(noTitle).success, false);
  assert.equal(roleSchema.safeParse({ slug: 'project-manager', published: false }).success, true);
  assert.equal(roleSchema.safeParse({ slug: 'project-manager' }).success, false);
});

test('a role slug that is not a plain path segment, or that takes a site path, fails', () => {
  for (const slug of ['Business Analyst', 'work', 'about', 'cv', 'styleguide', 'a/b']) {
    assert.equal(roleSchema.safeParse(role({ slug })).success, false, slug);
  }
});

test('a role CV outside /cv/ or not a PDF fails', () => {
  assert.equal(roleSchema.safeParse(role({ cvFile: '/files/cv.pdf' })).success, false);
  assert.equal(roleSchema.safeParse(role({ cvFile: '/cv/business-analyst.docx' })).success, false);
});

test('a case study with an unknown tag or role fails', () => {
  const work = {
    title: 't', slug: 's', summary: 's', role: 'r', organisation: 'o', period: 'p',
    tags: ['Banking'], roles: ['business-analyst'], order: 1, draft: false,
  };
  assert.equal(workSchema.safeParse(work).success, true);
  assert.equal(workSchema.safeParse({ ...work, tags: ['Fintech'] }).success, false);
  assert.equal(workSchema.safeParse({ ...work, tags: [] }).success, false);
  assert.equal(workSchema.safeParse({ ...work, roles: ['designer'] }).success, false);
});

test('a timeline entry needs 2 to 3 highlights', () => {
  const entry = { id: 'x', role: 'r', organisation: 'o', dates: 'Mar 2024 to Present', highlights: ['a', 'b'] };
  assert.equal(experienceSchema.safeParse(entry).success, true);
  assert.equal(experienceSchema.safeParse({ ...entry, highlights: ['a'] }).success, false);
  assert.equal(experienceSchema.safeParse({ ...entry, highlights: ['a', 'b', 'c', 'd'] }).success, false);
});

test('a writing post with a bad URL or date fails', () => {
  const group = { id: 'g', title: 'g', seriesUrl: 'https://x.test/s', posts: [{ title: 't', description: 'd', date: '2026-05-30', url: 'https://x.test/p' }] };
  assert.equal(writingGroupSchema.safeParse(group).success, true);
  assert.equal(writingGroupSchema.safeParse({ ...group, posts: [{ ...group.posts[0], url: 'xmusings/p' }] }).success, false);
  assert.equal(writingGroupSchema.safeParse({ ...group, posts: [{ ...group.posts[0], date: 'soon' }] }).success, false);
});

test('a missing CV file gives a TODO(owner) marker; a present one gives none', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-cv-'));
  assert.match(cvTodo(dir, '/cv/business-analyst.pdf') ?? '', /^TODO\(owner\): add .*public\/cv\/business-analyst\.pdf/);
  mkdirSync(join(dir, 'cv'));
  writeFileSync(join(dir, 'cv', 'business-analyst.pdf'), '%PDF-1.7');
  assert.equal(cvTodo(dir, '/cv/business-analyst.pdf'), undefined);
});

test('role files are read as published only when published is true, comments allowed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-roles-'));
  writeFileSync(join(dir, 'a.md'), '---\r\nslug: a\r\npublished: true # live\r\n---\r\n');
  writeFileSync(join(dir, 'b.md'), '---\nslug: b\npublished: false\n---\n');
  writeFileSync(join(dir, 'c.md'), '---\nslug: c\npublished: trueish\n---\n');
  assert.deepEqual(readRoles(dir).map((r) => [r.slug, r.published]), [['a', true], ['b', false], ['c', false]]);
});

test('role link check catches a link to another role page, in any form', () => {
  const others = ['project-manager', 'product-manager'];
  assert.deepEqual(findRoleLinks('<a href="/project-manager/">PM</a>', others), ['/project-manager/']);
  assert.deepEqual(findRoleLinks('<a href="/product-manager">x</a>', others), ['/product-manager']);
  assert.deepEqual(findRoleLinks('<a href="https://boluwatife.olapade.site/project-manager/#work">x</a>', others), ['https://boluwatife.olapade.site/project-manager/#work']);
  assert.deepEqual(findRoleLinks('<a href="/about/">About</a><a href="/work/project-x/">x</a><a href="/cv/business-analyst.pdf">CV</a>', others), []);
});
