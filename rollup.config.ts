import { env } from 'node:process'
import { defineConfig } from 'rollup'
import type { RollupOptions } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import pkg from './package.json' assert { type: 'json' }

const name = pkg.main.replace(/\.js$/, '')

function bundle(config: RollupOptions): RollupOptions {
  return {
    ...config,
    input: 'src/index.ts',
    external: [],
  }
}

export default defineConfig([
  bundle({
    plugins: [esbuild({
      minify: env.NODE_ENV === 'production',
    })],
    output: [{
      file: `${name}.js`,
      format: 'es',
      sourcemap: true,
    }],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `${name}.d.ts`,
      format: 'es',
    },
  }),
])
