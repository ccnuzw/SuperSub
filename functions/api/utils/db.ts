/**
 * Generates an SQL IN clause with the specified number of placeholders.
 * @param count The number of placeholders to generate.
 * @returns A string like "?, ?, ?" or empty string if count is 0.
 */
export function createInClause(count: number): string {
    if (count <= 0) return '';
    return Array(count).fill('?').join(', ');
}

/**
 * Helper to execute a batch query safely with chunks to avoid SQLite limits.
 * @param db The D1 database instance.
 * @param queryBase The base query string before the IN clause (e.g., "SELECT * FROM table WHERE id IN (").
 * @param querySuffix The query string after the IN clause (e.g., ")").
 * @param ids The list of IDs to query.
 * @param chunkSize The size of each chunk (default 50).
 * @param bindings Additional bindings to be passed to the query (prepended or appended can be tricky with this helper, so assuming bind params are only the IDs for now or handled carefully).
 * 
 * Note: This simple helper assumes the only variable part is the IN clause placeholders.
 * For more complex queries, constructing the loop manually with createInClause is better.
 */
