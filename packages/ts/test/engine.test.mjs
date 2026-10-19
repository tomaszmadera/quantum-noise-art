// The generators call the engine's Math.sin, Math.cos and Math.log directly,
// so those must match the V8/fdlibm results the fixtures were rendered with:
// any drift here is a real failure. pow is NOT taken from the engine (the
// package ships its own fdlibm port, see fdlibm.test.mjs), so a different
// Math.pow (as in Node.js 24 / V8 13) is only reported as a diagnostic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readVectors, same } from './vectors.mjs';

const vectors = readVectors();

for (const name of ['sin', 'cos', 'log']) {
  test(`engine Math.${name} matches the recorded V8 vectors bit for bit`, () => {
    const own = vectors.filter((v) => v.name === name);
    assert.ok(own.length > 1000);
    for (const v of own) assert.ok(same(Math[name](...v.args), v.expected), v.line);
  });
}

test('engine Math.pow drift (informational, not used by the generators)', (t) => {
  const own = vectors.filter((v) => v.name === 'pow');
  const drift = own.filter((v) => !same(Math.pow(...v.args), v.expected)).length;
  t.diagnostic(`Math.pow differs from fdlibm on ${drift}/${own.length} vectors (V8 ${process.versions.v8})`);
});
