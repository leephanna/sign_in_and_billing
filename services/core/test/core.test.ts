import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { Client } from "pg";
import { readFileSync } from "node:fs";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://harmonia:harmonia@localhost:5432/harmonia";

describe("core-service", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let client: Client;

  beforeAll(async () => {
    process.env.HARMONIA_JWT_SECRET ||= "test-secret";
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
    await client.query(sql);

    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    await client.end();
  });

  it("health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it("create project -> signup -> me", async () => {
    // Create project (admin key optional in dev)
    const adminKey = process.env.HARMONIA_ADMIN_KEY;
    const create = await app.inject({
      method: "POST",
      url: "/v1/projects",
      headers: {
        "content-type": "application/json",
        ...(adminKey ? { "x-harmonia-admin-key": adminKey } : {}),
      },
      payload: Buffer.from(JSON.stringify({ name: "Test Project" }), "utf8"),
    });
    expect(create.statusCode).toBe(200);
    const proj = create.json();
    expect(proj.id).toContain("proj_");

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      headers: { "content-type": "application/json" },
      payload: Buffer.from(
        JSON.stringify({ projectId: proj.id, email: "a@example.com", password: "password-1234" }),
        "utf8"
      ),
    });
    expect(signup.statusCode).toBe(200);
    const { token } = signup.json();
    expect(typeof token).toBe("string");

    const me = await app.inject({
      method: "GET",
      url: "/v1/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("a@example.com");
  });
});
