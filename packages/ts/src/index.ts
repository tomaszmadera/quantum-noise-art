/**
 * quantum-noise-art: seeded, dependency-free SVG generators for the
 * space / nebula / orbit graphics of quantumnoise.dev.
 *
 * Every generator is a pure function returning an SVG string. The default
 * `classic` variant reproduces the site's output byte for byte.
 */
import { classicNoiseThumb, type NoiseThumbOptions } from './noise-thumb.js';
import { classicOrbitField, type OrbitFieldOptions } from './orbit-field.js';
import { withXmlns } from './svg.js';

export { pow } from './fdlibm.js';
export { dotPath, gauss, pad2, rng, rotate, type Point } from './noise.js';
export { attr, classList, el, escapeAttr, withXmlns } from './svg.js';
export { classicNoiseThumb, TONE_ACCENTS, type NoiseThumbOptions, type Tone } from './noise-thumb.js';
export { classicOrbitField, type OrbitFieldOptions } from './orbit-field.js';

export const DEFAULT_VARIANT = 'classic';

export interface GeneratorOptions {
  noiseThumb: NoiseThumbOptions;
  orbitField: OrbitFieldOptions;
}
export type GeneratorKind = keyof GeneratorOptions;
export type VariantRenderer<K extends GeneratorKind> = (options: GeneratorOptions[K]) => string;

const registry: { [K in GeneratorKind]: Map<string, VariantRenderer<K>> } = {
  noiseThumb: new Map([[DEFAULT_VARIANT, classicNoiseThumb]]),
  orbitField: new Map([[DEFAULT_VARIANT, classicOrbitField]]),
};

/** Register a new variant for a generator. Names must be unique per generator. */
export function registerVariant<K extends GeneratorKind>(kind: K, name: string, render: VariantRenderer<K>): void {
  const variants = registry[kind] as Map<string, VariantRenderer<K>>;
  if (!variants) throw new Error(`Unknown generator: ${String(kind)}`);
  if (variants.has(name)) throw new Error(`Variant "${name}" is already registered for ${kind}`);
  variants.set(name, render);
}

/** Names of the registered variants of a generator. */
export function listVariants(kind: GeneratorKind): string[] {
  return [...registry[kind].keys()];
}

function render<K extends GeneratorKind>(kind: K, options: GeneratorOptions[K]): string {
  const name = options.variant ?? DEFAULT_VARIANT;
  const variant = (registry[kind] as Map<string, VariantRenderer<K>>).get(name);
  if (!variant) throw new Error(`Unknown ${kind} variant "${name}". Known: ${listVariants(kind).join(', ')}`);
  const svg = variant(options);
  return options.xmlns ? withXmlns(svg) : svg;
}

/** Seeded particle-noise thumbnail. `noiseThumb({ seed: 4242, width: 420, height: 260, dots: 1100 })`. */
export function noiseThumb(options: NoiseThumbOptions): string {
  return render('noiseThumb', options);
}

/** Seeded orbit field (hero visual, 820x560 viewBox). `orbitField({ seed: 1729 })`. */
export function orbitField(options: OrbitFieldOptions = {}): string {
  return render('orbitField', options);
}
