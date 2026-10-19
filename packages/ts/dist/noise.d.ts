/**
 * Deterministic pseudo-random helpers, extracted verbatim from quantumnoise.dev
 * (src/lib/noise.ts). Changing any arithmetic here changes every picture.
 */
export type Point = [number, number];
/** mulberry32: small, fast, seeded PRNG. Same seed, same output, every time. */
export declare function rng(seed: number): () => number;
/** Standard normal sample (Box-Muller). */
export declare function gauss(r: () => number): number;
/**
 * Many dots as one compact path: each dot is a zero-length segment drawn
 * with a round line cap, so hundreds of dots cost a few kilobytes.
 */
export declare function dotPath(points: Point[]): string;
/** Rotate a point around a centre by `deg` degrees. */
export declare function rotate([x, y]: Point, cx: number, cy: number, deg: number): Point;
/** Zero-pad an index for the numbered list look (1 -> "01"). */
export declare function pad2(n: number): string;
