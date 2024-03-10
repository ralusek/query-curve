const esbuild = require('esbuild');

async function build() {
  const [
    { default: dtsPlugin },
    { dTSPathAliasPlugin }
  ] = await Promise.all([
    import('esbuild-plugin-d.ts'),
    import('esbuild-plugin-d-ts-path-alias'),
  ]);
  // const dtsPlugin = (await import('esbuild-plugin-d.ts')).default;

  esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    target: 'es6',
    outdir: 'dist',
    external: ['@types/*'], // Keep type definitions external
    // mainFields: ['browser', 'module', 'main'],
    format: 'iife',
    treeShaking: true,
    plugins: [
      // dtsPlugin(),
      dTSPathAliasPlugin(),
    ],
    resolveExtensions: ['.ts', '.js'],
    loader: {
      '.ts': 'ts',
      '.js': 'js'
    },
    tsconfig: 'tsconfig.json', // Path to your tsconfig.json
  }).catch(() => process.exit(1));
}

build();
