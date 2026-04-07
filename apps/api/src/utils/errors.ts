import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function jsonError(c: Context, status: number, error: string, code: string) {
  return c.json({ error, code }, status as ContentfulStatusCode);
}
