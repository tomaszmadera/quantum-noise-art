"""Pure-Python ports of the fdlibm routines that V8 (Node.js, Chrome) uses for
``Math.sin``, ``Math.cos``, ``Math.log`` and ``Math.pow``.

Python's ``math`` module calls the platform C library, which often differs
from V8 in the last bit (glibc's ``log`` disagrees with V8 for a few percent
of inputs). These ports follow v8/src/base/ieee754.cc operation for operation
so that the Python generators see exactly the same doubles as JavaScript.

Only the argument ranges the generators can reach need to be exact; for
``|x| > 2**19 * pi/2`` sin/cos fall back to ``math`` (fdlibm's large-argument
reduction is not ported).
"""

from __future__ import annotations

import math
import struct

_pack = struct.Struct("<d").pack
_unpack = struct.Struct("<d").unpack
_pack_q = struct.Struct("<Q").pack
_unpack_q = struct.Struct("<Q").unpack


def _bits(x: float) -> int:
    return _unpack_q(_pack(x))[0]


def _from_bits(b: int) -> float:
    return _unpack(_pack_q(b & 0xFFFFFFFFFFFFFFFF))[0]


def _s32(v: int) -> int:
    v &= 0xFFFFFFFF
    return v - 0x100000000 if v & 0x80000000 else v


def _high(x: float) -> int:
    """GET_HIGH_WORD into a signed int32."""
    return _s32(_bits(x) >> 32)


def _low(x: float) -> int:
    """GET_LOW_WORD as uint32."""
    return _bits(x) & 0xFFFFFFFF


def _set_high(x: float, hi: int) -> float:
    return _from_bits(((hi & 0xFFFFFFFF) << 32) | (_bits(x) & 0xFFFFFFFF))


def _set_low(x: float, lo: int) -> float:
    return _from_bits((_bits(x) & 0xFFFFFFFF00000000) | (lo & 0xFFFFFFFF))


def _insert(hi: int, lo: int) -> float:
    return _from_bits(((hi & 0xFFFFFFFF) << 32) | (lo & 0xFFFFFFFF))


# --- sin / cos -------------------------------------------------------------

_NPIO2_HW = (
    0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C,
    0x4025FDBB, 0x402921FB, 0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C,
    0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A,
    0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
    0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB,
    0x404858EB, 0x404921FB,
)
_INVPIO2 = 6.36619772367581382433e-01
_PIO2_1 = 1.57079632673412561417e00
_PIO2_1T = 6.07710050650619224932e-11
_PIO2_2 = 6.07710050630396597660e-11
_PIO2_2T = 2.02226624879595063154e-21
_PIO2_3 = 2.02226624871116645580e-21
_PIO2_3T = 8.47842766036889956997e-32


def _rem_pio2(x: float):
    """__ieee754_rem_pio2 for |x| <= 2**19*(pi/2). Returns (n, y0, y1) or None."""
    hx = _high(x)
    ix = hx & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return 0, x, 0.0
    if ix < 0x4002D97C:
        if hx > 0:
            z = x - _PIO2_1
            if ix != 0x3FF921FB:
                y0 = z - _PIO2_1T
                y1 = (z - y0) - _PIO2_1T
            else:
                z -= _PIO2_2
                y0 = z - _PIO2_2T
                y1 = (z - y0) - _PIO2_2T
            return 1, y0, y1
        z = x + _PIO2_1
        if ix != 0x3FF921FB:
            y0 = z + _PIO2_1T
            y1 = (z - y0) + _PIO2_1T
        else:
            z += _PIO2_2
            y0 = z + _PIO2_2T
            y1 = (z - y0) + _PIO2_2T
        return -1, y0, y1
    if ix <= 0x413921FB:
        t = abs(x)
        n = int(t * _INVPIO2 + 0.5)
        fn = float(n)
        r = t - fn * _PIO2_1
        w = fn * _PIO2_1T
        if n < 32 and ix != _NPIO2_HW[n - 1]:
            y0 = r - w
        else:
            j = ix >> 20
            y0 = r - w
            high = _bits(y0) >> 32
            i = j - ((high >> 20) & 0x7FF)
            if i > 16:
                t = r
                w = fn * _PIO2_2
                r = t - w
                w = fn * _PIO2_2T - ((t - r) - w)
                y0 = r - w
                high = _bits(y0) >> 32
                i = j - ((high >> 20) & 0x7FF)
                if i > 49:
                    t = r
                    w = fn * _PIO2_3
                    r = t - w
                    w = fn * _PIO2_3T - ((t - r) - w)
                    y0 = r - w
        y1 = (r - y0) - w
        if hx < 0:
            return -n, -y0, -y1
        return n, y0, y1
    return None


