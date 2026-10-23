// Content schemas and helpers (SPEC 9.2). Negative cases first: each rule must refuse the content it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { roleSchema, workSchema, experienceSchema, writingGroupSchema } from '../../src/lib/schemas.ts';
import { cvTodo } from '../../src/lib/cv.ts';
import { linkParts } from '../../src/lib/links.ts';
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
  const work = study();
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

// P3: case study pages (SPEC 4.3, 5 and 7). Negative cases first.
// Function declarations are hoisted, so the P2 case study test above can use them too.
function tableArtefact() {
  return { kind: 'table', id: 'trace', caption: 'Traceability', label: 'Illustrative, simplified', columns: ['Clause', 'Rule'], rows: [['A', 'B']] };
}
function study(over = {}) {
  return {
    title: 't', slug: 's', summary: 's', role: 'r', organisation: 'o', period: 'p',
    tags: ['Banking'], roles: ['business-analyst'], order: 1, draft: false,
    glance: { problem: 'p', role: 'r', produced: 'p', outcome: 'o' },
    outcome: ['o'],
    learned: ['a', 'b'],
    artefacts: [tableArtefact()],
    ...over,
  };
}
const table = tableArtefact();
const ok = (over) => workSchema.safeParse(study(over)).success;

test('a case study with no artefact fails (SPEC 4.3 item 6)', () => {
  assert.equal(ok({ artefacts: [] }), false);
  const { artefacts, ...none } = study();
  assert.equal(workSchema.safeParse(none).success, false);
});

test('an artefact with no caption, or an unknown label or kind, fails (SPEC 7)', () => {
  const { caption, ...noCaption } = table;
  assert.equal(ok({ artefacts: [noCaption] }), false);
  assert.equal(ok({ artefacts: [{ ...table, label: 'Real data' }] }), false);
  assert.equal(ok({ artefacts: [{ ...table, kind: 'image' }] }), false);
});

test('a table row that does not match its columns fails', () => {
  assert.equal(ok({ artefacts: [{ ...table, rows: [['A']] }] }), false);
  assert.equal(ok({ artefacts: [{ ...table, rows: [['A', 'B', 'C']] }] }), false);
  assert.equal(ok({ artefacts: [{ ...table, rows: [] }] }), false);
});

test('two artefacts with the same id fail (their ids label the figure)', () => {
  assert.equal(ok({ artefacts: [table, table] }), false);
});

test('"What I learned" needs 2 to 3 bullets, and At a glance all four items (SPEC 4.3)', () => {
  assert.equal(ok({ learned: ['a'] }), false);
  assert.equal(ok({ learned: ['a', 'b', 'c', 'd'] }), false);
  assert.equal(ok({ glance: { problem: 'p', role: 'r', outcome: 'o' } }), false);
});

test('a swimlane step in a lane that is not listed, or a state outside 5 to 7 steps, fails (SPEC 5.4)', () => {
  const steps = (n, lane = 'Bank') => Array.from({ length: n }, (_, i) => ({ lane, label: `Step ${i}` }));
  const swim = (states) => ({ kind: 'swimlane', id: 'lanes', caption: 'c', label: 'Simplified', lanes: ['Agent', 'Bank'], states });
  assert.equal(ok({ artefacts: [swim([{ title: 'Now', steps: steps(5, 'Platform') }])] }), false);
  assert.equal(ok({ artefacts: [swim([{ title: 'Now', steps: steps(4) }])] }), false);
  assert.equal(ok({ artefacts: [swim([{ title: 'Now', steps: steps(8) }])] }), false);
  assert.equal(ok({ artefacts: [swim([{ title: 'Now', steps: steps(5) }])] }), true);
});

test('a flow needs 2 to 7 steps and a decision at least one check and an otherwise', () => {
  const flow = (n) => ({ kind: 'flow', id: 'f', caption: 'c', steps: Array.from({ length: n }, () => ({ label: 'x' })) });
  assert.equal(ok({ artefacts: [flow(1)] }), false);
  assert.equal(ok({ artefacts: [flow(8)] }), false);
  assert.equal(ok({ artefacts: [flow(4)] }), true);
  const decision = { kind: 'decision', id: 'd', caption: 'c', checks: [{ question: 'q', yes: 'y' }], otherwise: 'none' };
  assert.equal(ok({ artefacts: [{ ...decision, checks: [] }] }), false);
  const { otherwise, ...noOtherwise } = decision;
  assert.equal(ok({ artefacts: [noOtherwise] }), false);
  assert.equal(ok({ artefacts: [decision] }), true);
});

test('a further reading link that is not a URL fails', () => {
  assert.equal(ok({ furtherReading: [{ title: 't', url: 'substack/post' }] }), false);
  assert.equal(ok({ furtherReading: [{ title: 't', url: 'https://xmusings.substack.com/p/x' }] }), true);
});

test('a link URL keeps its balanced parentheses', () => {
  assert.deepEqual(linkParts('[wiki](https://en.wikipedia.org/wiki/Agent_banking_(Nigeria)).'), [
    { text: 'wiki', href: 'https://en.wikipedia.org/wiki/Agent_banking_(Nigeria)' },
    { text: '.' },
  ]);
});

test('only https links in a content field become links; other brackets stay text', () => {
  assert.deepEqual(linkParts('See [x](javascript:alert(1)) and [y](http://a.test).'), [{ text: 'See [x](javascript:alert(1)) and [y](http://a.test).' }]);
  assert.deepEqual(linkParts('Live at [the demo](https://aimery.versionphi.com), free.'), [
    { text: 'Live at ' },
    { text: 'the demo', href: 'https://aimery.versionphi.com' },
    { text: ', free.' },
  ]);
});
