
import Database from 'better-sqlite3';

const dbPath = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce2958c72097c2ac98fc7f0be8805e881569237f6d51821121a68c1c4a150f41.sqlite';
const db = new Database(dbPath);

try {
    console.log("Attempting to drop 'params' column from 'nodes' table...");
    db.prepare("ALTER TABLE nodes DROP COLUMN params").run();
    console.log("Successfully dropped 'params' column.");
} catch (e) {
    console.error("Failed to drop column params:", e);
    // Fallback for older sqlite if needed (recreate table), but local miniflare should support it.
}
