/**
 * Deterministic pseudo-random helpers, extracted verbatim from quantumnoise.dev
 * (src/lib/noise.ts). Changing any arithmetic here changes every picture.
 */
/** mulberry32: small, fast, seeded PRNG. Same seed, same output, every time. */
export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Standard normal sample (Box-Muller). */
export function gauss(r) {
    let u = 0;
    while (u === 0)
        u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const round = (n) => Math.round(n * 10) / 10;
/**
 * Many dots as one compact path: each dot is a zero-length segment drawn
 * with a round line cap, so hundreds of dots cost a few kilobytes.
 */
export function dotPath(points) {
    return points.map(([x, y]) => `M${round(x)} ${round(y)}h0`).join('');
}
/** Rotate a point around a centre by `deg` degrees. */
export function rotate([x, y], cx, cy, deg) {
    const a = (deg * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}
/** Zero-pad an index for the numbered list look (1 -> "01"). */
export function pad2(n) {
    return String(n).padStart(2, '0');
}
