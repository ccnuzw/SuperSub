
import Database from 'better-sqlite3';
const db = new Database('./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce2958c72097c2ac98fc7f0be8805e881569237f6d51821121a68c1c4a150f41.sqlite');

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index'").all();
console.log('Indexes:', indexes.map(i => i.name));