_C1 = 4.16666666666666019037e-02
_C2 = -1.38888888888741095749e-03
_C3 = 2.48015872894767294178e-05
_C4 = -2.75573143513906633035e-07
_C5 = 2.08757232129817482790e-09
_C6 = -1.13596475577881948265e-11


def _kernel_cos(x: float, y: float) -> float:
    ix = _high(x) & 0x7FFFFFFF
    if ix < 0x3E400000:
        if int(x) == 0:
            return 1.0
    z = x * x
    r = z * (_C1 + z * (_C2 + z * (_C3 + z * (_C4 + z * (_C5 + z * _C6)))))
    if ix < 0x3FD33333:
        return 1.0 - (0.5 * z - (z * r - x * y))
    if ix > 0x3FE90000:
        qx = 0.28125
    else:
        qx = _insert(ix - 0x00200000, 0)
    iz = 0.5 * z - qx
    a = 1.0 - qx
    return a - (iz - (z * r - x * y))


_S1 = -1.66666666666666324348e-01
_S2 = 8.33333333332248946124e-03
_S3 = -1.98412698298579493134e-04
_S4 = 2.75573137070700676789e-06
_S5 = -2.50507602534068634195e-08
_S6 = 1.58969099521155010221e-10


def _kernel_sin(x: float, y: float, iy: int) -> float:
    ix = _high(x) & 0x7FFFFFFF
    if ix < 0x3E400000:
        if int(x) == 0:
            return x
    z = x * x
    v = z * x
    r = _S2 + z * (_S3 + z * (_S4 + z * (_S5 + z * _S6)))
    if iy == 0:
        return x + v * (_S1 + z * r)
    return x - ((z * (0.5 * y - v * r) - y) - v * _S1)


def sin(x: float) -> float:
    """V8 ``Math.sin``."""
    ix = _high(x) & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return _kernel_sin(x, 0.0, 0)
    if ix >= 0x7FF00000:
        return x - x
    red = _rem_pio2(x)
    if red is None:
        return math.sin(x)
    n, y0, y1 = red
    q = n & 3
    if q == 0:
        return _kernel_sin(y0, y1, 1)
    if q == 1:
        return _kernel_cos(y0, y1)
    if q == 2:
        return -_kernel_sin(y0, y1, 1)
    return -_kernel_cos(y0, y1)


def cos(x: float) -> float:
    """V8 ``Math.cos``."""
    ix = _high(x) & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return _kernel_cos(x, 0.0)
    if ix >= 0x7FF00000:
        return x - x
    red = _rem_pio2(x)
    if red is None:
        return math.cos(x)
    n, y0, y1 = red
    q = n & 3
    if q == 0:
        return _kernel_cos(y0, y1)
    if q == 1:
        return -_kernel_sin(y0, y1, 1)
    if q == 2:
        return -_kernel_cos(y0, y1)
    return _kernel_sin(y0, y1, 1)


# --- log ---------------------------------------------------------------------

_LN2_HI = 6.93147180369123816490e-01
_LN2_LO = 1.90821492927058770002e-10
_TWO54 = 1.80143985094819840000e16
_LG1 = 6.666666666666735130e-01
_LG2 = 3.999999999940941908e-01
_LG3 = 2.857142874366239149e-01
_LG4 = 2.222219843214978396e-01
_LG5 = 1.818357216161805012e-01
_LG6 = 1.531383769920937332e-01
_LG7 = 1.479819860511658591e-01


def log(x: float) -> float:
    """V8 ``Math.log``."""
    b = _bits(x)
    hx = _s32(b >> 32)
    lx = b & 0xFFFFFFFF
    k = 0
    if hx < 0x00100000:
        if ((hx & 0x7FFFFFFF) | lx) == 0:
            return -math.inf
        if hx < 0:
            return math.nan
        k -= 54
        x *= _TWO54
        hx = _high(x)
    if hx >= 0x7FF00000:
        return x + x
    k += (hx >> 20) - 1023
    hx &= 0x000FFFFF
    i = (hx + 0x95F64) & 0x100000
    x = _set_high(x, hx | (i ^ 0x3FF00000))
    k += i >> 20
    f = x - 1.0
    if (0x000FFFFF & (2 + hx)) < 3:
        if f == 0.0:
            if k == 0:
                return 0.0
            dk = float(k)
            return dk * _LN2_HI + dk * _LN2_LO
        R = f * f * (0.5 - 0.33333333333333333 * f)
        if k == 0:
            return f - R
        dk = float(k)
        return dk * _LN2_HI - ((R - dk * _LN2_LO) - f)
    s = f / (2.0 + f)
    dk = float(k)
    z = s * s
    i = hx - 0x6147A
    w = z * z
    j = 0x6B851 - hx
    t1 = w * (_LG2 + w * (_LG4 + w * _LG6))
    t2 = z * (_LG1 + w * (_LG3 + w * (_LG5 + w * _LG7)))
    i |= j
    R = t2 + t1
    if i > 0:
        hfsq = 0.5 * f * f
        if k == 0:
            return f - (hfsq - s * (hfsq + R))
        return dk * _LN2_HI - ((hfsq - (s * (hfsq + R) + dk * _LN2_LO)) - f)
    if k == 0:
        return f - s * (f - R)
    return dk * _LN2_HI - ((s * (f - R) - dk * _LN2_LO) - f)


