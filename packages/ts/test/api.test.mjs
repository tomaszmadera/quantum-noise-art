import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VARIANT, classicNoiseThumb, dotPath, listVariants, noiseThumb, orbitField, pad2, registerVariant, rng, rotate,
} from '../dist/index.js';

test('rng is deterministic mulberry32', () => {
  const a = rng(4242);
  const b = rng(4242);
  const xs = Array.from({ length: 5 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 5 }, () => b()));
  // Reference values of mulberry32(1).
  const r = rng(1);
  assert.equal(r(), 0.6270739405881613);
  assert.equal(r(), 0.002735721180215478);
});

test('dotPath rounds to one decimal', () => {
  assert.equal(dotPath([[1.25, 2.04], [-0.04, 10]]), 'M1.3 2h0M0 10h0');
});

test('rotate and pad2', () => {
  const [x, y] = rotate([2, 1], 1, 1, 90);
  assert.ok(Math.abs(x - 1) < 1e-12 && Math.abs(y - 2) < 1e-12);
  assert.equal(pad2(3), '03');
});

test('default variant and xmlns option', () => {
  assert.equal(DEFAULT_VARIANT, 'classic');
  assert.equal(noiseThumb({ seed: 1, variant: 'classic' }), noiseThumb({ seed: 1 }));
  const svg = orbitField({ seed: 1, xmlns: true });
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'));
  assert.equal(svg.replace(' xmlns="http://www.w3.org/2000/svg"', ''), orbitField({ seed: 1 }));
});

test('variants can be registered and listed', () => {
  registerVariant('noiseThumb', 'test-inverted', (o) => classicNoiseThumb(o).replace('#fafafa', '#000000'));
  assert.deepEqual(listVariants('noiseThumb'), ['classic', 'test-inverted']);
  assert.notEqual(noiseThumb({ seed: 1, variant: 'test-inverted' }), noiseThumb({ seed: 1 }));
  assert.throws(() => registerVariant('noiseThumb', 'classic', classicNoiseThumb), /already registered/);
  assert.throws(() => noiseThumb({ seed: 1, variant: 'nope' }), /Unknown noiseThumb variant/);
});
