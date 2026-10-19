/**
 * Minimal markup helpers that serialise attributes the same way Astro 7 does
 * for the original components (see `addAttribute` in astro/runtime/server).
 */
/** Escapes `&` and `"`, as Astro's `toAttributeString` does. */
export function escapeAttr(value) {
    if (!value.includes('&') && !value.includes('"'))
        return value;
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
/** One attribute: omitted for null/undefined, bare key for an empty string. */
export function attr(name, value) {
    if (value == null)
        return '';
    const str = String(value);
    if (str === '')
        return ` ${name}`;
    return ` ${name}="${escapeAttr(str)}"`;
}
/** An element with explicit close tag (Astro renders `<x />` as `<x></x>`). */
export function el(name, attrs, children = '') {
    return `<${name}${attrs.map(([k, v]) => attr(k, v)).join('')}>${children}</${name}>`;
}
/** Astro's `class:list={[base, extra]}` for a single optional extra class string. */
export function classList(base, extra) {
    return extra ? `${base} ${extra}` : base;
}
const XMLNS = ' xmlns="http://www.w3.org/2000/svg"';
/** Adds the SVG namespace so the markup also works as a standalone .svg file. */
export function withXmlns(svg) {
    return svg.startsWith('<svg') ? `<svg${XMLNS}${svg.slice(4)}` : svg;
}
