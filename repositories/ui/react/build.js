const esbuild = require('esbuild');
const packageJson = require('./package.json');

// Extract peerDependencies keys
const peerDependencies = Object.keys(packageJson.peerDependencies || {});

async function build(format) {
  const [
    { default: dtsPlugin },
    { dTSPathAliasPlugin }
  ] = await Promise.all([
    import('esbuild-plugin-d.ts'),
    import('esbuild-plugin-d-ts-path-alias'),
  ]);

  esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    minify: false,
    platform: 'browser',
    outdir: `dist/${format}`,
    format, // This will be either 'cjs' or 'esm'
    external: [
      // 'react',
      // 'react-dom',
      '@types/*',
      ...peerDependencies,
    ],
    // mainFields: ['browser', 'module', 'main'],
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx'
    },
    plugins: [
      // dtsPlugin(),
      dTSPathAliasPlugin(),
    ],
    resolveExtensions: ['.tsx', '.ts', '.js'],
    tsconfig: 'tsconfig.json', // Use your tsconfig
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}


build('cjs');
build('esm');
