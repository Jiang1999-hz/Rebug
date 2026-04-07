import type { Context, MiddlewareHandler } from 'hono';
import jwt from 'jsonwebtoken';

import type { AppEnv } from '../types.js';
import { jsonError } from '../utils/errors.js';

type JwtPayload = {
  sub: string;
  email: string;
};

export function createDeveloperToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyDeveloperToken(token: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.verify(token, secret) as JwtPayload;
}

export function getDeveloperPayload(c: Context<AppEnv>) {
  const authorization = c.req.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  try {
    return verifyDeveloperToken(authorization.replace('Bearer ', ''));
  } catch {
    return null;
  }
}

export const requireDeveloper: MiddlewareHandler<AppEnv> = async (c, next) => {
  const payload = getDeveloperPayload(c);

  if (!payload) {
    return jsonError(c, 401, 'Authorization token is invalid or expired.', 'AUTH_INVALID');
  }

  c.set('developerId', payload.sub);
  c.set('developerEmail', payload.email);
  await next();
};
