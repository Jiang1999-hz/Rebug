import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { authorTypeValues, bugStatusValues, severityValues, type BugStatus } from '../domain/enums.js';
import { prisma } from '../lib/prisma.js';
import { getDeveloperPayload } from '../middleware/jwt.js';
import type { AppEnv } from '../types.js';
import { canTransitionStatus } from '../utils/statusWorkflow.js';
import { jsonError } from '../utils/errors.js';

const createBugSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(4000).optional().default(''),
  severity: z.enum(severityValues),
  screenshots: z.array(z.string().url()).max(4).optional().default([]),
  pageUrl: z.string().url(),
  userAgent: z.string().min(3).max(2000),
  contactEmail: z.string().email().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(bugStatusValues)
});

const commentSchema = z.object({
  content: z.string().min(1).max(4000)
});

const querySchema = z.object({
  status: z.enum(bugStatusValues).optional(),
  severity: z.enum(severityValues).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

const bugsRoutes = new Hono<AppEnv>();

bugsRoutes.post('/', zValidator('json', createBugSchema), async (c) => {
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

  const payload = c.req.valid('json');

  const bug = await prisma.bug.create({
    data: {
      title: payload.title,
      description: payload.description,
      severity: payload.severity,
      screenshots: payload.screenshots,
      pageUrl: payload.pageUrl,
      userAgent: payload.userAgent,
      projectId: project.id,
      comments: payload.contactEmail
        ? {
            create: {
              content: `Client contact email: ${payload.contactEmail}`,
              author: authorTypeValues[0]
            }
          }
        : undefined
    }
  });

  return c.json(
    {
      id: bug.id,
      referenceId: bug.seqId,
      title: bug.title,
      status: bug.status,
      createdAt: bug.createdAt
    },
    201
  );
});

bugsRoutes.get('/', zValidator('query', querySchema), async (c) => {
  if (!getDeveloperPayload(c)) {
    return jsonError(c, 401, 'Authorization token is invalid or expired.', 'AUTH_INVALID');
  }

  const { status, severity, search, page, limit } = c.req.valid('query');

  const where = {
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {})
  };

  const [bugs, total] = await Promise.all([
    prisma.bug.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.bug.count({ where })
  ]);

  return c.json({
    bugs,
    total,
    page,
    limit
  });
});

bugsRoutes.get('/:id', async (c) => {
  const bugId = c.req.param('id');
  const apiKey = c.req.header('X-API-Key');
  const developerPayload = getDeveloperPayload(c);

  const bug = await prisma.bug.findUnique({
    where: { id: bugId },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      comments: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!bug) {
    return jsonError(c, 404, 'Bug not found.', 'BUG_NOT_FOUND');
  }

  if (developerPayload) {
    return c.json(bug);
  }

  if (!apiKey) {
    return jsonError(c, 401, 'API key is invalid for this bug.', 'API_KEY_INVALID');
  }

  const project = await prisma.project.findUnique({
    where: { apiKey },
    select: { id: true }
  });

  if (!project || project.id !== bug.projectId) {
    return jsonError(c, 401, 'API key is invalid for this bug.', 'API_KEY_INVALID');
  }

  return c.json(bug);
});

bugsRoutes.patch('/:id/status', zValidator('json', updateStatusSchema), async (c) => {
  if (!getDeveloperPayload(c)) {
    return jsonError(c, 401, 'Authorization token is invalid or expired.', 'AUTH_INVALID');
  }

  const bugId = c.req.param('id');
  const { status } = c.req.valid('json');

  const currentBug = await prisma.bug.findUnique({
    where: { id: bugId }
  });

  if (!currentBug) {
    return jsonError(c, 404, 'Bug not found.', 'BUG_NOT_FOUND');
  }

  if (!canTransitionStatus(currentBug.status, status)) {
    return jsonError(c, 400, 'Status transition is not allowed.', 'STATUS_TRANSITION_INVALID');
  }

  const updatedBug = await prisma.bug.update({
    where: { id: bugId },
    data: { status },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      comments: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  return c.json(updatedBug);
});

bugsRoutes.post('/:id/comments', zValidator('json', commentSchema), async (c) => {
  const bugId = c.req.param('id');
  const { content } = c.req.valid('json');
  const apiKey = c.req.header('X-API-Key');
  const developerPayload = getDeveloperPayload(c);

  const bug = await prisma.bug.findUnique({
    where: { id: bugId },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!bug) {
    return jsonError(c, 404, 'Bug not found.', 'BUG_NOT_FOUND');
  }

  let author: (typeof authorTypeValues)[number];

  if (developerPayload) {
    author = authorTypeValues[1];
  } else if (apiKey) {
    const project = await prisma.project.findUnique({
      where: { apiKey },
      select: { id: true }
    });

    if (!project || project.id !== bug.projectId) {
      return jsonError(c, 401, 'Authentication is required for comments.', 'COMMENT_AUTH_REQUIRED');
    }

    author = authorTypeValues[0];
  } else {
    return jsonError(c, 401, 'Authentication is required for comments.', 'COMMENT_AUTH_REQUIRED');
  }

  const comment = await prisma.comment.create({
    data: {
      bugId: bug.id,
      author,
      content
    }
  });

  return c.json(comment, 201);
});

export default bugsRoutes;
