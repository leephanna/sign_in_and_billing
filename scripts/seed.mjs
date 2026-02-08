import { Client } from "pg";
import crypto from "node:crypto";

const connStr = process.env.DATABASE_URL || "postgres://harmonia:harmonia@localhost:5432/harmonia";
const client = new Client({ connectionString: connStr });
await client.connect();

const now = new Date().toISOString();
const projectId = "proj_demo_" + crypto.randomBytes(6).toString("hex");

await client.query(
  `INSERT INTO projects (id, name, mode, created_at)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT DO NOTHING`,
  [projectId, "Demo Project", "sandbox", now]
);

console.log("✅ Seeded project:", projectId);
await client.end();
