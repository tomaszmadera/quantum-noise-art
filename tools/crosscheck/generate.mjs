// Renders many random cases with the TypeScript package and prints one JSON
// line per case with the SHA-256 of the SVG. check.py renders the same cases
// in Python and compares. Usage: node generate.mjs [count] [salt] > cases.jsonl
import { createHash } from 'node:crypto';
import { noiseThumb, orbitField, rng } from '../../packages/ts/dist/index.js';

const count = Number(process.argv[2] ?? 500);
const r = rng(Number(process.argv[3] ?? 20261019));
const tones = ['violet', 'blue', 'mono'];
const pickSeed = () => {
  const k = r();
  if (k < 0.6) return Math.floor(r() * 100000);
  if (k < 0.8) return Math.floor(r() * 2 ** 32) - 2 ** 31;
  if (k < 0.9) return Math.floor(r() * 1e6) / 8;
  return Math.floor(r() * 2 ** 40);
};
for (let i = 0; i < count; i++) {
  let c;
  if (i % 5 === 4) {
    c = { component: 'OrbitField', props: { seed: pickSeed() } };
  } else {
    const fractional = r() < 0.2;
    const size = (lo, hi) => (fractional ? Math.round((lo + r() * (hi - lo)) * 4) / 4 : Math.floor(lo + r() * (hi - lo)));
    c = {
      component: 'NoiseThumb',
      props: { seed: pickSeed(), width: size(1, 1200), height: size(1, 900), dots: Math.floor(r() * 1500), tone: tones[Math.floor(r() * 3)] },
    };
  }
  const svg = c.component === 'NoiseThumb' ? noiseThumb(c.props) : orbitField(c.props);
  c.sha256 = createHash('sha256').update(svg).digest('hex');
  console.log(JSON.stringify(c));
}
