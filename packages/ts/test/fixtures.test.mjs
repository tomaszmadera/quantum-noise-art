// Byte-for-byte comparison against the golden SVGs rendered by the original
// Astro components (see tools/golden).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { noiseThumb, orbitField } from '../dist/index.js';

const fixtures = new URL('../../../fixtures/', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('cases.json', fixtures), 'utf8'));

for (const c of cases) {
  test(`${c.name} matches fixture`, () => {
    const expected = readFileSync(new URL(`${c.name}.svg`, fixtures), 'utf8');
    const actual = c.component === 'NoiseThumb' ? noiseThumb(c.props) : orbitField(c.props);
    assert.equal(actual, expected);
  });
}
