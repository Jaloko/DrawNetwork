import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH;

const config = [
  {
    input: 'client/js/canvas/global.js',
    output: {
      file: 'dist/js/dn.min.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' }),
      commonjs(),
      production && terser() 
    ]
  },
  {
    input: 'client/js/functions.js',
    output: {
      file: "dist/js/functions.min.js",
      format: "iife",
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' }),
      commonjs(),
      production && terser() 
    ]
  }
];

export default config;