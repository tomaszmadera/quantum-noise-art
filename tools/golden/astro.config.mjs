// Same rendering defaults as quantumnoise.dev (static output, compressHTML on).
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: { format: 'file' },
});
