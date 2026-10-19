export type Tone = 'violet' | 'blue' | 'mono';
export interface NoiseThumbOptions {
    seed: number;
    /** Logical size of the drawing (viewBox); it scales to fill its box. Default 160. */
    width?: number;
    /** Default 110. */
    height?: number;
    /** Dot count. Default 260. */
    dots?: number;
    /** Accent colour. Default 'violet'. Any other value renders like 'mono'. */
    tone?: Tone;
    /** Extra class names appended after `qn-noise`. */
    class?: string;
    /** Variant name. Default 'classic' (the original site look). */
    variant?: string;
    /** Add xmlns so the result works as a standalone .svg file. Default false. */
    xmlns?: boolean;
}
export declare const TONE_ACCENTS: Readonly<Record<Tone, string>>;
export declare function classicNoiseThumb(options: NoiseThumbOptions): string;
