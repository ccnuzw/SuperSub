import { Hono } from 'hono';
import { manualAuthMiddleware } from '../middleware/auth';
import type { Env } from '../utils/types';
import { SubscriptionService } from '../services/subscriptionService';

const subscriptions = new Hono<{ Bindings: Env }>();
subscriptions.use('*', manualAuthMiddleware);

// GET /api/subscriptions - Get all subscriptions for a user
subscriptions.get('/', async (c) => {
  const user = c.get('jwtPayload');
  const subscriptionService = new SubscriptionService(c.env.DB);

  try {
    const results = await subscriptionService.getSubscriptions(user.id);
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return c.json({ success: false, message: 'Failed to fetch subscriptions' }, 500);
  }
});

// POST /api/subscriptions - Create new subscription
subscriptions.post('/', async (c) => {
  const user = c.get('jwtPayload');
  const subscriptionService = new SubscriptionService(c.env.DB);
  const body = await c.req.json();

  try {
    const result = await subscriptionService.createSubscription(user.id, body);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return c.json({ success: false, message: 'Failed to create subscription' }, 500);
  }
});

// PUT /api/subscriptions/:id - Update subscription
subscriptions.put('/:id', async (c) => {
  const user = c.get('jwtPayload');
  const subscriptionService = new SubscriptionService(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    await subscriptionService.updateSubscription(user.id, id, body);
    return c.json({ success: true, message: 'Subscription updated successfully' });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return c.json({ success: false, message: 'Failed to update subscription' }, 500);
  }
});

// DELETE /api/subscriptions/:id - Delete subscription
subscriptions.delete('/:id', async (c) => {
  const user = c.get('jwtPayload');
  const subscriptionService = new SubscriptionService(c.env.DB);
  const id = c.req.param('id');

  try {
    await subscriptionService.deleteSubscription(user.id, id);
    return c.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return c.json({ success: false, message: 'Failed to delete subscription' }, 500);
  }
});

// POST /api/subscriptions/preview - Preview subscription content
subscriptions.post('/preview', async (c) => {
  const body = await c.req.json();
  const subscriptionService = new SubscriptionService(c.env.DB);

  try {
    const result = await subscriptionService.getSubscriptionForPreview(body.url);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error previewing subscription:', error);
    return c.json({ success: false, message: error.message || 'Failed to preview subscription' }, 500);
  }
});

export default subscriptions;