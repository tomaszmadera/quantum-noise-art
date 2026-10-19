// Guards against a JavaScript engine whose Math.sin/cos/log/pow differ from
// the V8/fdlibm results the fixtures (and the Python port) are based on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const view = new DataView(new ArrayBuffer(8));
const fromHex = (h) => { view.setBigUint64(0, BigInt(`0x${h}`)); return view.getFloat64(0); };
const toHex = (x) => { view.setFloat64(0, x); return view.getBigUint64(0).toString(16).padStart(16, '0'); };

test('Math functions match the recorded V8 vectors bit for bit', () => {
  const text = readFileSync(new URL('../../../fixtures/math-vectors.txt', import.meta.url), 'utf8');
  let count = 0;
  for (const line of text.trim().split('\n')) {
    const [name, ...rest] = line.split(' ');
    const expected = rest.pop();
    const got = Math[name](...rest.map(fromHex));
    if (Number.isNaN(fromHex(expected))) assert.ok(Number.isNaN(got), line);
    else assert.equal(toHex(got), expected, line);
    count++;
  }
  assert.ok(count > 1000);
});
