import { zValidator } from '@hono/zod-validator';
import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { createDeveloperToken } from '../middleware/jwt.js';
import type { AppEnv } from '../types.js';
import { jsonError } from '../utils/errors.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const authRoutes = new Hono<AppEnv>();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const developer = await prisma.developer.findUnique({
    where: { email }
  });

  if (!developer) {
    return jsonError(c, 401, 'Email or password is incorrect.', 'LOGIN_FAILED');
  }

  const valid = await bcrypt.compare(password, developer.passwordHash);

  if (!valid) {
    return jsonError(c, 401, 'Email or password is incorrect.', 'LOGIN_FAILED');
  }

  const token = createDeveloperToken({
    sub: developer.id,
    email: developer.email
  });

  return c.json({
    token,
    developer: {
      id: developer.id,
      email: developer.email
    }
  });
});

export default authRoutes;
