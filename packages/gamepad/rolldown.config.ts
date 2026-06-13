import { env } from 'node:process'
import { defineConfig } from 'rolldown'
import type { RolldownOptions } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

function bundle(config: RolldownOptions): RolldownOptions {
  return {
    ...config,
    input: 'src/index.ts',
    external: ['@ineka/engine'],
  }
}

export default defineConfig([
  bundle({
    output: [{
      minify: env.NODE_ENV === 'production',
      dir: 'dist',
      entryFileNames: 'index.js',
      format: 'es',
      sourcemap: true,
    }],
  }),
  bundle({
    plugins: [dts()],
    output: {
      dir: 'dist',
      entryFileNames: 'index.d.ts',
      format: 'es',
    },
  }),
])
