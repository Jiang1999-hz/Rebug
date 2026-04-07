import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const dashboardDist = path.join(rootDir, 'apps', 'dashboard', 'dist');
const widgetDist = path.join(rootDir, 'apps', 'widget', 'dist');
const outputDir = path.join(rootDir, 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(dashboardDist, outputDir, { recursive: true, force: true });
await cp(path.join(widgetDist, 'widget.js'), path.join(outputDir, 'widget.js'), { force: true });

console.log('Prepared Vercel static output in dist/.');
