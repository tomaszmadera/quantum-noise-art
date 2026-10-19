"""JavaScript number semantics needed for byte-identical output.

The original generator runs in JavaScript. Python's ``round``, ``str`` and
``%.1f`` behave differently from ``Math.round``, ``String(number)`` and
``Number.prototype.toFixed``, and Python has no 32-bit integer wrap-around,
so those operations are reimplemented here.
"""

from __future__ import annotations

import math
from decimal import ROUND_HALF_UP, Decimal

_U32 = 0x1_0000_0000


def to_uint32(x: float | int) -> int:
    """ECMAScript ToUint32 (``x >>> 0``)."""
    if isinstance(x, float):
        if not math.isfinite(x):
            return 0
        x = math.trunc(x)
    return int(x) % _U32


def to_int32(x: float | int) -> int:
    """ECMAScript ToInt32 (``x | 0``)."""
    n = to_uint32(x)
    return n - _U32 if n >= 0x8000_0000 else n


def imul(a: int, b: int) -> int:
    """``Math.imul``: 32-bit multiplication with wrap-around, signed result."""
    return to_int32(to_uint32(a) * to_uint32(b))


def js_round(x: float) -> float:
    """``Math.round``: rounds half up (towards +Infinity), keeps -0."""
    if not math.isfinite(x) or x == 0:
        return x
    f = math.floor(x)
    r = f + 1 if x - f >= 0.5 else f
    if r == 0 and x < 0:
        return -0.0
    return float(r)


def js_number_to_string(x: float | int) -> str:
    """``String(number)`` (ECMAScript Number::toString with radix 10)."""
    x = float(x)
    if x != x:
        return "NaN"
    if x == 0:
        return "0"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    sign = "-" if x < 0 else ""
    # repr() gives the shortest round-tripping digits, like ECMAScript does.
    text = repr(abs(x))
    mantissa, _, exp_text = text.partition("e")
    exponent = int(exp_text) if exp_text else 0
    int_part, _, frac_part = mantissa.partition(".")
    digits = int_part + frac_part
    point = len(int_part) + exponent
    stripped = digits.lstrip("0")
    point -= len(digits) - len(stripped)
    digits = stripped.rstrip("0") or "0"
    k = len(digits)
    n = point  # value = 0.digits * 10**n
    if k <= n <= 21:
        out = digits + "0" * (n - k)
    elif 0 < n <= 21:
        out = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        exp = ("+" if e >= 0 else "-") + str(abs(e))
        out = digits + "e" + exp if k == 1 else digits[0] + "." + digits[1:] + "e" + exp
    return sign + out


def js_to_fixed(x: float | int, digits: int) -> str:
    """``Number.prototype.toFixed``: exact binary value, ties rounded up."""
    x = float(x)
    if x != x:
        return "NaN"
    if abs(x) >= 1e21:
        return js_number_to_string(x)
    q = Decimal(abs(x)).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP)
    text = format(q, "f")
    return ("-" + text) if x < 0 else text
