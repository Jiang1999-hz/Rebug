import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const dashboardDist = path.join(rootDir, 'apps', 'dashboard', 'dist');
const outputDir = path.join(rootDir, 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(dashboardDist, outputDir, { recursive: true, force: true });

console.log('Prepared Dashboard static output for Vercel in dist/.');
