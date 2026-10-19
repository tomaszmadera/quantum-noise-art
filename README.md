# quantum-noise-art

Seeded, dependency-free generators for the procedural space, nebula and orbit
graphics used on [quantumnoise.dev](https://quantumnoise.dev). The same seed and
options always give the same SVG.

The repository has two packages with the same API:

- **TypeScript / JavaScript** (`packages/ts`, npm name `quantum-noise-art`): ESM,
  zero runtime dependencies, pure functions that return SVG strings. Works in
  Node.js, Astro, Vite and any other ESM environment.
- **Python** (`packages/python`, import name `quantum_noise_art`): a port with no
  runtime dependencies, for Python tools such as gitgeist.

The default `classic` variant reproduces the site's original Astro components
(`NoiseThumb.astro`, `OrbitField.astro`) **byte for byte**, in both languages.

## Generators

| Function (TS / Python) | What it draws | Options |
| --- | --- | --- |
| `noiseThumb` / `noise_thumb` | Particle "nebula" thumbnail: Gaussian clusters, curved filaments, torn scanlines, dust, a soft glow | `seed`, `width` (160), `height` (110), `dots` (260), `tone` (`'violet'`, `'blue'`, `'mono'`), `class` / `class_name`, `variant` (`'classic'`), `xmlns` (false) |
| `orbitField` / `orbit_field` | Hero visual: seven tilted orbits, a dense core, dust and marker squares in an 820x560 viewBox | `seed` (1729), `class` / `class_name`, `variant`, `xmlns` |

The output is meant to be inlined in HTML, exactly as on the site (no `xmlns`
attribute, `aria-hidden="true"`). Pass `xmlns: true` (`xmlns=True` in Python)
to get markup you can save as a standalone `.svg` file. That option only adds
the namespace attribute.

## TypeScript / JavaScript

```sh
npm install github:tomaszmadera/quantum-noise-art
```

The package is not on the npm registry yet. The compiled output
(`packages/ts/dist`) is committed, so a git install needs no build step. Pin a
commit for reproducible builds: `github:tomaszmadera/quantum-noise-art#<sha>`.

```ts
import { noiseThumb, orbitField } from 'quantum-noise-art';

const thumb = noiseThumb({ seed: 4242, width: 420, height: 260, dots: 1100, class: 'absolute inset-0' });
const hero = orbitField({ seed: 1729 });
const file = noiseThumb({ seed: 909, tone: 'mono', xmlns: true }); // standalone .svg
```

In an Astro component:

```astro
---
import { noiseThumb } from 'quantum-noise-art';
const { seed, ...rest } = Astro.props;
---
<Fragment set:html={noiseThumb({ seed, ...rest })} />
```

Low-level helpers are exported too: `rng` (mulberry32), `gauss` (Box-Muller),
`dotPath`, `rotate`, `pad2`, plus the markup helpers `el`, `attr`,
`escapeAttr`, `classList` and `withXmlns`.

## Python

```sh
pip install "git+https://github.com/tomaszmadera/quantum-noise-art.git#subdirectory=packages/python"
```

```python
from quantum_noise_art import noise_thumb, orbit_field

thumb = noise_thumb(4242, width=420, height=260, dots=1100, class_name="absolute inset-0")
hero = orbit_field(1729)

with open("portrait.svg", "w", encoding="utf-8") as f:
    f.write(noise_thumb(2024, width=480, height=270, dots=650, tone="mono", xmlns=True))
```

Helpers: `rng`, `gauss`, `dot_path`, `rotate`, `pad2`, and the JavaScript
number semantics the port needs: `js_round` (`Math.round`),
`js_number_to_string` (`String(number)`), `js_to_fixed` (`toFixed`),
`to_int32`, `to_uint32`, `imul`. Python 3.9 or newer.

## Variants

Both packages keep a small registry of variants per generator. `classic` is
the default and is frozen: it must keep matching the fixtures. New looks
should be added as new variants rather than changes to `classic`.

```ts
import { registerVariant, classicNoiseThumb, noiseThumb, listVariants } from 'quantum-noise-art';

registerVariant('noiseThumb', 'inverted', (o) => classicNoiseThumb(o).replaceAll('#fafafa', '#18181b'));
noiseThumb({ seed: 7, variant: 'inverted' });
listVariants('noiseThumb'); // ['classic', 'inverted']
```

```python
from quantum_noise_art import register_variant, classic_noise_thumb, noise_thumb

register_variant("noise_thumb", "inverted", lambda **o: classic_noise_thumb(**o).replace("#fafafa", "#18181b"))
noise_thumb(7, variant="inverted")
```

A renderer receives the generator's options (in Python as keyword arguments)
and returns an SVG string. `xmlns` is applied after the variant renders.

## How exactness is checked

- `fixtures/*.svg` are golden files rendered by the **original Astro
  components** (copied verbatim into `tools/golden`) with Astro 7.4.0 for the
  props in `fixtures/cases.json`: every usage on the site, all three tones for
  the site's seeds, defaults and edge cases (negative, fractional and > 2^32
  seeds, tiny and fractional sizes, zero dots, attribute escaping). The 16
  graphics in the site's production build are identical to the corresponding
  fixtures.
