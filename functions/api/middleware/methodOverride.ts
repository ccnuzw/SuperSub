import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import type { Env } from '../utils/types';

// Middleware to handle X-HTTP-Method-Override for Cloudflare Pages compatibility
export const methodOverrideMiddleware = (app: Hono<{ Bindings: Env }>) => {
  return async (c: Context, next: Next) => {
    const overrideMethod = c.req.header('X-HTTP-Method-Override');
    if (c.req.method === 'POST' && overrideMethod) {
      const newMethod = overrideMethod.toUpperCase();
      if (['PUT', 'DELETE', 'PATCH'].includes(newMethod)) {
        // Store the overridden method in context instead of recreating the request
        c.set('methodOverride', newMethod);
      }
    }
    // Continue with normal flow, routes will check for methodOverride
    return await next();
  };
};