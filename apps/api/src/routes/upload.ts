import { Hono } from 'hono';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

import { prisma } from '../lib/prisma.js';
import { isBlobConfigured, storeUpload } from '../lib/storage.js';
import { getDeveloperPayload } from '../middleware/jwt.js';
import type { AppEnv } from '../types.js';
import { jsonError } from '../utils/errors.js';

const uploadRoutes = new Hono<AppEnv>();
const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

function parseClientPayload(rawPayload: string | null | undefined) {
  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as { apiKey?: string };
  } catch {
    return null;
  }
}

async function findProjectByApiKey(apiKey: string) {
  return prisma.project.findUnique({
    where: { apiKey }
  });
}

uploadRoutes.post('/client', async (c) => {
  if (!isBlobConfigured()) {
    return jsonError(c, 400, 'Vercel Blob is not configured.', 'BLOB_NOT_CONFIGURED');
  }

  let body: HandleUploadBody;

  try {
    body = (await c.req.json()) as HandleUploadBody;
  } catch {
    return jsonError(c, 400, 'Invalid upload token request body.', 'INVALID_UPLOAD_TOKEN_REQUEST');
  }

  try {
    const response = await handleUpload({
      body,
      request: c.req.raw,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        const apiKey = payload?.apiKey;

        if (!apiKey) {
          throw new Error('API key is required for widget uploads.');
        }

        const project = await findProjectByApiKey(apiKey);

        if (!project) {
          throw new Error('API key is invalid.');
        }

        const origin = c.req.header('Origin');

        if (origin && project.allowedOrigins.length > 0 && !project.allowedOrigins.includes(origin)) {
          throw new Error('Origin is not allowed for this project.');
        }

        return {
          allowedContentTypes: allowedTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            projectId: project.id
          })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed', blob.pathname);
      }
    });

    return c.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare direct upload.';
    return jsonError(c, 400, message, 'BLOB_CLIENT_UPLOAD_FAILED');
  }
});

uploadRoutes.post('/', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  const developerPayload = getDeveloperPayload(c);

  if (!apiKey && !developerPayload) {
    return jsonError(c, 401, 'Authentication is required for uploads.', 'UPLOAD_AUTH_REQUIRED');
  }

  if (apiKey) {
    const project = await findProjectByApiKey(apiKey);

    if (!project) {
      return jsonError(c, 401, 'API key is invalid.', 'API_KEY_INVALID');
    }

    const origin = c.req.header('Origin');

    if (origin && project.allowedOrigins.length > 0 && !project.allowedOrigins.includes(origin)) {
      return jsonError(c, 403, 'Origin is not allowed for this project.', 'ORIGIN_FORBIDDEN');
    }
  }

  const formData = await c.req.formData();
  const entry = formData.get('file');

  if (!(entry instanceof File)) {
    return jsonError(c, 400, 'A file field is required.', 'FILE_REQUIRED');
  }

  try {
    const url = await storeUpload(entry, new URL(c.req.url).origin);
    return c.json({ url }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return jsonError(c, 400, message, 'UPLOAD_FAILED');
  }
});

export default uploadRoutes;
