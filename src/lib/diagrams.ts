// Build-time diagram layout (SPEC 7). Each diagram artefact gets a wide layout (a row, or lanes) and a narrow one
// (a column) from the same data; the page shows one or the other by the figure's width, so no diagram scrolls
// sideways. Pure functions of the artefact data, so the tests can check every layout without a browser, and the
// browser test checks the real text against its boxes. Kept free of astro:content for the Node tests.
import type { DiagramArtefact } from './schemas';

/** Canvas widths in SVG units. The page draws them at most 1:1, so these are also their largest size in pixels. */
export const WIDE = 760;
export const NARROW = 300;

export interface Line {
  text: string;
  x: number;
  y: number;
  cls: string;
  size?: number;
  bold?: boolean;
  anchor?: 'start' | 'middle';
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  cls: string;
  lines: Line[];
}
export interface Layout {
  width: number;
  height: number;
  /** Lane bands: drawn behind the boxes, not checked for overlap. */
  bands?: { x: number; y: number; w: number; h: number; cls: string }[];
  boxes: Box[];
  paths: { d: string; cls: string }[];
  /** Text outside boxes: arrow labels and state titles. */
  labels: Line[];
}

const PAD_X = 10;
const PAD_Y = 10;
// The outermost boxes sit this far in from the canvas edge so their 1.5px stroke isn't cut off.
const EDGE = 2;
const TEXT = { label: { size: 14, lh: 19 }, note: { size: 12, lh: 17 }, lane: { size: 12, lh: 16 } };

