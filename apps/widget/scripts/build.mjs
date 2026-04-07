import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/widget.js',
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  minify: !watch,
  sourcemap: watch,
  legalComments: 'none'
};

if (watch) {
  const context = await esbuild.context(shared);
  await context.watch();
  console.log('Watching widget bundle...');
} else {
  await esbuild.build(shared);
  console.log('Built widget bundle.');
}
