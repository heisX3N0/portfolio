// The inline theme script must work when storage throws, and honour the system preference.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../src/scripts/theme.js', import.meta.url), 'utf8');

function run({ storage, prefersDark = false }) {
  const attrs = {};
  const listeners = {};
  const media = { matches: prefersDark, addEventListener(_type, fn) { media.onchange = fn; } };
  const button = {
    hidden: true,
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(_type, fn) { this.click = fn; },
  };
  const document = {
    documentElement: {
      setAttribute(k, v) { attrs[k] = v; },
      getAttribute(k) { return attrs[k]; },
    },
    querySelector: () => button,
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const window = { localStorage: storage, matchMedia: () => media };
  runInNewContext(source, { window, document });
  listeners.DOMContentLoaded?.();
  return { attrs, button, media };
}

const throwing = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
};

test('toggle still works when localStorage throws', () => {
  const { attrs, button } = run({ storage: throwing });
  assert.equal(attrs['data-theme'], 'light');
  assert.equal(button.hidden, false);
  assert.doesNotThrow(() => button.click());
  assert.equal(attrs['data-theme'], 'dark');
  assert.equal(button.attrs['aria-label'], 'Switch to light theme');
});

test('the toggle name says what a click does', () => {
  const { button } = run({ storage: { getItem: () => null, setItem() {} } });
  assert.equal(button.attrs['aria-label'], 'Switch to dark theme');
  button.click();
  assert.equal(button.attrs['aria-label'], 'Switch to light theme');
});

test('ignores a stored value that is not a theme', () => {
  const { attrs } = run({ storage: { getItem: () => 'purple', setItem() {} }, prefersDark: true });
  assert.equal(attrs['data-theme'], 'dark');
});

test('follows the system preference when nothing is stored', () => {
  assert.equal(run({ storage: { getItem: () => null, setItem() {} }, prefersDark: true }).attrs['data-theme'], 'dark');
  assert.equal(run({ storage: { getItem: () => null, setItem() {} } }).attrs['data-theme'], 'light');
});

test('follows a live system change only while no choice is stored', () => {
  const free = run({ storage: { getItem: () => null, setItem() {} } });
  assert.equal(typeof free.media.onchange, 'function', 'no change listener');
  free.media.matches = true;
  free.media.onchange();
  assert.equal(free.attrs['data-theme'], 'dark');

  const chosen = run({ storage: { getItem: () => 'light', setItem() {} } });
  chosen.media.matches = true;
  chosen.media.onchange?.();
  assert.equal(chosen.attrs['data-theme'], 'light');
});

test('a stored choice wins over the system preference and is saved on toggle', () => {
  const saved = {};
  const storage = { getItem: () => 'light', setItem: (k, v) => { saved[k] = v; } };
  const { attrs, button } = run({ storage, prefersDark: true });
  assert.equal(attrs['data-theme'], 'light');
  button.click();
  assert.equal(saved.theme, 'dark');
});
