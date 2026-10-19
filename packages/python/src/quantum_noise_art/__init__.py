"""quantum-noise-art: seeded, dependency-free SVG generators for the space,
nebula and orbit graphics of quantumnoise.dev.

Every generator is a pure function returning an SVG string. The default
``classic`` variant reproduces the site's (and the TypeScript package's)
output byte for byte.
"""

from __future__ import annotations

from typing import Callable, Dict, List, Optional

from .jsnum import imul, js_number_to_string, js_round, js_to_fixed, to_int32, to_uint32
from .noise import Point, dot_path, gauss, pad2, rng, rotate
from .noise_thumb import TONE_ACCENTS, classic_noise_thumb
from .orbit_field import classic_orbit_field
from .svg import attr, class_list, el, escape_attr, with_xmlns

__version__ = "0.1.0"

DEFAULT_VARIANT = "classic"

Renderer = Callable[..., str]

_registry: Dict[str, Dict[str, Renderer]] = {
    "noise_thumb": {DEFAULT_VARIANT: classic_noise_thumb},
    "orbit_field": {DEFAULT_VARIANT: classic_orbit_field},
}


def register_variant(kind: str, name: str, render: Renderer) -> None:
    """Register a new variant for ``"noise_thumb"`` or ``"orbit_field"``.

    The renderer receives the generator's keyword arguments (without
    ``variant`` and ``xmlns``) and returns an SVG string.
    """
    if kind not in _registry:
        raise ValueError(f"Unknown generator: {kind}")
    if name in _registry[kind]:
        raise ValueError(f'Variant "{name}" is already registered for {kind}')
    _registry[kind][name] = render


def list_variants(kind: str) -> List[str]:
    """Names of the registered variants of a generator."""
    return list(_registry[kind])


def _render(kind: str, variant: str, xmlns: bool, options: dict) -> str:
    renderer = _registry[kind].get(variant)
    if renderer is None:
        known = ", ".join(_registry[kind])
        raise ValueError(f'Unknown {kind} variant "{variant}". Known: {known}')
    svg = renderer(**options)
    return with_xmlns(svg) if xmlns else svg


def noise_thumb(
    seed: float,
    width: float = 160,
    height: float = 110,
    dots: float = 260,
    tone: str = "violet",
    class_name: Optional[str] = None,
    variant: str = DEFAULT_VARIANT,
    xmlns: bool = False,
) -> str:
    """Seeded particle-noise thumbnail, e.g. ``noise_thumb(4242, width=420, height=260, dots=1100)``."""
    options = dict(seed=seed, width=width, height=height, dots=dots, tone=tone, class_name=class_name)
    return _render("noise_thumb", variant, xmlns, options)


def orbit_field(
    seed: float = 1729,
    class_name: Optional[str] = None,
    variant: str = DEFAULT_VARIANT,
    xmlns: bool = False,
) -> str:
    """Seeded orbit field (hero visual, 820x560 viewBox), e.g. ``orbit_field(1729)``."""
    return _render("orbit_field", variant, xmlns, dict(seed=seed, class_name=class_name))


__all__ = [
    "DEFAULT_VARIANT",
    "Point",
    "TONE_ACCENTS",
    "attr",
    "class_list",
    "classic_noise_thumb",
    "classic_orbit_field",
    "dot_path",
    "el",
    "escape_attr",
    "gauss",
    "imul",
    "js_number_to_string",
    "js_round",
    "js_to_fixed",
    "list_variants",
    "noise_thumb",
    "orbit_field",
    "pad2",
    "register_variant",
    "rng",
    "rotate",
    "to_int32",
    "to_uint32",
    "with_xmlns",
]
