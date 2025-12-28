

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../drizzle/schema';

export function getDb(d1: D1Database) {
    return drizzle(d1, { schema });
}

export type DrizzleDB = ReturnType<typeof getDb>;

