
import Database from 'better-sqlite3';
const db = new Database('./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce2958c72097c2ac98fc7f0be8805e881569237f6d51821121a68c1c4a150f41.sqlite');

const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").all();
console.log(`Found ${indexes.length} indexes to drop.`);

for (const idx of indexes) {
    if (idx.name.startsWith('sqlite_')) continue;
    try {
        db.prepare(`DROP INDEX IF EXISTS "${idx.name}"`).run();
        console.log(`Dropped index: ${idx.name}`);
    } catch (e) {
        console.error(`Failed to drop index ${idx.name}:`, e);
    }
}
