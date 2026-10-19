import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbitField, pow } from '../dist/index.js';
import { readVectors, same } from './vectors.mjs';

test('pow port matches the recorded fdlibm vectors bit for bit', () => {
  const own = readVectors().filter((v) => v.name === 'pow');
  assert.ok(own.length > 1000);
  for (const v of own) assert.ok(same(pow(...v.args), v.expected), v.line);
});

test('generators do not depend on the engine Math.pow', () => {
  const original = Math.pow;
  const expected = orbitField({ seed: 1729 });
  Math.pow = () => { throw new Error('Math.pow called'); };
  try {
    assert.equal(orbitField({ seed: 1729 }), expected);
    assert.equal(orbitField({ seed: 404 }).length > 0, true);
  } finally {
    Math.pow = original;
  }
});