// Advance widths as a share of the font size, close to Inter's (checked in the browser test, which measures the real text).
function charWidth(c: string): number {
  if (c === ' ') return 0.28;
  if (/[iljtfr.,;:'!|()]/.test(c)) return 0.32;
  if (/[mwMW]/.test(c)) return 0.86;
  if (/[A-Z]/.test(c)) return 0.68;
  if (/[0-9₦]/.test(c)) return 0.6;
  return 0.55;
}

export function textWidth(text: string, size: number, bold = false): number {
  let w = 0;
  for (const c of text) w += charWidth(c);
  return w * size * (bold ? 1.06 : 1);
}

/** Words in lines no wider than `width`. A word longer than the width gets a line of its own. */
export function wrap(text: string, width: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, bold) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

interface Part {
  text: string;
  cls: string;
  style: { size: number; lh: number };
  bold?: boolean;
}

/** A box of width w with its text wrapped and centred, at (x, y). Pass `h` to make it taller and centre the text. */
function makeBox(x: number, y: number, w: number, parts: Part[], cls: string, h?: number): Box {
  const rows = parts.flatMap((p) => wrap(p.text, w - 2 * PAD_X, p.style.size, p.bold).map((text) => ({ text, p })));
  const textH = rows.reduce((sum, r) => sum + r.p.style.lh, 0);
  const height = Math.max(h ?? 0, textH + 2 * PAD_Y);
  let top = y + (height - textH) / 2;
  const lines = rows.map(({ text, p }) => {
    // Baseline at the line's centre plus 0.35em: Inter's x-height sits about there.
    const line: Line = { text, x: x + w / 2, y: round(top + p.style.lh / 2 + p.style.size * 0.35), cls: p.cls, size: p.style.size, bold: p.bold, anchor: 'middle' };
    top += p.style.lh;
    return line;
  });
  return { x, y, w, h: height, cls, lines };
}

const round = (n: number) => Math.round(n * 10) / 10;
const stepParts = (s: { label: string; note?: string }): Part[] => [
  { text: s.label, cls: 'd-label', style: TEXT.label },
  ...(s.note ? [{ text: s.note, cls: 'd-note', style: TEXT.note }] : []),
];
const boxClass = (highlight?: boolean) => (highlight ? 'd-box d-box--highlight' : 'd-box');

// Arrows: a line with an open head at its end.
const head = (x: number, y: number, dir: 'right' | 'down') =>
  dir === 'right' ? `M${x - 7} ${y - 5} L${x} ${y} L${x - 7} ${y + 5}` : `M${x - 5} ${y - 7} L${x} ${y} L${x + 5} ${y - 7}`;
const arrowRight = (x1: number, x2: number, y: number) => ({ d: `M${x1} ${y} H${x2} ${head(x2, y, 'right')}`, cls: 'd-arrow' });
const arrowDown = (x: number, y1: number, y2: number) => ({ d: `M${x} ${y1} V${y2} ${head(x, y2, 'down')}`, cls: 'd-arrow' });

type Step = { label: string; note?: string; highlight?: boolean };

/** Steps in order: a row of equal boxes when wide, a column when narrow. */
function flow(steps: Step[], width: number, vertical: boolean): Layout {
  const gap = vertical ? 28 : 30;
  if (!vertical) {
    const w = (width - 2 * EDGE - gap * (steps.length - 1)) / steps.length;
    const h = Math.max(...steps.map((s) => makeBox(0, 0, w, stepParts(s), 'd-box').h));
    const boxes = steps.map((s, i) => makeBox(round(EDGE + i * (w + gap)), EDGE, round(w), stepParts(s), boxClass(s.highlight), h));
    const paths = boxes.slice(1).map((b, i) => arrowRight(boxes[i].x + boxes[i].w + 3, b.x - 3, EDGE + h / 2));
    return { width, height: h + 2 * EDGE, boxes, paths, labels: [] };
  }
  const boxes: Box[] = [];
  let y = EDGE;
  for (const s of steps) {
    const b = makeBox(EDGE, y, width - 2 * EDGE, stepParts(s), boxClass(s.highlight));
    boxes.push(b);
    y += b.h + gap;
  }
  const paths = boxes.slice(1).map((b, i) => arrowDown(width / 2, boxes[i].y + boxes[i].h + 3, b.y - 3));
  return { width, height: y - gap + EDGE, boxes, paths, labels: [] };
}

/** Steps narrowing down the page: each bar a little narrower than the one above. */
function funnel(steps: Step[], width: number): Layout {
  const boxes: Box[] = [];
  let y = EDGE;
  steps.forEach((s, i) => {
    const w = (width - 2 * EDGE) * (1 - (0.4 * i) / Math.max(steps.length - 1, 1));
    const b = makeBox(round((width - w) / 2), y, round(w), stepParts(s), boxClass(s.highlight));
    boxes.push(b);
    y += b.h + 22;
  });
  const paths = boxes.slice(1).map((b, i) => arrowDown(width / 2, boxes[i].y + boxes[i].h + 3, b.y - 3));
  return { width, height: y - 22 + EDGE, boxes, paths, labels: [] };
}

const arrowLabel = (text: string, x: number, y: number, anchor: Line['anchor'] = 'start'): Line => ({
  text,
  x: round(x),
  y: round(y),
  cls: 'd-arrow-label',
  size: TEXT.lane.size,
  bold: true,
  anchor,
});

/** Checks tried in order. Wide: questions down the left, each "Yes" outcome to its right. Narrow: one column,
 *  each outcome indented under its question, with the "No" line running down the left gutter. */
function decision(a: Extract<DiagramArtefact, { kind: 'decision' }>, width: number, vertical: boolean): Layout {
  const boxes: Box[] = [];
  const paths: Layout['paths'] = [];
  const labels: Line[] = [];
  const q = (text: string): Part[] => [{ text, cls: 'd-label', style: TEXT.label }];
  const o = (text: string): Part[] => [{ text, cls: 'd-note', style: TEXT.label }];
  let y = EDGE;
  if (!vertical) {
    const leftW = Math.round(width * 0.46);
    const rightX = leftW + 84;
    const rightW = width - rightX - EDGE;
    a.checks.forEach((c) => {
      const h = Math.max(makeBox(0, 0, leftW, q(c.question), '').h, makeBox(0, 0, rightW, o(c.yes), '').h);
      const qb = makeBox(EDGE, y, leftW, q(c.question), 'd-box d-box--question', h);
      boxes.push(qb, makeBox(rightX, y, rightW, o(c.yes), 'd-box d-box--outcome', h));
      paths.push(arrowRight(EDGE + leftW + 3, rightX - 3, y + h / 2));
      labels.push(arrowLabel('Yes', EDGE + leftW + 42, y + h / 2 - 7, 'middle'));
      y += h + 40;
      paths.push(arrowDown(EDGE + leftW / 2, qb.y + h + 3, y - 3));
      labels.push(arrowLabel('No', EDGE + leftW / 2 + 8, y - 16));
    });
    boxes.push(makeBox(EDGE, y, leftW, o(a.otherwise), 'd-box d-box--end'));
    return { width, height: y + boxes.at(-1)!.h + EDGE, boxes, paths, labels };
  }
  const gutter = 48;
  const lineX = EDGE + 14;
  a.checks.forEach((c) => {
    const qb = makeBox(EDGE, y, width - 2 * EDGE, q(c.question), 'd-box d-box--question');
    const ob = makeBox(EDGE + gutter, qb.y + qb.h + 30, width - 2 * EDGE - gutter, o(c.yes), 'd-box d-box--outcome');
    boxes.push(qb, ob);
    const yesX = ob.x + ob.w / 2;
    paths.push(arrowDown(yesX, qb.y + qb.h + 3, ob.y - 3));
    labels.push(arrowLabel('Yes', yesX + 8, qb.y + qb.h + 20));
    y = ob.y + ob.h + 30;
    paths.push(arrowDown(lineX, qb.y + qb.h + 3, y - 3));
    labels.push(arrowLabel('No', lineX + 7, y - 12));
  });
  boxes.push(makeBox(EDGE, y, width - 2 * EDGE, o(a.otherwise), 'd-box d-box--end'));
  return { width, height: y + boxes.at(-1)!.h + EDGE, boxes, paths, labels };
}

type Swimlane = Extract<DiagramArtefact, { kind: 'swimlane' }>;
const TITLE_H = 30;
const title = (text: string): Line => ({ text, x: EDGE, y: 18, cls: 'd-title', size: TEXT.label.size, bold: true, anchor: 'start' });

/** One state of a swimlane. Wide: a band per lane, steps left to right. Narrow: a column of steps, each naming its lane. */
function swimlane(lanes: string[], state: Swimlane['states'][number], width: number, vertical: boolean): Layout {
  const part = (label: string): Part[] => [{ text: label, cls: 'd-label', style: TEXT.note }];
  if (vertical) {
    const boxes: Box[] = [];
    let y = TITLE_H;
    for (const s of state.steps) {
      const parts: Part[] = [{ text: s.lane, cls: 'd-lane-name', style: TEXT.lane, bold: true }, ...part(s.label)];
      const b = makeBox(EDGE, y, width - 2 * EDGE, parts, 'd-box');
      boxes.push(b);
      y += b.h + 24;
    }
    const paths = boxes.slice(1).map((b, i) => arrowDown(width / 2, boxes[i].y + boxes[i].h + 3, b.y - 3));
    return { width, height: y - 24 + EDGE, boxes, paths, labels: [title(state.title)] };
  }
  const headW = 112;
  const colW = (width - headW - EDGE) / state.steps.length;
  const boxW = round(colW - 16);
  const laneH = lanes.map((lane) => {
    const own = state.steps.filter((s) => s.lane === lane).map((s) => makeBox(0, 0, boxW, part(s.label), '').h);
    return Math.max(56, makeBox(0, 0, headW - 8, [{ text: lane, cls: 'd-lane-name', style: TEXT.lane, bold: true }], '').h, ...own) + 16;
  });
  const laneTop = laneH.map((_, i) => TITLE_H + laneH.slice(0, i).reduce((s, h) => s + h, 0));
  const height = laneTop.at(-1)! + laneH.at(-1)! + EDGE;
  const bands = lanes.map((_, i) => ({ x: 0, y: laneTop[i], w: width, h: laneH[i], cls: i % 2 ? 'd-band d-band--alt' : 'd-band' }));
  const heads = lanes.map((lane, i) =>
    makeBox(EDGE, laneTop[i] + 4, headW - 8, [{ text: lane, cls: 'd-lane-name', style: TEXT.lane, bold: true }], 'd-lanehead', laneH[i] - 8),
  );
  const steps = state.steps.map((s, i) => {
    const li = lanes.indexOf(s.lane);
    const h = makeBox(0, 0, boxW, part(s.label), '').h;
    return makeBox(round(headW + i * colW + 8), round(laneTop[li] + (laneH[li] - h) / 2), boxW, part(s.label), 'd-box');
  });
  const paths = steps.slice(1).map((b, i) => {
    const a = steps[i];
    const x1 = a.x + a.w + 2;
    const x2 = b.x - 3;
    const y1 = round(a.y + a.h / 2);
    const y2 = round(b.y + b.h / 2);
    if (y1 === y2) return arrowRight(x1, x2, y1);
    const mid = round((x1 + x2) / 2);
    return { d: `M${x1} ${y1} H${mid} V${y2} H${x2} ${head(x2, y2, 'right')}`, cls: 'd-arrow' };
  });
  return { width, height, bands, boxes: [...heads, ...steps], paths, labels: [title(state.title)] };
}

/** The wide and narrow layouts of a diagram: one each, or one per state for a swimlane. */
export function layouts(a: DiagramArtefact): { wide: Layout[]; narrow: Layout[] } {
  switch (a.kind) {
    case 'flow':
      return { wide: [flow(a.steps, WIDE, false)], narrow: [flow(a.steps, NARROW, true)] };
    case 'funnel':
      return { wide: [funnel(a.steps, 560)], narrow: [funnel(a.steps, NARROW)] };
    case 'decision':
      return { wide: [decision(a, WIDE, false)], narrow: [decision(a, NARROW, true)] };
    case 'swimlane':
      return {
        wide: a.states.map((s) => swimlane(a.lanes, s, WIDE, false)),
        narrow: a.states.map((s) => swimlane(a.lanes, s, NARROW, true)),
      };
  }
}

const sentence = (s: string) => (/[.!?:]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** The diagram in words, for its aria-describedby text alternative (SPEC 7): groups of list items, in order. */
export function walkthrough(a: DiagramArtefact): { title?: string; items: string[] }[] {
  switch (a.kind) {
    case 'flow':
    case 'funnel':
      return [{ items: a.steps.map((s) => (s.note ? `${sentence(s.label)} ${sentence(s.note)}` : sentence(s.label))) }];
    case 'decision':
      return [
        {
          items: [
            ...a.checks.map((c) => `${sentence(c.question)} If yes: ${sentence(c.yes)} If not, go to the next check.`),
            `If no check matches: ${sentence(a.otherwise)}`,
          ],
        },
      ];
    case 'swimlane':
      return a.states.map((s) => ({ title: s.title, items: s.steps.map((x) => `${x.lane}: ${sentence(x.label)}`) }));
  }
}

/** What is wrong with a layout: text wider than its box, boxes that overlap, anything off the canvas. */
export function layoutProblems(layout: Layout): string[] {
  const problems: string[] = [];
  const off = (x: number, y: number, w: number, h: number) => x < 0 || y < 0 || x + w > layout.width + 0.01 || y + h > layout.height + 0.01;
  layout.boxes.forEach((b, i) => {
    if (off(b.x, b.y, b.w, b.h)) problems.push(`box ${i} is outside the canvas`);
    for (const l of b.lines) {
      if (textWidth(l.text, l.size ?? 14, l.bold) > b.w - 2 * PAD_X + 0.01) problems.push(`"${l.text}" is wider than its box`);
    }
    layout.boxes.slice(i + 1).forEach((c, j) => {
      if (b.x < c.x + c.w && c.x < b.x + b.w && b.y < c.y + c.h && c.y < b.y + b.h) problems.push(`boxes ${i} and ${i + j + 1} overlap`);
    });
  });
  for (const l of layout.labels) {
    const w = textWidth(l.text, l.size ?? 14, l.bold);
    const left = l.anchor === 'middle' ? l.x - w / 2 : l.x;
    if (off(left, l.y - (l.size ?? 14), w, l.size ?? 14)) problems.push(`label "${l.text}" is outside the canvas`);
  }
  return problems;
}
