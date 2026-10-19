/**
 * `pow` from fdlibm, ported operation for operation from v8/src/base/ieee754.cc
 * (the implementation behind `Math.pow` up to Node.js 22 / V8 12).
 *
 * Why: V8 13 (Node.js 24) changed `Math.pow`, which now differs in the last
 * bit for roughly one call in ten. `orbitField` feeds `pow` results into its
 * coordinates, so the generators use this port instead of `Math.pow` to give
 * the same doubles on every engine, matching the fixtures and the Python port.
 */
/** x ** y, bit-identical to V8 12 (Node.js <= 22) `Math.pow`. */
export declare function pow(x: number, y: number): number;
