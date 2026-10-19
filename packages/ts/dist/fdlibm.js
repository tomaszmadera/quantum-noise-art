/**
 * `pow` from fdlibm, ported operation for operation from v8/src/base/ieee754.cc
 * (the implementation behind `Math.pow` up to Node.js 22 / V8 12).
 *
 * Why: V8 13 (Node.js 24) changed `Math.pow`, which now differs in the last
 * bit for roughly one call in ten. `orbitField` feeds `pow` results into its
 * coordinates, so the generators use this port instead of `Math.pow` to give
 * the same doubles on every engine, matching the fixtures and the Python port.
 */
const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
const LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const HI = LITTLE_ENDIAN ? 1 : 0;
const LO = LITTLE_ENDIAN ? 0 : 1;
/** High 32 bits of a double as a signed int32 (GET_HIGH_WORD). */
const high = (x) => { f64[0] = x; return u32[HI] | 0; };
/** Low 32 bits of a double as uint32 (GET_LOW_WORD). */
const low = (x) => { f64[0] = x; return u32[LO]; };
const setHigh = (x, v) => { f64[0] = x; u32[HI] = v >>> 0; return f64[0]; };
const setLow = (x, v) => { f64[0] = x; u32[LO] = v >>> 0; return f64[0]; };
/** scalbn(z, n) with a single rounding, for the subnormal-result path. */
function scalbn(z, n) {
    if (n < -1000)
        return z * 2 ** -600 * 2 ** (n + 600);
    if (n > 1000)
        return z * 2 ** 600 * 2 ** (n - 600);
    return z * 2 ** n;
}
const bp = [1.0, 1.5];
const dp_h = [0.0, 5.84962487220764160156e-1];
const dp_l = [0.0, 1.35003920212974897128e-8];
const two53 = 9007199254740992.0;
const huge = 1.0e300;
const tiny = 1.0e-300;
const L1 = 5.99999999999994648725e-1;
const L2 = 4.28571428578550184252e-1;
const L3 = 3.33333329818377432918e-1;
const L4 = 2.72728123808534006489e-1;
const L5 = 2.30660745775561754067e-1;
const L6 = 2.06975017800338417784e-1;
const P1 = 1.66666666666666019037e-1;
const P2 = -2.77777777770155933842e-3;
const P3 = 6.61375632143793436117e-5;
const P4 = -1.65339022054652515390e-6;
const P5 = 4.13813679705723846039e-8;
const lg2 = 6.93147180559945286227e-1;
const lg2_h = 6.93147182464599609375e-1;
const lg2_l = -1.90465429995776804525e-9;
const ovt = 8.0085662595372944372e-17;
const cp = 9.61796693925975554329e-1;
const cp_h = 9.61796700954437255859e-1;
const cp_l = -7.02846165095275826516e-9;
const ivln2 = 1.442695040888963387e0;
const ivln2_h = 1.44269502162933349609e0;
const ivln2_l = 1.92596299112661746887e-8;
/** x ** y, bit-identical to V8 12 (Node.js <= 22) `Math.pow`. */
export function pow(x, y) {
    let z, ax, z_h, z_l, p_h, p_l;
    let y1, t1, t2, r, s, t, u, v, w;
    let i, j, k, n;
    const hx = high(x);
    const lx = low(x);
    const hy = high(y);
    const ly = low(y);
    let ix = hx & 0x7fffffff;
    const iy = hy & 0x7fffffff;
    // y == 0: x**0 = 1
    if ((iy | ly) === 0)
        return 1;
    // NaN
    if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) || iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) {
        return x + y;
    }
    // yisint = 0: not an integer, 1: odd integer, 2: even integer (only when x < 0)
    let yisint = 0;
    if (hx < 0) {
        if (iy >= 0x43400000) {
            yisint = 2;
        }
        else if (iy >= 0x3ff00000) {
            k = (iy >> 20) - 0x3ff;
            if (k > 20) {
                j = ly >>> (52 - k);
                if ((j << (52 - k)) === (ly | 0))
                    yisint = 2 - (j & 1);
            }
            else if (ly === 0) {
                j = iy >> (20 - k);
                if (j << (20 - k) === iy)
                    yisint = 2 - (j & 1);
            }
        }
    }
    // special values of y
    if (ly === 0) {
        if (iy === 0x7ff00000) {
            if (((ix - 0x3ff00000) | lx) === 0)
                return y - y; // (+-1)**+-inf is NaN
            if (ix >= 0x3ff00000)
                return hy >= 0 ? y : 0; // (|x|>1)**+-inf = inf, 0
            return hy < 0 ? -y : 0; // (|x|<1)**-,+inf = inf, 0
        }
        if (iy === 0x3ff00000)
            return hy < 0 ? 1 / x : x;
        if (hy === 0x40000000)
            return x * x;
        if (hy === 0x3fe00000 && hx >= 0)
            return Math.sqrt(x);
    }
    ax = Math.abs(x);
    // special values of x
    if (lx === 0 && (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000)) {
        z = ax;
        if (hy < 0)
            z = 1 / z;
        if (hx < 0) {
            if (((ix - 0x3ff00000) | yisint) === 0)
                z = NaN; // (-1)**non-int
            else if (yisint === 1)
                z = -z;
        }
        return z;
    }
    n = (hx >> 31) + 1;
    if ((n | yisint) === 0)
        return NaN; // (x<0)**(non-int)
    s = 1;
    if ((n | (yisint - 1)) === 0)
        s = -1; // (-ve)**(odd int)
    if (iy > 0x41e00000) {
        // |y| > 2**31
        if (iy > 0x43f00000) {
            if (ix <= 0x3fefffff)
                return hy < 0 ? huge * huge : tiny * tiny;
            if (ix >= 0x3ff00000)
                return hy > 0 ? huge * huge : tiny * tiny;
        }
        if (ix < 0x3fefffff)
            return hy < 0 ? s * huge * huge : s * tiny * tiny;
        if (ix > 0x3ff00000)
            return hy > 0 ? s * huge * huge : s * tiny * tiny;
        t = ax - 1;
        w = t * t * (0.5 - t * (0.3333333333333333333333 - t * 0.25));
        u = ivln2_h * t;
        v = t * ivln2_l - w * ivln2;
        t1 = setLow(u + v, 0);
        t2 = v - (t1 - u);
    }
    else {
        n = 0;
        if (ix < 0x00100000) {
            ax *= two53;
            n -= 53;
            ix = high(ax);
        }
        n += (ix >> 20) - 0x3ff;
        j = ix & 0x000fffff;
        ix = j | 0x3ff00000;
        if (j <= 0x3988e) {
            k = 0;
        }
        else if (j < 0xbb67a) {
            k = 1;
        }
        else {
            k = 0;
            n += 1;
            ix -= 0x00100000;
        }
        ax = setHigh(ax, ix);
        u = ax - bp[k];
        v = 1 / (ax + bp[k]);
        const ss = u * v;
        const s_h = setLow(ss, 0);
        let t_h = setHigh(0, ((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18));
        let t_l = ax - (t_h - bp[k]);
        const s_l = v * ((u - s_h * t_h) - s_h * t_l);
        let s2 = ss * ss;
        r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
        r += s_l * (s_h + ss);
        s2 = s_h * s_h;
        t_h = setLow(3.0 + s2 + r, 0);
        t_l = r - ((t_h - 3.0) - s2);
        u = s_h * t_h;
        v = s_l * t_h + t_l * ss;
        p_h = setLow(u + v, 0);
        p_l = v - (p_h - u);
        z_h = cp_h * p_h;
        z_l = cp_l * p_h + p_l * cp + dp_l[k];
        t = n;
        t1 = setLow(((z_h + z_l) + dp_h[k]) + t, 0);
        t2 = z_l - (((t1 - t) - dp_h[k]) - z_h);
    }
    // split y into y1 + y2 and compute (y1 + y2) * (t1 + t2)
    y1 = setLow(y, 0);
    p_l = (y - y1) * t1 + y * t2;
    p_h = y1 * t1;
    z = p_l + p_h;
    j = high(z);
    i = low(z);
    if (j >= 0x40900000) {
        if (((j - 0x40900000) | i) !== 0)
            return s * huge * huge;
        if (p_l + ovt > z - p_h)
            return s * huge * huge;
    }
    else if ((j & 0x7fffffff) >= 0x4090cc00) {
        if (((j - (0xc090cc00 | 0)) | i) !== 0)
            return s * tiny * tiny;
        if (p_l <= z - p_h)
            return s * tiny * tiny;
    }
    // 2**(p_h + p_l)
    i = j & 0x7fffffff;
    k = (i >> 20) - 0x3ff;
    n = 0;
    if (i > 0x3fe00000) {
        n = (j + (0x00100000 >> (k + 1))) | 0;
        k = ((n & 0x7fffffff) >> 20) - 0x3ff;
        t = setHigh(0, n & ~(0x000fffff >> k));
        n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
        if (j < 0)
            n = -n;
        p_h -= t;
    }
    t = setLow(p_l + p_h, 0);
    u = t * lg2_h;
    v = (p_l - (t - p_h)) * lg2 + t * lg2_l;
    z = u + v;
    w = v - (z - u);
    t = z * z;
    t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    r = (z * t1) / ((t1 - 2) - (w + z * w));
    z = 1 - (r - z);
    j = (high(z) + (n << 20)) | 0;
    if (j >> 20 <= 0)
        z = scalbn(z, n);
    else
        z = setHigh(z, (high(z) + (n << 20)) | 0);
    return s * z;
}
