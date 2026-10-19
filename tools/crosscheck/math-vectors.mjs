// Prints test vectors "fn x [y] result" (hex bit patterns) for Math.sin,
// Math.cos, Math.log and Math.pow as computed by this JavaScript engine.
// Usage: node math-vectors.mjs [count] [seed] > vectors.txt
//
// Run it on Node.js 20 or 22 (V8 <= 12): their Math.pow is the fdlibm
// reference that the packages' own `pow` ports reproduce. V8 13 (Node.js 24)
// changed Math.pow, so its pow vectors would be wrong.
import { rng } from '../../packages/ts/dist/index.js';

if (Number(process.versions.v8.split('.')[0]) > 12) {
  console.error(`V8 ${process.versions.v8} has a different Math.pow; use Node.js 20 or 22 to record vectors.`);
  process.exit(1);
}

const count = Number(process.argv[2] ?? 1000);
const r = rng(Number(process.argv[3] ?? 7));
const view = new DataView(new ArrayBuffer(8));
const hex = (x) => { view.setFloat64(0, x); return view.getBigUint64(0).toString(16).padStart(16, '0'); };
const anyDouble = () => { view.setUint32(0, (r() * 2 ** 32) >>> 0); view.setUint32(4, (r() * 2 ** 32) >>> 0); return view.getFloat64(0); };
const trigArg = () => {
  const k = r();
  if (k < 0.5) return r() * Math.PI * 4;
  if (k < 0.8) return (r() - 0.5) * 200;
  if (k < 0.95) return (r() - 0.5) * 1.6e6;
  return (r() - 0.5) * 1e-6;
};
const positive = () => {
  const k = r();
  if (k < 0.6) return r();
  if (k < 0.8) return r() * 1000;
  return Math.abs(anyDouble());
};
const lines = [];
for (let i = 0; i < count; i++) {
  const t = trigArg();
  lines.push(`sin ${hex(t)} ${hex(Math.sin(t))}`);
  lines.push(`cos ${hex(t)} ${hex(Math.cos(t))}`);
  const p = positive();
  lines.push(`log ${hex(p)} ${hex(Math.log(p))}`);
  const b = r() < 0.7 ? r() : r() * 50;
  const e = r() < 0.5 ? 1.6 : (r() - 0.5) * 20;
  lines.push(`pow ${hex(b)} ${hex(e)} ${hex(Math.pow(b, e))}`);
}
// pow special cases and negative bases with integer exponents.
const bases = [0, -0, 1, -1, 2, -2, 0.5, -0.5, -1.3, -7.25, 1e-310, -1e-310, 1e300, Infinity, -Infinity, NaN, 1 + 2 ** -40];
const exps = [0, -0, 1, -1, 2, 3, -3, 0.5, -0.5, 1.6, 7, -11, 2 ** 31 + 1, 2 ** 53, 1e20, -1e20, Infinity, -Infinity, NaN, 0.3];
for (const b of bases) for (const e of exps) lines.push(`pow ${hex(b)} ${hex(e)} ${hex(Math.pow(b, e))}`);
for (let i = 0; i < count; i++) {
  const b = -(r() * 20);
  const e = Math.floor((r() - 0.5) * 40);
  lines.push(`pow ${hex(b)} ${hex(e)} ${hex(Math.pow(b, e))}`);
}
console.log(lines.join('\n'));
