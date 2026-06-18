// Apply supabase/schema.sql then supabase/seed.sql to a Postgres database.
// Usage: node scripts/apply-schema.mjs "postgres://...connection-string..."
//   (or set DATABASE_URL). The connection string is never written to disk here.
import { readFileSync } from "node:fs";
import pg from "pg";

const conn = process.argv[2] || process.env.DATABASE_URL;
if (!conn) {
  console.error("Provide a connection string as an argument or DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

const files = ["supabase/schema.sql", "supabase/seed.sql"];

try {
  await client.connect();
  console.log("Connected.");
  for (const file of files) {
    const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    await client.query(sql);
    console.log(`✓ applied ${file}`);
  }
  // Quick sanity counts.
  for (const t of ["modules", "directors", "benefits", "company_values", "email_templates"]) {
    const { rows } = await client.query(`select count(*)::int as n from public.${t}`);
    console.log(`  ${t}: ${rows[0].n} rows`);
  }
  console.log("Done.");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
