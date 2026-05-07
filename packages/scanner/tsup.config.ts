import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  minify: false,
  clean: true,
  target: 'esnext',
  dts: true,
  format: ['esm', 'cjs'],
});