- The TypeScript tests and the Python tests compare their output with those
  files byte for byte. Byte-identical markup also means pixel-identical
  rendering.
- `tools/crosscheck` renders random cases in both languages and compares
  hashes.
- `tools/ci/github-actions-ci.yml` is the GitHub Actions workflow (Node.js
  20/22/24, Python 3.9/3.13 on Linux, Windows and macOS, plus a 300-case
  cross-check). It is not enabled yet: it becomes active once it is moved to
  `.github/workflows/ci.yml`.

Reproducing JavaScript in Python needs care in a few places, all covered by
tests:

- 32-bit integer math in mulberry32 (`Math.imul`, `>>>`, `| 0`).
- `Math.round` rounds halves up; Python's `round` rounds halves to even.
- `toFixed` rounds the exact binary value with ties up; Python's `%.1f` does not.
- `String(number)`: `146` rather than `146.0`, `1e+21`, `1.5e-7`, `-0` as `0`.
- `Math.sin`, `Math.cos`, `Math.log` and `Math.pow`: V8 (Node.js) uses fdlibm,
  while Python's `math` uses the platform C library. They differ in the last
  bit for a few percent of inputs, so the Python package ships pure-Python
  ports of the fdlibm routines (`quantum_noise_art.fdlibm`), checked against
  vectors recorded from Node.js (`fixtures/math-vectors.txt`).

## Limitations

- Exactness is verified against Node.js (V8), the engine the site builds
  with. Other JavaScript engines (Bun, Deno's or browsers' builds of V8 with
  different math settings, Safari) may compute `Math.sin`/`cos`/`log`/`pow`
  differently in the last bit. The final coordinates are rounded to 0.1, so
  this would very rarely change any output, but it is not guaranteed. The
  `engine` test detects such an engine.
- In Python, `sin`/`cos` arguments above about 823,000 fall back to the
  platform `math` module. The generators never get near that.
- `seed`, sizes and dot counts are treated as JavaScript numbers (doubles);
  integers above 2^53 lose precision in both languages the same way.
- Not published to npm or PyPI yet; install from GitHub as shown above.

## Development

```sh
npm ci
npm test               # builds packages/ts/dist and runs the TS tests
npm run test:python    # Python tests (no dependencies)

# Cross-check both implementations on random cases
npm run build
node tools/crosscheck/generate.mjs 2000 > /tmp/cases.jsonl
python3 tools/crosscheck/check.py /tmp/cases.jsonl

# Regenerate the golden fixtures from the original Astro components
# (only needed when adding cases; needs Node.js >= 22.22)
cd tools/golden && npm install && npm run golden
```

Commit `packages/ts/dist` after changing the TypeScript sources; the CI
workflow fails if it is out of date.

## License

MIT, copyright Tomasz Madera.
