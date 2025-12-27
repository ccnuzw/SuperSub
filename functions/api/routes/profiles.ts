import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { generateSubscription } from '../utils/profileGenerator';
import { Logger } from '../utils/logger';
import { ProfileService } from '../services/profileService';

import { createErrorResponse } from '../utils/errors';

const profiles = new Hono<{ Bindings: Env }>();

// This is a public endpoint, no auth on this specific route
profiles.get('/:identifier/subscribe', async (c) => {
    c.status(410); // Gone
    return c.text('This subscription link format is deprecated. Please use the new format: /s/{token}/{alias}/subscribe');
});

// All other routes below this line require auth
profiles.use('*', manualAuthMiddleware);

profiles.get('/:id/preview-nodes', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new ProfileService(c.env);

        // We still fetch the profile here to pass to generateSubscription
        // generateSubscription uses ProfileService internally for logic, but expects the profile object.
        const profile = await service.getProfile(id, user.id);

        if (!profile) {
            return createErrorResponse('Profile not found', 404);
        }

        const logger = new Logger();

        // The preview route now calls the centralized generator with isPreview = true
        return generateSubscription(c, profile, user, false, true, logger);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

profiles.get('/', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new ProfileService(c.env);
        const results = await service.getProfiles(user.id);
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

profiles.post('/', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = await c.req.json<any>();
        const service = new ProfileService(c.env);

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return createErrorResponse('Profile name is required.', 400);
        }

        const result = await service.createProfile(user.id, body);
        return c.json({ success: true, data: result }, 201);
    } catch (e: any) {
        console.error('Failed to create profile:', e.message);
        return createErrorResponse(`Failed to create profile. ${e.message}`, 500);
    }
});

profiles.get('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new ProfileService(c.env);

        const profile = await service.getProfile(id, user.id);
        if (!profile) return createErrorResponse('Profile not found', 404);

        return c.json({ success: true, data: profile });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

profiles.put('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const body = await c.req.json<any>();
        const service = new ProfileService(c.env);

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return createErrorResponse('Profile name is required.', 400);
        }

        await service.updateProfile(id, user.id, body);

        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

profiles.delete('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new ProfileService(c.env);
        await service.deleteProfile(id, user.id);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default profiles;