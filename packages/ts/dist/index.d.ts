/**
 * quantum-noise-art: seeded, dependency-free SVG generators for the
 * space / nebula / orbit graphics of quantumnoise.dev.
 *
 * Every generator is a pure function returning an SVG string. The default
 * `classic` variant reproduces the site's output byte for byte.
 */
import { type NoiseThumbOptions } from './noise-thumb.js';
import { type OrbitFieldOptions } from './orbit-field.js';
export { pow } from './fdlibm.js';
export { dotPath, gauss, pad2, rng, rotate, type Point } from './noise.js';
export { attr, classList, el, escapeAttr, withXmlns } from './svg.js';
export { classicNoiseThumb, TONE_ACCENTS, type NoiseThumbOptions, type Tone } from './noise-thumb.js';
export { classicOrbitField, type OrbitFieldOptions } from './orbit-field.js';
export declare const DEFAULT_VARIANT = "classic";
export interface GeneratorOptions {
    noiseThumb: NoiseThumbOptions;
    orbitField: OrbitFieldOptions;
}
export type GeneratorKind = keyof GeneratorOptions;
export type VariantRenderer<K extends GeneratorKind> = (options: GeneratorOptions[K]) => string;
/** Register a new variant for a generator. Names must be unique per generator. */
export declare function registerVariant<K extends GeneratorKind>(kind: K, name: string, render: VariantRenderer<K>): void;
/** Names of the registered variants of a generator. */
export declare function listVariants(kind: GeneratorKind): string[];
/** Seeded particle-noise thumbnail. `noiseThumb({ seed: 4242, width: 420, height: 260, dots: 1100 })`. */
export declare function noiseThumb(options: NoiseThumbOptions): string;
/** Seeded orbit field (hero visual, 820x560 viewBox). `orbitField({ seed: 1729 })`. */
export declare function orbitField(options?: OrbitFieldOptions): string;
