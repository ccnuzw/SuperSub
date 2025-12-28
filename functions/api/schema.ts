import { z } from 'zod';

export const nodeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    link: z.string().min(1, 'Link is required'),
    protocol: z.string().optional(),
    protocol_params: z.any().optional(),
});

export const batchImportSchema = z.object({
    links: z.string().optional(),
    nodes: z.array(z.any()).optional(),
    groupId: z.string().optional().nullable(),
}).refine(data => data.links || (data.nodes && data.nodes.length > 0), {
    message: "Either 'links' or 'nodes' must be provided",
});

export const idListSchema = z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

export const batchUpdateGroupSchema = z.object({
    nodeIds: z.array(z.string()).min(1, 'At least one node ID is required'),
    groupId: z.string().nullable().optional(),
});

export const batchActionSchema = z.object({
    action: z.enum(['clear', 'sort', 'deduplicate']),
    groupId: z.string(),
});

export const updateOrderSchema = z.object({
    nodeIds: z.array(z.string()).min(1, 'At least one node ID is required'),
});

export const updateNodeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    link: z.string().min(1, 'Link is required'),
});

// Subscription Schemas
export const createSubscriptionSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Invalid URL'),
});

export const updateSubscriptionSchema = createSubscriptionSchema;

export const batchImportSubscriptionsSchema = z.object({
    subscriptions: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
    })).min(1, 'At least one subscription is required'),
    groupId: z.string().optional(),
});

export const previewSubscriptionSchema = z.object({
    url: z.string().url(),
    subscription_id: z.string().optional(),
    apply_rules: z.boolean().optional(),
});

export const subscriptionRuleSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    value: z.string().min(1),
    enabled: z.boolean().optional(),
    sort_order: z.number().optional(),
});

export const updateSubscriptionRuleSchema = subscriptionRuleSchema.partial();

export const clearByGroupSchema = z.object({
    groupId: z.string().nullable(),
});

export const batchUpdateSubscriptionGroupSchema = z.object({
    subscriptionIds: z.array(z.string()).min(1),
    groupId: z.string().nullable(),
});

export const batchUpdateUrlsSchema = z.object({
    updates: z.array(z.object({
        id: z.string(),
        url: z.string().url(),
    })).min(1),
});

export const clearFailedSchema = z.object({
    groupId: z.union([z.string(), z.null(), z.literal('all')]),
});

// Profile Schemas
export const createProfileSchema = z.object({
    name: z.string().min(1, 'Profile name is required'),
    alias: z.string().optional().nullable(),
    content: z.union([z.record(z.string(), z.any()), z.string()]).optional(), // Allow both object and string for content
    rules: z.array(z.any()).optional(),
});

export const updateProfileSchema = createProfileSchema;

export type NodePayload = z.infer<typeof nodeSchema>;
export type BatchImportPayload = z.infer<typeof batchImportSchema>;
export type BatchActionPayload = z.infer<typeof batchActionSchema>;
export type CreateSubscriptionPayload = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionPayload = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionRulePayload = z.infer<typeof subscriptionRuleSchema>;
export type CreateProfilePayload = z.infer<typeof createProfileSchema>;
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;

