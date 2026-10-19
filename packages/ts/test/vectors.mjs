// Shared reader for fixtures/math-vectors.txt (recorded on Node.js 22, V8 12).
import { readFileSync } from 'node:fs';

const view = new DataView(new ArrayBuffer(8));
export const fromHex = (h) => { view.setBigUint64(0, BigInt(`0x${h}`)); return view.getFloat64(0); };
export const toHex = (x) => { view.setFloat64(0, x); return view.getBigUint64(0).toString(16).padStart(16, '0'); };

export function readVectors() {
  const text = readFileSync(new URL('../../../fixtures/math-vectors.txt', import.meta.url), 'utf8');
  return text.trim().split('\n').map((line) => {
    const [name, ...rest] = line.split(' ');
    const expected = rest.pop();
    return { line, name, args: rest.map(fromHex), expected };
  });
}

export const same = (got, expected) => (Number.isNaN(fromHex(expected)) ? Number.isNaN(got) : toHex(got) === expected);
