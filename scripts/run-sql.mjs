// Run a single SQL file against a Postgres connection string.
// Usage: node scripts/run-sql.mjs <path-to.sql> "postgres://...."
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const file = process.argv[2];
const conn = process.argv[3] || process.env.DATABASE_URL;
if (!file || !conn) {
  console.error('Usage: node scripts/run-sql.mjs <file.sql> "<connection-string>"');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(readFileSync(resolve(file), "utf8"));
  console.log(`✓ applied ${file}`);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
