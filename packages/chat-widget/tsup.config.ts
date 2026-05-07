import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { chat: 'src/index.ts' },
  format: ['iife'],
  globalName: 'ZivodocChat',
  outDir: 'dist',
  minify: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  platform: 'browser',
  noExternal: [/.*/],
});
