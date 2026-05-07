import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  minify: false,
  clean: true,
  target: 'esnext',
  dts: true,
  format: ['esm', 'cjs'],
  // unified/remark/* are pure ESM. Bundle them into our CJS output so the API (CJS) can
  // require() the scanner without hitting ESM-via-CJS interop weirdness.
  noExternal: [
    'unified',
    /^remark/,
    /^micromark/,
    /^mdast/,
    /^unist/,
    'mdast-util-to-string',
    'js-yaml',
    'cheerio',
    'acorn',
  ],
});
