/**
 * Seeded particle-noise "thumbnail" (nebula clusters, filaments, scanlines,
 * dust). The `classic` variant is a faithful port of NoiseThumb.astro from
 * quantumnoise.dev and produces byte-identical markup.
 */
import { dotPath, gauss, rng, type Point } from './noise.js';
import { classList, el } from './svg.js';

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

export const TONE_ACCENTS: Readonly<Record<Tone, string>> = Object.freeze({
  blue: '#93c5fd',
  violet: '#a78bfa',
  mono: '#d4d4d8',
});

export function classicNoiseThumb(options: NoiseThumbOptions): string {
  const { seed, width = 160, height = 110, dots = 260, tone = 'violet', class: className } = options;
  const r = rng(seed);
  const accent = tone === 'blue' ? '#93c5fd' : tone === 'violet' ? '#a78bfa' : '#d4d4d8';

  // Gaussian clusters, curved filaments, torn scanlines and sparse dust.
  const clusters = Array.from({ length: 2 + Math.floor(r() * 3) }, () => ({
    x: width * (0.15 + r() * 0.7),
    y: height * (0.15 + r() * 0.7),
    sx: width * (0.04 + r() * 0.1),
    sy: height * (0.04 + r() * 0.1),
  }));
  const filaments = Array.from({ length: 3 + Math.floor(r() * 3) }, () => ({
    x0: r() * width,
    y0: r() * height,
    x1: r() * width,
    y1: r() * height,
    x2: r() * width,
    y2: r() * height,
  }));
  const bright: Point[] = [];
  const dim: Point[] = [];
  const tint: Point[] = [];
  for (let i = 0; i < dots; i++) {
    const pick = r();
    let p: Point;
    if (pick < 0.42) {
      const c = clusters[Math.floor(r() * clusters.length)];
      p = [c.x + gauss(r) * c.sx, c.y + gauss(r) * c.sy];
    } else if (pick < 0.78) {
      // Quadratic Bezier filament with a little scatter.
      const f = filaments[Math.floor(r() * filaments.length)];
      const t = r();
      const u = 1 - t;
      p = [
        u * u * f.x0 + 2 * u * t * f.x1 + t * t * f.x2 + gauss(r) * width * 0.012,
        u * u * f.y0 + 2 * u * t * f.y1 + t * t * f.y2 + gauss(r) * height * 0.012,
      ];
    } else if (pick < 0.88) {
      // Horizontal streaks, like a torn scanline.
      const y = height * (Math.floor(r() * 9) + 1) * 0.1;
      p = [r() * width, y + gauss(r) * 0.6];
    } else {
      p = [r() * width, r() * height];
    }
    if (p[0] < 0 || p[0] > width || p[1] < 0 || p[1] > height) continue;
    const bucket = r();
    (bucket < 0.3 ? bright : bucket < 0.6 ? tint : dim).push(p);
  }
  // A couple of faint structure lines.
  const lines = Array.from({ length: 2 }, () => {
    const y = height * (0.2 + r() * 0.6);
    return { x1: width * r() * 0.3, x2: width * (0.7 + r() * 0.3), y };
  });
  const glow = clusters[0];
  const gid = `qn-glow-${seed}`;

  const defs = el('defs', [], el('radialGradient', [['id', gid]],
    el('stop', [['offset', '0'], ['stop-color', accent], ['stop-opacity', '0.32']]) +
    el('stop', [['offset', '1'], ['stop-color', accent], ['stop-opacity', '0']])));
  const body =
    defs +
    el('ellipse', [
      ['cx', glow.x.toFixed(1)],
      ['cy', glow.y.toFixed(1)],
      ['rx', (glow.sx * 3).toFixed(1)],
      ['ry', (glow.sy * 3).toFixed(1)],
      ['fill', `url(#${gid})`],
    ]) +
    lines
      .map((l) =>
        el('line', [
          ['x1', l.x1], ['y1', l.y], ['x2', l.x2], ['y2', l.y],
          ['stroke', '#fafafa'], ['stroke-opacity', '0.12'], ['stroke-width', '0.5'],
        ]),
      )
      .join('') +
    el('path', [['d', dotPath(dim)], ['stroke', '#a1a1aa'], ['stroke-opacity', '0.45'], ['stroke-width', '0.9'], ['stroke-linecap', 'round']]) +
    el('path', [['d', dotPath(tint)], ['stroke', accent], ['stroke-opacity', '0.75'], ['stroke-width', '1.1'], ['stroke-linecap', 'round']]) +
    el('path', [['d', dotPath(bright)], ['stroke', '#fafafa'], ['stroke-opacity', '0.9'], ['stroke-width', '1.3'], ['stroke-linecap', 'round']]);

  return el('svg', [
    ['aria-hidden', 'true'],
    ['focusable', 'false'],
    ['class', classList('qn-noise', className)],
    ['viewBox', `0 0 ${width} ${height}`],
    ['preserveAspectRatio', 'xMidYMid slice'],
  ], body);
}
