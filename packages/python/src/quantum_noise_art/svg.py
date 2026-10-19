"""Markup helpers that serialise attributes the way Astro 7 does."""

from __future__ import annotations

from typing import Iterable, Optional, Tuple, Union

from .jsnum import js_number_to_string

AttrValue = Union[str, int, float, None]

XMLNS = ' xmlns="http://www.w3.org/2000/svg"'


def escape_attr(value: str) -> str:
    """Escape ``&`` and ``"`` (Astro's ``toAttributeString``)."""
    if "&" not in value and '"' not in value:
        return value
    return value.replace("&", "&amp;").replace('"', "&quot;")


def _to_str(value: AttrValue) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, bool):
        return "true" if value else "false"
    return js_number_to_string(value)


def attr(name: str, value: AttrValue) -> str:
    """One attribute: omitted for None, bare key for an empty string."""
    if value is None:
        return ""
    text = _to_str(value)
    if text == "":
        return f" {name}"
    return f' {name}="{escape_attr(text)}"'


def el(name: str, attrs: Iterable[Tuple[str, AttrValue]], children: str = "") -> str:
    """An element with an explicit close tag (Astro renders ``<x />`` as ``<x></x>``)."""
    return f"<{name}{''.join(attr(k, v) for k, v in attrs)}>{children}</{name}>"


def class_list(base: str, extra: Optional[str] = None) -> str:
    """Astro's ``class:list={[base, extra]}`` for one optional extra class string."""
    return f"{base} {extra}" if extra else base


def with_xmlns(svg: str) -> str:
    """Add the SVG namespace so the markup also works as a standalone .svg file."""
    return f"<svg{XMLNS}{svg[4:]}" if svg.startswith("<svg") else svg
