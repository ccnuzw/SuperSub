import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware, adminAuthMiddleware } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';

const assets = new Hono<{ Bindings: Env }>();

// All routes in this group require auth
assets.use('*', manualAuthMiddleware);

// GET /api/assets?type=<backend|config> - Get all assets of a certain type
assets.get('/', async (c) => {
  const { type } = c.req.query();
  if (!type || !['backend', 'config'].includes(type)) {
    return createErrorResponse('Invalid or missing type parameter. Must be "backend" or "config".', 400);
  }

  try {
    // Fetch both system assets and user-created assets
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM subconverter_assets WHERE type = ?`
    ).bind(type).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error(`Failed to fetch assets:`, error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// POST /api/assets - Create a new asset (Admin only)
assets.post('/', adminAuthMiddleware, async (c) => {
  const user = c.get('jwtPayload');
  const { name, url, type } = await c.req.json();

  if (!name || !url || !type || !['backend', 'config'].includes(type)) {
    return createErrorResponse('Missing or invalid parameters.', 400);
  }

  try {
    const now = new Date().toISOString();
    const { success } = await c.env.DB.prepare(
      `INSERT INTO subconverter_assets (user_id, name, url, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(user.id, name, url, type, now, now).run();

    if (success) {
      return c.json({ success: true, message: 'Asset created successfully.' }, 201);
    } else {
      return createErrorResponse('Failed to create asset.', 500);
    }
  } catch (error: any) {
    console.error('Failed to create asset:', error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// PUT /api/assets/:id - Update an asset (Admin only)
assets.put('/:id', adminAuthMiddleware, async (c) => {
  const { id } = c.req.param();
  const { name, url } = await c.req.json();

  if (!name || !url) {
    return createErrorResponse('Missing required parameters.', 400);
  }

  try {
    const now = new Date().toISOString();
    const { success } = await c.env.DB.prepare(
      'UPDATE subconverter_assets SET name = ?, url = ?, updated_at = ? WHERE id = ?'
    ).bind(name, url, now, id).run();

    if (success) {
      return c.json({ success: true, message: 'Asset updated successfully.' });
    } else {
      return createErrorResponse('Asset not found or no changes made.', 404);
    }
  } catch (error: any) {
    console.error('Failed to update asset:', error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// DELETE /api/assets/:id - Delete an asset (Admin only)
assets.delete('/:id', adminAuthMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    const { success } = await c.env.DB.prepare(
      'DELETE FROM subconverter_assets WHERE id = ?'
    ).bind(id).run();

    if (success) {
      return c.json({ success: true, message: 'Asset deleted successfully.' });
    } else {
      return createErrorResponse('Asset not found.', 404);
    }
  } catch (error: any) {
    console.error('Failed to delete asset:', error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

export default assets;