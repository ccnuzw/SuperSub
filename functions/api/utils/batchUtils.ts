import { DrizzleDB } from './db';

/**
 * D1 的限制: 每个SQL语句最多100个绑定参数
 */
const D1_MAX_PARAMS = 100;

/**
 * D1 batch API建议的最大语句数量
 */
const MAX_STATEMENTS_PER_BATCH = 100;

/**
 * 计算每个INSERT语句可以插入的最大行数
 * @param columnsPerRow 每行的列数
 * @returns 每个语句可插入的最大行数
 */
export function calculateMaxRowsPerStatement(columnsPerRow: number): number {
    return Math.floor(D1_MAX_PARAMS / columnsPerRow);
}

/**
 * 表字段数量映射 (用于计算最优批次大小)
 */
export const TABLE_COLUMN_COUNTS = {
    nodes: 12,              // id, user_id, group_id, name, link, protocol, protocol_params, server, port, type, created_at, updated_at
    subscriptions: 10,      // id, user_id, name, url, group_id, enabled, node_count, created_at, updated_at + 其他可选
    profile_nodes: 2,       // profile_id, node_id
    profile_subscriptions: 2, // profile_id, subscription_id
    profile_rules: 9,       // user_id, profile_id, name, type, value, enabled, sort_order, created_at, updated_at
    node_statuses: 5,       // node_id, user_id, status, latency, checked_at
} as const;

/**
 * 预计算的最优批次大小
 */
export const OPTIMAL_CHUNK_SIZES = {
    nodes: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.nodes),                     // 8
    subscriptions: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.subscriptions),     // 10
    profile_nodes: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.profile_nodes),     // 50
    profile_subscriptions: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.profile_subscriptions), // 50
    profile_rules: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.profile_rules),     // 11
    node_statuses: calculateMaxRowsPerStatement(TABLE_COLUMN_COUNTS.node_statuses),     // 20
} as const;

/**
 * 高效批量插入函数
 * 将数据分成多个INSERT语句,然后使用batch API一次性执行
 * 
 * @param db Drizzle数据库实例
 * @param table 目标表
 * @param values 要插入的值数组
 * @param maxRowsPerStatement 每个语句的最大行数 (基于D1的100参数限制)
 */
export async function executeBatchInsert<T extends object>(
    db: DrizzleDB,
    insertFn: (values: T[]) => any,
    values: T[],
    maxRowsPerStatement: number
): Promise<void> {
    if (values.length === 0) return;

    const statements: any[] = [];

    // 将值分成多个批次,每批次创建一个INSERT语句
    for (let i = 0; i < values.length; i += maxRowsPerStatement) {
        const chunk = values.slice(i, i + maxRowsPerStatement);
        statements.push(insertFn(chunk));
    }

    // 如果语句数量超过限制,分批执行
    for (let i = 0; i < statements.length; i += MAX_STATEMENTS_PER_BATCH) {
        const batch = statements.slice(i, i + MAX_STATEMENTS_PER_BATCH);
        if (batch.length > 0) {
            await db.batch(batch as any);
        }
    }
}

/**
 * 使用onConflictDoNothing的高效批量插入
 * 适用于关联表 (如 profile_nodes, profile_subscriptions)
 */
export async function executeBatchInsertWithConflict<T extends object>(
    db: DrizzleDB,
    insertFn: (values: T[]) => { onConflictDoNothing: () => any },
    values: T[],
    maxRowsPerStatement: number
): Promise<void> {
    if (values.length === 0) return;

    const statements: any[] = [];

    for (let i = 0; i < values.length; i += maxRowsPerStatement) {
        const chunk = values.slice(i, i + maxRowsPerStatement);
        statements.push(insertFn(chunk).onConflictDoNothing());
    }

    for (let i = 0; i < statements.length; i += MAX_STATEMENTS_PER_BATCH) {
        const batch = statements.slice(i, i + MAX_STATEMENTS_PER_BATCH);
        if (batch.length > 0) {
            await db.batch(batch as any);
        }
    }
}

/**
 * 批量验证ID是否存在
 * 使用分块查询避免超过IN子句参数限制
 */
export async function batchValidateIds(
    db: DrizzleDB,
    queryFn: (chunk: string[]) => Promise<{ id: string }[]>,
    ids: string[],
    chunkSize: number = 50
): Promise<string[]> {
    if (ids.length === 0) return [];

    const validIds: string[] = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const result = await queryFn(chunk);
        validIds.push(...result.map(r => r.id));
    }

    return validIds;
}
