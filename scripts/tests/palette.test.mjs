// The style guide's palette (src/lib/palette.ts) must match the tokens the site uses (tokens.css),
// so its contrast table never reports colours the site doesn't use; and every pair the site uses must pass WCAG AA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { palette, pairs, contrastFailures } from '../../src/lib/palette.ts';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function block(source, start) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `missing ${start}`);
  return source.slice(from, source.indexOf('}', from));
}

function tokens(cssBlock) {
  return Object.fromEntries([...cssBlock.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

test('a text pair under 4.5:1 fails', () => {
  const bad = { light: { text: '#777777', bg: '#ffffff' }, dark: { text: '#e9e7e2', bg: '#12161d' } };
  assert.deepEqual(contrastFailures(bad, [{ fg: 'text', bg: 'bg', min: 4.5, use: 'Body text' }]), ['light: Body text (text on bg) 4.48:1, needs 4.5:1']);
});

test('a UI pair under 3:1 fails, in the dark theme too', () => {
  const bad = { light: { edge: '#000000', bg: '#ffffff' }, dark: { edge: '#2e4566', bg: '#12161d' } };
  assert.equal(contrastFailures(bad, [{ fg: 'edge', bg: 'bg', min: 3, use: 'Edge' }]).length, 1);
});

test('a pair naming a colour the palette lacks fails', () => {
  assert.equal(contrastFailures({ light: { bg: '#ffffff' }, dark: { bg: '#000000' } }, [{ fg: 'gold', bg: 'bg', min: 4.5, use: 'x' }]).length, 2);
});

test('the pairs cover on-navy and gold text', () => {
  const names = pairs.map((p) => `${p.fg}/${p.bg}`);
  for (const pair of ['on-hero/hero-bg', 'on-hero-muted/hero-bg', 'on-hero-gold/hero-bg', 'hero-bg/on-hero-gold', 'gold/bg', 'gold/gold-bg', 'hero-edge/bg']) {
    assert.ok(names.includes(pair), `missing pair ${pair}`);
  }
});

test('every pair passes in both themes', () => {
  assert.deepEqual(contrastFailures(palette, pairs), []);
});

test('light palette matches tokens.css', () => {
  const site = tokens(block(css, ':root {'));
  for (const [name, hex] of Object.entries(palette.light)) assert.equal(site[name], hex, name);
});

test('both dark blocks, over the light defaults, match the dark palette', () => {
  const light = tokens(block(css, ':root {'));
  for (const start of [":root:not([data-theme='light'])", ":root[data-theme='dark']"]) {
    const site = { ...light, ...tokens(block(css, start)) };
    for (const [name, hex] of Object.entries(palette.dark)) assert.equal(site[name], hex, `${start} ${name}`);
  }
});
