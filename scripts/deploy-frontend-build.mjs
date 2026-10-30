// Build staged source with production's installed tools and frontend environment.
// No environment files are copied or printed; only VITE_* values enter the bundle.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const [stageRoot, productionRoot] = process.argv.slice(2);
if (!stageRoot || !productionRoot) throw new Error('Expected staged and production frontend directories.');
const { build, loadEnv } = await import(pathToFileURL(path.join(productionRoot, 'node_modules/vite/dist/node/index.js')).href);
// Match `npm run build`'s version definition without running package scripts.
process.env.npm_package_version = JSON.parse(readFileSync(path.join(productionRoot, 'package.json'), 'utf8')).version;
for (const key of Object.keys(process.env)) {
  if (key.startsWith('VITE_')) delete process.env[key];
}
const values = loadEnv('production', productionRoot, 'VITE_');
Object.assign(process.env, values);
delete process.env.ANALYZE;
await build({
  root: stageRoot,
  configFile: path.join(stageRoot, 'vite.config.ts'),
  envDir: productionRoot,
  mode: 'production',
  build: { outDir: path.join(stageRoot, 'dist'), emptyOutDir: true },
});
