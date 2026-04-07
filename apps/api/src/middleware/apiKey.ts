import type { MiddlewareHandler } from 'hono';

import { prisma } from '../lib/prisma.js';
import type { AppEnv } from '../types.js';
import { jsonError } from '../utils/errors.js';

export const requireApiProject: MiddlewareHandler<AppEnv> = async (c, next) => {
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    return jsonError(c, 401, 'API key is required.', 'API_KEY_MISSING');
  }

  const project = await prisma.project.findUnique({
    where: { apiKey }
  });

  if (!project) {
    return jsonError(c, 401, 'API key is invalid.', 'API_KEY_INVALID');
  }

  const origin = c.req.header('Origin');

  if (origin && project.allowedOrigins.length > 0 && !project.allowedOrigins.includes(origin)) {
    return jsonError(c, 403, 'Origin is not allowed for this project.', 'ORIGIN_FORBIDDEN');
  }

  c.set('project', project);

  await next();
};
