import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { UAParser } from 'ua-parser-js';

import { getUploadsDir } from './lib/storage.js';
import authRoutes from './routes/auth.js';
import bugRoutes from './routes/bugs.js';
import projectRoutes from './routes/projects.js';
import uploadRoutes from './routes/upload.js';
import type { AppEnv } from './types.js';
import { jsonError } from './utils/errors.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const widgetDistCandidates = [
  path.resolve(currentDir, '../../widget/dist/widget.js'),
  path.resolve(currentDir, '../../../widget/dist/widget.js'),
  path.resolve(process.cwd(), 'apps', 'widget', 'dist', 'widget.js'),
  path.resolve(process.cwd(), 'dist', 'widget.js')
];

async function readWidgetBundle() {
  for (const widgetDistPath of widgetDistCandidates) {
    try {
      return await readFile(widgetDistPath, 'utf8');
    } catch {
      continue;
    }
  }

  throw new Error('Widget build not found.');
}

export function createApp() {
  const app = new Hono<AppEnv>();

  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) {
          return '*';
        }

        if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
          return origin;
        }

        return configuredOrigins[0] ?? origin;
      },
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS']
    })
  );

  app.get('/', (c) =>
    c.json({
      name: 'Bug Feedback API',
      widgetUrl: `${new URL(c.req.url).origin}/widget.js`,
      status: 'ok'
    })
  );

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.get('/widget.js', async (c) => {
    try {
      const script = await readWidgetBundle();
      return new Response(script, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=60'
        }
      });
    } catch {
      return jsonError(c, 404, 'Widget build not found. Run the widget build first.', 'WIDGET_NOT_BUILT');
    }
  });

  app.get('/uploads/*', async (c) => {
    const requestedPath = c.req.path.replace(/^\/uploads\//, '');
    const uploadRoot = getUploadsDir();
    const filePath = path.resolve(uploadRoot, requestedPath);

    if (!filePath.startsWith(uploadRoot)) {
      return jsonError(c, 400, 'Invalid upload path.', 'UPLOAD_PATH_INVALID');
    }

    try {
      const fileBuffer = await readFile(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const mimeType =
        extension === '.png'
          ? 'image/png'
          : extension === '.webp'
            ? 'image/webp'
            : 'image/jpeg';

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } catch {
      return jsonError(c, 404, 'Uploaded file not found.', 'UPLOAD_NOT_FOUND');
    }
  });

  app.get('/api/meta/parse-user-agent', (c) => {
    const userAgent = c.req.query('userAgent') ?? '';
    const parser = new UAParser(userAgent);
    return c.json(parser.getResult());
  });

  app.get('/meta/parse-user-agent', (c) => {
    const userAgent = c.req.query('userAgent') ?? '';
    const parser = new UAParser(userAgent);
    return c.json(parser.getResult());
  });

  app.route('/api/auth', authRoutes);
  app.route('/auth', authRoutes);
  app.route('/api/bugs', bugRoutes);
  app.route('/bugs', bugRoutes);
  app.route('/api/projects', projectRoutes);
  app.route('/projects', projectRoutes);
  app.route('/api/upload', uploadRoutes);
  app.route('/upload', uploadRoutes);

  app.notFound((c) => jsonError(c, 404, 'Route not found.', 'NOT_FOUND'));

  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return jsonError(c, error.status, error.message, 'HTTP_EXCEPTION');
    }

    console.error(error);
    return jsonError(c, 500, 'Something went wrong.', 'INTERNAL_SERVER_ERROR');
  });

  return app;
}
