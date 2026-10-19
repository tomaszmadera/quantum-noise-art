# Golden fixtures

`src/components/*.astro` and `src/lib/noise.ts` are verbatim copies of the
generator from the quantumnoise.dev site. `src/pages/[name].astro` renders one
page per entry in `../../fixtures/cases.json`, and `extract.mjs` copies each
page's `<svg>` into `../../fixtures/<name>.svg`.

```sh
npm install      # Astro 7.4.0, needs Node.js >= 22.22
npm run golden   # astro build && node extract.mjs
```

Do not edit the copied components: they define the reference output.
