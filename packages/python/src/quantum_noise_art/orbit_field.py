"""Seeded orbit field (hero visual); the ``classic`` variant ports OrbitField.astro exactly."""

from __future__ import annotations

import math

from . import fdlibm
from typing import Dict, List, Optional

from .jsnum import js_number_to_string, js_round, js_to_fixed
from .noise import Point, dot_path, gauss, rng, rotate
from .svg import class_list, el


def classic_orbit_field(seed: float = 1729, class_name: Optional[str] = None, **_ignored: object) -> str:
    r = rng(seed)
    W = 820
    H = 560
    cx = 420
    cy = 270
    tilt = -14

    orbits = []
    for i in range(7):
        rx = 95 + i * 46 + r() * 18
        orbits.append({
            "rx": rx,
            "ry": rx * (0.27 + r() * 0.09),
            "rot": tilt + (r() - 0.5) * 12,
            "dashed": r() < 0.35,
            "opacity": 0.1 + r() * 0.2,
        })

    groups: Dict[str, List[Point]] = {"white": [], "whiteBig": [], "violet": [], "blue": [], "dust": []}

    def put(p: Point) -> None:
        c = r()
        if c < 0.12:
            groups["whiteBig"].append(p)
        elif c < 0.62:
            groups["white"].append(p)
        elif c < 0.86:
            groups["violet"].append(p)
        else:
            groups["blue"].append(p)

    # Dots strewn along each orbit, thicker on one side for a sense of motion.
    for o in orbits:
        n = js_round(50 + o["rx"] * 0.22)
        phase = r() * math.pi * 2
        i = 0
        while i < n:
            i += 1
            t = phase + fdlibm.pow(r(), 1.6) * math.pi * 2
            px = cx + o["rx"] * fdlibm.cos(t) + gauss(r) * 3.5
            py = cy + o["ry"] * fdlibm.sin(t) + gauss(r) * 2.5
            put(rotate((px, py), cx, cy, o["rot"]))
    # Dense core.
    for _ in range(300):
        a = r() * math.pi * 2
        d = abs(gauss(r)) * 34
        put(rotate((cx + fdlibm.cos(a) * d * 1.6, cy + fdlibm.sin(a) * d * 0.7), cx, cy, tilt))
    # Background dust.
    for _ in range(160):
        x = r() * W
        groups["dust"].append((x, r() * H))

    # A few marker squares on the orbits.
    markers = []
    for idx in (1, 3, 5):
        o = orbits[idx]
        t = r() * math.pi * 2
        markers.append(rotate((cx + o["rx"] * fdlibm.cos(t), cy + o["ry"] * fdlibm.sin(t)), cx, cy, o["rot"]))
    gid = f"qn-core-{js_number_to_string(seed)}"

    def path(d: str, stroke: str, opacity: Optional[str], width: str) -> str:
        return el("path", [("d", d), ("stroke", stroke), ("stroke-opacity", opacity), ("stroke-width", width), ("stroke-linecap", "round")])

    body = (
        el("defs", [], el("radialGradient", [("id", gid)],
            el("stop", [("offset", "0"), ("stop-color", "#ffffff"), ("stop-opacity", "0.55")])
            + el("stop", [("offset", "0.25"), ("stop-color", "#c4b5fd"), ("stop-opacity", "0.18")])
            + el("stop", [("offset", "1"), ("stop-color", "#7c3aed"), ("stop-opacity", "0")])))
        + el("ellipse", [("cx", cx), ("cy", cy), ("rx", "210"), ("ry", "120"), ("fill", f"url(#{gid})"), ("transform", f"rotate({tilt} {cx} {cy})")])
        + el("line", [("x1", cx - 70), ("y1", "10"), ("x2", cx - 70), ("y2", H - 30), ("stroke", "#e4e4e7"), ("stroke-opacity", "0.22"), ("stroke-width", "0.6")])
        + el("line", [("x1", "40"), ("y1", cy + 40), ("x2", W - 20), ("y2", cy - 90), ("stroke", "#e4e4e7"), ("stroke-opacity", "0.08"), ("stroke-width", "0.6")])
        + "".join(
            el("ellipse", [
                ("cx", cx),
                ("cy", cy),
                ("rx", js_to_fixed(o["rx"], 1)),
                ("ry", js_to_fixed(o["ry"], 1)),
                ("fill", "none"),
                ("stroke", "#e4e4e7"),
                ("stroke-opacity", js_to_fixed(o["opacity"], 2)),
                ("stroke-width", "0.7"),
                ("stroke-dasharray", "2 7" if o["dashed"] else None),
                ("transform", f"rotate({js_to_fixed(o['rot'], 1)} {cx} {cy})"),
            ])
            for o in orbits
        )
        + path(dot_path(groups["dust"]), "#a1a1aa", "0.35", "1")
        + path(dot_path(groups["violet"]), "#a78bfa", "0.85", "1.6")
        + path(dot_path(groups["blue"]), "#93c5fd", "0.8", "1.5")
        + path(dot_path(groups["white"]), "#fafafa", "0.75", "1.3")
        + path(dot_path(groups["whiteBig"]), "#ffffff", None, "2.6")
        + "".join(
            el("rect", [
                ("x", js_to_fixed(x - 3, 1)), ("y", js_to_fixed(y - 3, 1)), ("width", "6"), ("height", "6"),
                ("fill", "none"), ("stroke", "#fafafa"), ("stroke-opacity", "0.7"), ("stroke-width", "0.8"),
            ])
            for x, y in markers
        )
        + el("g", [("stroke", "#fafafa"), ("stroke-opacity", "0.8"), ("stroke-width", "0.8")],
            el("line", [("x1", cx - 9), ("y1", cy), ("x2", cx + 9), ("y2", cy)])
            + el("line", [("x1", cx), ("y1", cy - 9), ("x2", cx), ("y2", cy + 9)]))
    )
    return el("svg", [
        ("aria-hidden", "true"),
        ("focusable", "false"),
        ("class", class_list("qn-orbit", class_name)),
        ("viewBox", f"0 0 {W} {H}"),
        ("preserveAspectRatio", "xMidYMid meet"),
    ], body)
