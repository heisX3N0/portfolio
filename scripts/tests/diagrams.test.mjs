// Build-time diagram layout (SPEC 7). Negative cases first: the layout check must catch the faults it exists for.
// Then every diagram in src/content/work/ is laid out at both widths and must pass it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { layoutProblems, layouts, walkthrough, wrap, textWidth, NARROW, WIDE } from '../../src/lib/diagrams.ts';

const box = (x, y, w, h, text = 'Box') => ({ x, y, w, h, cls: 'd-box', lines: [{ text, x: x + 12, y: y + 20, cls: 'd-label' }] });

test('layout check fails text wider than its box', () => {
  const layout = { width: 300, height: 100, boxes: [box(0, 0, 60, 40, 'A label far too long for this box')], paths: [], labels: [] };
  assert.match(layoutProblems(layout).join(), /wider than its box/);
});

test('layout check fails overlapping boxes and boxes off the canvas', () => {
  const overlap = { width: 300, height: 100, boxes: [box(0, 0, 100, 40), box(50, 20, 100, 40)], paths: [], labels: [] };
  assert.match(layoutProblems(overlap).join(), /overlap/);
  const off = { width: 300, height: 100, boxes: [box(250, 0, 100, 40)], paths: [], labels: [] };
  assert.match(layoutProblems(off).join(), /outside the canvas/);
});

test('layout check passes a clean layout', () => {
  assert.deepEqual(layoutProblems({ width: 300, height: 100, boxes: [box(0, 0, 100, 40), box(120, 0, 100, 40)], paths: [], labels: [] }), []);
});

test('wrap keeps every line within the width unless a single word is longer', () => {
  const lines = wrap('Parse the posting and screen for deal-breakers', 120, 16);
  assert.ok(lines.length > 1);
  for (const l of lines) assert.ok(textWidth(l, 16) <= 120 || !l.includes(' '), l);
  assert.equal(lines.join(' '), 'Parse the posting and screen for deal-breakers');
});

// Every diagram artefact in the case study files.
const workDir = fileURLToPath(new URL('../../src/content/work/', import.meta.url));
const diagrams = readdirSync(workDir)
  .filter((f) => f.endsWith('.md'))
  .flatMap((f) => {
    const front = parse(readFileSync(join(workDir, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    return (front.artefacts ?? []).filter((a) => a.kind !== 'table').map((a) => ({ file: f, artefact: a }));
  });

test('the case studies have diagrams to check', () => {
  assert.ok(diagrams.length >= 4, `${diagrams.length} diagrams`);
});

for (const { file, artefact } of diagrams) {
  test(`${file} ${artefact.id}: fits at both widths, narrow no wider than ${NARROW}`, () => {
    const { wide, narrow } = layouts(artefact);
    for (const [name, list] of [['wide', wide], ['narrow', narrow]]) {
      for (const l of list) assert.deepEqual(layoutProblems(l), [], `${name}: ${layoutProblems(l).join('; ')}`);
    }
    for (const l of narrow) assert.ok(l.width <= NARROW, `narrow is ${l.width}`);
    for (const l of wide) assert.ok(l.width <= WIDE, `wide is ${l.width}`);
  });

  test(`${file} ${artefact.id}: every label is drawn and walked through in the text alternative`, () => {
    const words = (s) => s.replace(/\s+/g, ' ').trim();
    const said = words(walkthrough(artefact).flatMap((g) => [g.title ?? '', ...g.items]).join(' '));
    const labels =
      artefact.kind === 'decision'
        ? [...artefact.checks.flatMap((c) => [c.question, c.yes]), artefact.otherwise]
        : artefact.kind === 'swimlane'
          ? artefact.states.flatMap((s) => [s.title, ...s.steps.map((x) => x.label)])
          : artefact.steps.map((s) => s.label);
    for (const list of Object.values(layouts(artefact))) {
      const drawn = words(list.flatMap((l) => [...l.boxes.flatMap((b) => b.lines), ...l.labels]).map((x) => x.text).join(' '));
      for (const label of labels) assert.ok(drawn.includes(words(label)), `not drawn: ${label}`);
    }
    for (const label of labels) assert.ok(said.includes(words(label)), `not in the text alternative: ${label}`);
  });
}
