/**
 * Minimal markup helpers that serialise attributes the same way Astro 7 does
 * for the original components (see `addAttribute` in astro/runtime/server).
 */
type AttrValue = string | number | null | undefined;
/** Escapes `&` and `"`, as Astro's `toAttributeString` does. */
export declare function escapeAttr(value: string): string;
/** One attribute: omitted for null/undefined, bare key for an empty string. */
export declare function attr(name: string, value: AttrValue): string;
/** An element with explicit close tag (Astro renders `<x />` as `<x></x>`). */
export declare function el(name: string, attrs: [string, AttrValue][], children?: string): string;
/** Astro's `class:list={[base, extra]}` for a single optional extra class string. */
export declare function classList(base: string, extra?: string | null): string;
/** Adds the SVG namespace so the markup also works as a standalone .svg file. */
export declare function withXmlns(svg: string): string;
export {};
