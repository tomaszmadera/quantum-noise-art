export interface OrbitFieldOptions {
    /** Default 1729 (the site's hero). */
    seed?: number;
    /** Extra class names appended after `qn-orbit`. */
    class?: string;
    /** Variant name. Default 'classic' (the original site look). */
    variant?: string;
    /** Add xmlns so the result works as a standalone .svg file. Default false. */
    xmlns?: boolean;
}
export declare function classicOrbitField(options?: OrbitFieldOptions): string;
