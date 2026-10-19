"""Seeded particle-noise thumbnail; the ``classic`` variant ports NoiseThumb.astro exactly."""

from __future__ import annotations

import math
from typing import List, Optional

from .jsnum import js_number_to_string, js_to_fixed
from .noise import Point, dot_path, gauss, rng
from .svg import class_list, el

TONE_ACCENTS = {"blue": "#93c5fd", "violet": "#a78bfa", "mono": "#d4d4d8"}


def classic_noise_thumb(
    seed: float,
    width: float = 160,
    height: float = 110,
    dots: float = 260,
    tone: str = "violet",
    class_name: Optional[str] = None,
    **_ignored: object,
) -> str:
    width = float(width)
    height = float(height)
    r = rng(seed)
    accent = "#93c5fd" if tone == "blue" else "#a78bfa" if tone == "violet" else "#d4d4d8"

    clusters = []
    for _ in range(2 + math.floor(r() * 3)):
        x = width * (0.15 + r() * 0.7)
        y = height * (0.15 + r() * 0.7)
        sx = width * (0.04 + r() * 0.1)
        sy = height * (0.04 + r() * 0.1)
        clusters.append((x, y, sx, sy))
    filaments = []
    for _ in range(3 + math.floor(r() * 3)):
        filaments.append(tuple(r() * (width if k % 2 == 0 else height) for k in range(6)))

    bright: List[Point] = []
    dim: List[Point] = []
    tint: List[Point] = []
    i = 0
    while i < dots:
        i += 1
        pick = r()
        if pick < 0.42:
            cx, cy, csx, csy = clusters[math.floor(r() * len(clusters))]
            px = cx + gauss(r) * csx
            py = cy + gauss(r) * csy
        elif pick < 0.78:
            x0, y0, x1, y1, x2, y2 = filaments[math.floor(r() * len(filaments))]
            t = r()
            u = 1 - t
            px = u * u * x0 + 2 * u * t * x1 + t * t * x2 + gauss(r) * width * 0.012
            py = u * u * y0 + 2 * u * t * y1 + t * t * y2 + gauss(r) * height * 0.012
        elif pick < 0.88:
            y = height * (math.floor(r() * 9) + 1) * 0.1
            px = r() * width
            py = y + gauss(r) * 0.6
        else:
            px = r() * width
            py = r() * height
        if px < 0 or px > width or py < 0 or py > height:
            continue
        bucket = r()
        (bright if bucket < 0.3 else tint if bucket < 0.6 else dim).append((px, py))

    lines = []
    for _ in range(2):
        y = height * (0.2 + r() * 0.6)
        lines.append((width * r() * 0.3, width * (0.7 + r() * 0.3), y))
    gx, gy, gsx, gsy = clusters[0]
    gid = f"qn-glow-{js_number_to_string(seed)}"

    defs = el("defs", [], el("radialGradient", [("id", gid)],
        el("stop", [("offset", "0"), ("stop-color", accent), ("stop-opacity", "0.32")])
        + el("stop", [("offset", "1"), ("stop-color", accent), ("stop-opacity", "0")])))
    body = (
        defs
        + el("ellipse", [
            ("cx", js_to_fixed(gx, 1)),
            ("cy", js_to_fixed(gy, 1)),
            ("rx", js_to_fixed(gsx * 3, 1)),
            ("ry", js_to_fixed(gsy * 3, 1)),
            ("fill", f"url(#{gid})"),
        ])
        + "".join(
            el("line", [
                ("x1", x1), ("y1", y), ("x2", x2), ("y2", y),
                ("stroke", "#fafafa"), ("stroke-opacity", "0.12"), ("stroke-width", "0.5"),
            ])
            for x1, x2, y in lines
        )
        + el("path", [("d", dot_path(dim)), ("stroke", "#a1a1aa"), ("stroke-opacity", "0.45"), ("stroke-width", "0.9"), ("stroke-linecap", "round")])
        + el("path", [("d", dot_path(tint)), ("stroke", accent), ("stroke-opacity", "0.75"), ("stroke-width", "1.1"), ("stroke-linecap", "round")])
        + el("path", [("d", dot_path(bright)), ("stroke", "#fafafa"), ("stroke-opacity", "0.9"), ("stroke-width", "1.3"), ("stroke-linecap", "round")])
    )
    return el("svg", [
        ("aria-hidden", "true"),
        ("focusable", "false"),
        ("class", class_list("qn-noise", class_name)),
        ("viewBox", f"0 0 {js_number_to_string(width)} {js_number_to_string(height)}"),
        ("preserveAspectRatio", "xMidYMid slice"),
    ], body)