# --- pow ---------------------------------------------------------------------

_BP = (1.0, 1.5)
_DP_H = (0.0, 5.84962487220764160156e-01)
_DP_L = (0.0, 1.35003920212974897128e-08)
_TWO53 = 9007199254740992.0
_HUGE = 1.0e300
_TINY = 1.0e-300
_L1 = 5.99999999999994648725e-01
_L2 = 4.28571428578550184252e-01
_L3 = 3.33333329818377432918e-01
_L4 = 2.72728123808534006489e-01
_L5 = 2.30660745775561754067e-01
_L6 = 2.06975017800338417784e-01
_P1 = 1.66666666666666019037e-01
_P2 = -2.77777777770155933842e-03
_P3 = 6.61375632143793436117e-05
_P4 = -1.65339022054652515390e-06
_P5 = 4.13813679705723846039e-08
_LG2C = 6.93147180559945286227e-01
_LG2_H = 6.93147182464599609375e-01
_LG2_L = -1.90465429995776804525e-09
_OVT = 8.0085662595372944372e-017
_CP = 9.61796693925975554329e-01
_CP_H = 9.61796700954437255859e-01
_CP_L = -7.02846165095275826516e-09
_IVLN2 = 1.44269504088896338700e00
_IVLN2_H = 1.44269502162933349609e00
_IVLN2_L = 1.92596299112661746887e-08


