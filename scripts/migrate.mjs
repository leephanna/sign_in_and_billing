import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(new URL("../services/core/db/schema.sql", import.meta.url), "utf8");

const connStr = process.env.DATABASE_URL || "postgres://harmonia:harmonia@localhost:5432/harmonia";

const client = new Client({ connectionString: connStr });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("✅ DB migrated");
} catch (e) {
  await client.query("ROLLBACK");
  console.error("❌ Migration failed", e);
  process.exitCode = 1;
} finally {
  await client.end();
}
