# quantum-noise-art (Python)

Python port of the seeded SVG generators from
[quantumnoise.dev](https://quantumnoise.dev). No runtime dependencies. The
default `classic` variant produces byte-identical output to the site and to
the TypeScript package.

```python
from quantum_noise_art import noise_thumb, orbit_field

svg = noise_thumb(4242, width=420, height=260, dots=1100, xmlns=True)
hero = orbit_field(1729)
```

Install from GitHub:

```sh
pip install "git+https://github.com/tomaszmadera/quantum-noise-art.git#subdirectory=packages/python"
```

See the [main README](https://github.com/tomaszmadera/quantum-noise-art#readme) for the full API, variants and how exactness is tested.