def pow(x: float, y: float) -> float:  # noqa: A001 - mirrors Math.pow
    """``x ** y`` exactly as V8 12 (Node.js <= 22) computes ``Math.pow``.

    Node.js 24 (V8 13) changed ``Math.pow``; both packages use this fdlibm
    port instead, so results do not depend on the JavaScript engine.
    """
    x = float(x)
    y = float(y)
    bx = _bits(x)
    by = _bits(y)
    hx = _s32(bx >> 32)
    lx = bx & 0xFFFFFFFF
    hy = _s32(by >> 32)
    ly = by & 0xFFFFFFFF
    ix = hx & 0x7FFFFFFF
    iy = hy & 0x7FFFFFFF

    if (iy | ly) == 0:
        return 1.0
    if ix > 0x7FF00000 or (ix == 0x7FF00000 and lx != 0) or iy > 0x7FF00000 or (iy == 0x7FF00000 and ly != 0):
        return x + y

    # yisint = 0: y not an integer, 1: odd integer, 2: even integer (only when x < 0)
    yisint = 0
    if hx < 0:
        if iy >= 0x43400000:
            yisint = 2
        elif iy >= 0x3FF00000:
            k = (iy >> 20) - 0x3FF
            if k > 20:
                j = ly >> (52 - k)
                if ((j << (52 - k)) & 0xFFFFFFFF) == ly:
                    yisint = 2 - (j & 1)
            elif ly == 0:
                j = iy >> (20 - k)
                if (j << (20 - k)) == iy:
                    yisint = 2 - (j & 1)

    if ly == 0:
        if iy == 0x7FF00000:
            if ((ix - 0x3FF00000) | lx) == 0:
                return y - y
            if ix >= 0x3FF00000:
                return y if hy >= 0 else 0.0
            return -y if hy < 0 else 0.0
        if iy == 0x3FF00000:
            if hy < 0:
                return 1.0 / x if x != 0 else math.copysign(math.inf, x)
            return x
        if hy == 0x40000000:
            return x * x
        if hy == 0x3FE00000 and hx >= 0:
            return math.sqrt(x)

    ax = abs(x)
    if lx == 0 and (ix == 0x7FF00000 or ix == 0 or ix == 0x3FF00000):
        z = ax
        if hy < 0:
            z = 1.0 / z if z != 0 else math.inf
        if hx < 0:
            if ((ix - 0x3FF00000) | yisint) == 0:
                z = math.nan
            elif yisint == 1:
                z = -z
        return z

    n = (hx >> 31) + 1
    if (n | yisint) == 0:
        return math.nan

    s = 1.0
    if (n | (yisint - 1)) == 0:
        s = -1.0

    if iy > 0x41E00000:
        if iy > 0x43F00000:
            if ix <= 0x3FEFFFFF:
                return _HUGE * _HUGE if hy < 0 else _TINY * _TINY
            if ix >= 0x3FF00000:
                return _HUGE * _HUGE if hy > 0 else _TINY * _TINY
        if ix < 0x3FEFFFFF:
            return s * _HUGE * _HUGE if hy < 0 else s * _TINY * _TINY
        if ix > 0x3FF00000:
            return s * _HUGE * _HUGE if hy > 0 else s * _TINY * _TINY
        t = ax - 1.0
        w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25))
        u = _IVLN2_H * t
        v = t * _IVLN2_L - w * _IVLN2
        t1 = _set_low(u + v, 0)
        t2 = v - (t1 - u)
    else:
        n = 0
        if ix < 0x00100000:
            ax *= _TWO53
            n -= 53
            ix = _high(ax)
        n += (ix >> 20) - 0x3FF
        j = ix & 0x000FFFFF
        ix = j | 0x3FF00000
        if j <= 0x3988E:
            k = 0
        elif j < 0xBB67A:
            k = 1
        else:
            k = 0
            n += 1
            ix -= 0x00100000
        ax = _set_high(ax, ix)

        u = ax - _BP[k]
        v = 1.0 / (ax + _BP[k])
        ss = u * v
        s_h = _set_low(ss, 0)
        t_h = _set_high(0.0, ((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18))
        t_l = ax - (t_h - _BP[k])
        s_l = v * ((u - s_h * t_h) - s_h * t_l)
        s2 = ss * ss
        r = s2 * s2 * (_L1 + s2 * (_L2 + s2 * (_L3 + s2 * (_L4 + s2 * (_L5 + s2 * _L6)))))
        r += s_l * (s_h + ss)
        s2 = s_h * s_h
        t_h = _set_low(3.0 + s2 + r, 0)
        t_l = r - ((t_h - 3.0) - s2)
        u = s_h * t_h
        v = s_l * t_h + t_l * ss
        p_h = _set_low(u + v, 0)
        p_l = v - (p_h - u)
        z_h = _CP_H * p_h
        z_l = _CP_L * p_h + p_l * _CP + _DP_L[k]
        t = float(n)
        t1 = _set_low((((z_h + z_l) + _DP_H[k]) + t), 0)
        t2 = z_l - (((t1 - t) - _DP_H[k]) - z_h)

    y1 = _set_low(y, 0)
    p_l = (y - y1) * t1 + y * t2
    p_h = y1 * t1
    z = p_l + p_h
    bz = _bits(z)
    j = _s32(bz >> 32)
    i = bz & 0xFFFFFFFF
    if j >= 0x40900000:
        if ((j - 0x40900000) | i) != 0:
            return s * _HUGE * _HUGE
        if p_l + _OVT > z - p_h:
            return s * _HUGE * _HUGE
    elif (j & 0x7FFFFFFF) >= 0x4090CC00:
        if ((j - _s32(0xC090CC00)) | i) != 0:
            return s * _TINY * _TINY
        if p_l <= z - p_h:
            return s * _TINY * _TINY
    i = j & 0x7FFFFFFF
    k = (i >> 20) - 0x3FF
    n = 0
    if i > 0x3FE00000:
        n = j + (0x00100000 >> (k + 1))
        k = ((n & 0x7FFFFFFF) >> 20) - 0x3FF
        t = _set_high(0.0, n & ~(0x000FFFFF >> k))
        n = ((n & 0x000FFFFF) | 0x00100000) >> (20 - k)
        if j < 0:
            n = -n
        p_h -= t
    t = _set_low(p_l + p_h, 0)
    u = t * _LG2_H
    v = (p_l - (t - p_h)) * _LG2C + t * _LG2_L
    z = u + v
    w = v - (z - u)
    t = z * z
    t1 = z - t * (_P1 + t * (_P2 + t * (_P3 + t * (_P4 + t * _P5))))
    r = (z * t1) / ((t1 - 2.0) - (w + z * w))
    z = 1.0 - (r - z)
    j = _s32(_high(z) + _s32((n & 0xFFFFFFFF) << 20))
    if (j >> 20) <= 0:
        z = math.ldexp(z, n)
    else:
        z = _set_high(z, _high(z) + _s32((n & 0xFFFFFFFF) << 20))
    return s * z


__all__ = ["sin", "cos", "log", "pow"]
