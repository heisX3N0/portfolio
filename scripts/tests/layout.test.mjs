// Negative cases first: each layout rule must reject the measurement it exists for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowCount, outsideFirstScreen, overBudget } from '../lib/layout.mjs';

const box = (top, height = 40) => ({ top, bottom: top + height });

test('a header whose items sit on two rows is two rows', () => {
  assert.equal(rowCount([box(8), box(10), box(60)]), 2);
});

test('items of different heights on one line are one row', () => {
  assert.equal(rowCount([box(8, 34), box(4, 44), box(12, 24)]), 1);
  assert.equal(rowCount([]), 0);
});

test('an element below the fold, or missing, is outside the first screen', () => {
  assert.deepEqual(outsideFirstScreen({ h1: box(100), proof: box(800) }, 768), ['proof']);
  assert.deepEqual(outsideFirstScreen({ cv: null }, 768), ['cv']);
  assert.deepEqual(outsideFirstScreen({ h1: box(100), proof: box(700, 68) }, 768), []);
});

test('a page over 200 KB fails the budget', () => {
  assert.deepEqual(overBudget({ '/': 120_000, '/big/': 200_001 }), ['/big/: 200001 bytes']);
  assert.deepEqual(overBudget({ '/': 200_000 }), []);
});
