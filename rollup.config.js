import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import vue from '@vitejs/plugin-vue';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      inlineDynamicImports: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
      inlineDynamicImports: true
    }
  ],
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'nl-wallet-button'
        }
      }
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist'
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    json(),
    copy({
      targets: [
        { src: 'src/nl-wallet-web.js', dest: 'dist' },
        { src: 'src/nl-wallet-web.d.ts', dest: 'dist' }
      ]
    })
  ],
  external: ['vue', 'axios'],
  onwarn(warning, warn) {
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
      return;
    }
    warn(warning);
  }
};