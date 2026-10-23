// The style guide's palette (src/lib/palette.ts) must match the tokens the site uses (tokens.css),
// so its contrast table never reports colours the site doesn't use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const ts = readFileSync(new URL('../../src/lib/palette.ts', import.meta.url), 'utf8');

function block(source, start) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `missing ${start}`);
  return source.slice(from, source.indexOf('}', from));
}

function tokens(cssBlock) {
  return Object.fromEntries([...cssBlock.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

function paletteEntries(tsBlock) {
  return Object.fromEntries([...tsBlock.matchAll(/'?([\w-]+)'?:\s*'(#[0-9a-f]{6})'/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

test('light palette matches tokens.css', () => {
  const site = tokens(block(css, ':root {'));
  for (const [name, hex] of Object.entries(paletteEntries(block(ts, 'light:')))) assert.equal(site[name], hex, name);
});

test('both dark blocks match the dark palette', () => {
  const expected = paletteEntries(block(ts, 'dark:'));
  for (const start of [":root:not([data-theme='light'])", ":root[data-theme='dark']"]) {
    const site = tokens(block(css, start));
    for (const [name, hex] of Object.entries(expected)) assert.equal(site[name], hex, `${start} ${name}`);
  }
});
