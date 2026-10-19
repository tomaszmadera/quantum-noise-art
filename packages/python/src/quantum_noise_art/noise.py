"""Deterministic pseudo-random helpers (port of quantumnoise.dev src/lib/noise.ts)."""

from __future__ import annotations

import math

from . import fdlibm
from typing import Callable, Iterable, Tuple

from .jsnum import imul, js_number_to_string, js_round, to_int32, to_uint32

Point = Tuple[float, float]
Rng = Callable[[], float]


def rng(seed: float | int) -> Rng:
    """mulberry32: small, fast, seeded PRNG. Same seed, same sequence as the JS version."""
    a = to_uint32(float(seed))

    def next_value() -> float:
        nonlocal a
        a = to_int32(a + 0x6D2B79F5)
        t = imul(a ^ (to_uint32(a) >> 15), 1 | a)
        t = to_int32((t + imul(t ^ (to_uint32(t) >> 7), 61 | t)) ^ t)
        return to_uint32(t ^ (to_uint32(t) >> 14)) / 4294967296

    return next_value


def gauss(r: Rng) -> float:
    """Standard normal sample (Box-Muller)."""
    u = 0.0
    while u == 0:
        u = r()
    return math.sqrt(-2 * fdlibm.log(u)) * fdlibm.cos(2 * math.pi * r())


def _round1(n: float) -> float:
    return js_round(n * 10) / 10


def dot_path(points: Iterable[Point]) -> str:
    """Many dots as one path: each dot is a zero-length segment with a round cap."""
    return "".join(
        f"M{js_number_to_string(_round1(x))} {js_number_to_string(_round1(y))}h0" for x, y in points
    )


def rotate(point: Point, cx: float, cy: float, deg: float) -> Point:
    """Rotate a point around a centre by ``deg`` degrees."""
    x, y = point
    a = (deg * math.pi) / 180
    dx = x - cx
    dy = y - cy
    return (cx + dx * fdlibm.cos(a) - dy * fdlibm.sin(a), cy + dx * fdlibm.sin(a) + dy * fdlibm.cos(a))


def pad2(n: float | int) -> str:
    """Zero-pad an index for the numbered list look (1 -> "01")."""
    return js_number_to_string(n).rjust(2, "0")


__all__ = ["Point", "Rng", "rng", "gauss", "dot_path", "rotate", "pad2"]
