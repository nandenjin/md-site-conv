import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
 
export default {
  input: 'src/index.ts',
  output: {
    dir: 'lib',
    format: 'cjs',
    compact: true,
    banner: '#!/usr/bin/env node'
  },
  plugins: [
    commonjs(),
    typescript({
      declaration: true,
      declarationDir: 'lib',
      rootDir: 'src'
    })
  ]
}
