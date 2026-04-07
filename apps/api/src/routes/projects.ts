import { randomBytes } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireDeveloper } from '../middleware/jwt.js';
import type { AppEnv } from '../types.js';

const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  allowedOrigins: z.array(z.string().url()).optional()
});

const projectRoutes = new Hono<AppEnv>();

projectRoutes.use('*', requireDeveloper);

projectRoutes.get('/', async (c) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { bugs: true }
      }
    }
  });

  return c.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      apiKey: project.apiKey,
      allowedOrigins: project.allowedOrigins,
      bugCount: project._count.bugs,
      createdAt: project.createdAt
    }))
  });
});

projectRoutes.post('/', zValidator('json', createProjectSchema), async (c) => {
  const { name, allowedOrigins = [] } = c.req.valid('json');

  const project = await prisma.project.create({
    data: {
      name,
      apiKey: `proj_${randomBytes(12).toString('hex')}`,
      allowedOrigins
    }
  });

  return c.json(project, 201);
});

export default projectRoutes;
