/**
 * Hero particle / orbit visual (tilted elliptical orbits, dense core, dust,
 * marker squares). The `classic` variant is a faithful port of
 * OrbitField.astro from quantumnoise.dev and produces byte-identical markup.
 * It uses the fdlibm `pow` port instead of `Math.pow`, which changed in
 * Node.js 24, so the output does not depend on the Node.js version.
 */
import { dotPath, gauss, rng, rotate, type Point } from './noise.js';
import { classList, el } from './svg.js';
import { pow } from './fdlibm.js';

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

export function classicOrbitField(options: OrbitFieldOptions = {}): string {
  const { seed = 1729, class: className } = options;
  const r = rng(seed);
  const W = 820;
  const H = 560;
  const cx = 420;
  const cy = 270;
  const tilt = -14;

  type Orbit = { rx: number; ry: number; rot: number; dashed: boolean; opacity: number };
  const orbits: Orbit[] = Array.from({ length: 7 }, (_, i) => {
    const rx = 95 + i * 46 + r() * 18;
    return {
      rx,
      ry: rx * (0.27 + r() * 0.09),
      rot: tilt + (r() - 0.5) * 12,
      dashed: r() < 0.35,
      opacity: 0.1 + r() * 0.2,
    };
  });

  const groups: Record<'white' | 'whiteBig' | 'violet' | 'blue' | 'dust', Point[]> = {
    white: [], whiteBig: [], violet: [], blue: [], dust: [],
  };
  const put = (p: Point) => {
    const c = r();
    if (c < 0.12) groups.whiteBig.push(p);
    else if (c < 0.62) groups.white.push(p);
    else if (c < 0.86) groups.violet.push(p);
    else groups.blue.push(p);
  };

  // Dots strewn along each orbit, thicker on one side for a sense of motion.
  for (const o of orbits) {
    const n = Math.round(50 + o.rx * 0.22);
    const phase = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const t = phase + pow(r(), 1.6) * Math.PI * 2;
      const p: Point = [cx + o.rx * Math.cos(t) + gauss(r) * 3.5, cy + o.ry * Math.sin(t) + gauss(r) * 2.5];
      put(rotate(p, cx, cy, o.rot));
    }
  }
  // Dense core.
  for (let i = 0; i < 300; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.abs(gauss(r)) * 34;
    put(rotate([cx + Math.cos(a) * d * 1.6, cy + Math.sin(a) * d * 0.7], cx, cy, tilt));
  }
  // Background dust.
  for (let i = 0; i < 160; i++) groups.dust.push([r() * W, r() * H]);

  // A few marker squares on the orbits.
  const markers = [1, 3, 5].map((i) => {
    const o = orbits[i];
    const t = r() * Math.PI * 2;
    return rotate([cx + o.rx * Math.cos(t), cy + o.ry * Math.sin(t)], cx, cy, o.rot);
  });
  const gid = `qn-core-${seed}`;

  const path = (d: string, stroke: string, opacity: string | null, width: string) =>
    el('path', [['d', d], ['stroke', stroke], ['stroke-opacity', opacity], ['stroke-width', width], ['stroke-linecap', 'round']]);

  const body =
    el('defs', [], el('radialGradient', [['id', gid]],
      el('stop', [['offset', '0'], ['stop-color', '#ffffff'], ['stop-opacity', '0.55']]) +
      el('stop', [['offset', '0.25'], ['stop-color', '#c4b5fd'], ['stop-opacity', '0.18']]) +
      el('stop', [['offset', '1'], ['stop-color', '#7c3aed'], ['stop-opacity', '0']]))) +
    el('ellipse', [['cx', cx], ['cy', cy], ['rx', '210'], ['ry', '120'], ['fill', `url(#${gid})`], ['transform', `rotate(${tilt} ${cx} ${cy})`]]) +
    el('line', [['x1', cx - 70], ['y1', '10'], ['x2', cx - 70], ['y2', H - 30], ['stroke', '#e4e4e7'], ['stroke-opacity', '0.22'], ['stroke-width', '0.6']]) +
    el('line', [['x1', '40'], ['y1', cy + 40], ['x2', W - 20], ['y2', cy - 90], ['stroke', '#e4e4e7'], ['stroke-opacity', '0.08'], ['stroke-width', '0.6']]) +
    orbits
      .map((o) =>
        el('ellipse', [
          ['cx', cx],
          ['cy', cy],
          ['rx', o.rx.toFixed(1)],
          ['ry', o.ry.toFixed(1)],
          ['fill', 'none'],
          ['stroke', '#e4e4e7'],
          ['stroke-opacity', o.opacity.toFixed(2)],
          ['stroke-width', '0.7'],
          ['stroke-dasharray', o.dashed ? '2 7' : undefined],
          ['transform', `rotate(${o.rot.toFixed(1)} ${cx} ${cy})`],
        ]),
      )
      .join('') +
    path(dotPath(groups.dust), '#a1a1aa', '0.35', '1') +
    path(dotPath(groups.violet), '#a78bfa', '0.85', '1.6') +
    path(dotPath(groups.blue), '#93c5fd', '0.8', '1.5') +
    path(dotPath(groups.white), '#fafafa', '0.75', '1.3') +
    path(dotPath(groups.whiteBig), '#ffffff', null, '2.6') +
    markers
      .map(([x, y]) =>
        el('rect', [
          ['x', (x - 3).toFixed(1)], ['y', (y - 3).toFixed(1)], ['width', '6'], ['height', '6'],
          ['fill', 'none'], ['stroke', '#fafafa'], ['stroke-opacity', '0.7'], ['stroke-width', '0.8'],
        ]),
      )
      .join('') +
    el('g', [['stroke', '#fafafa'], ['stroke-opacity', '0.8'], ['stroke-width', '0.8']],
      el('line', [['x1', cx - 9], ['y1', cy], ['x2', cx + 9], ['y2', cy]]) +
      el('line', [['x1', cx], ['y1', cy - 9], ['x2', cx], ['y2', cy + 9]]));

  return el('svg', [
    ['aria-hidden', 'true'],
    ['focusable', 'false'],
    ['class', classList('qn-orbit', className)],
    ['viewBox', `0 0 ${W} ${H}`],
    ['preserveAspectRatio', 'xMidYMid meet'],
  ], body);
}
