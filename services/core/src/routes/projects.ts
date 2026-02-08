import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";
import { decrypt, encrypt } from "../crypto.js";
import { env } from "../env.js";

const CreateProjectBody = z.object({
  name: z.string().min(2).max(80),
});

const UpdateProjectBody = z.object({
  name: z.string().min(2).max(80).optional(),
  mode: z.enum(["sandbox", "live"]).optional(),
  theme: z.record(z.any()).optional(),
  features: z.record(z.any()).optional(),
});

const PutSecretsBody = z.object({
  stripe_secret: z.string().min(1).optional(),
  stripe_publishable: z.string().min(1).optional(),
  stripe_webhook_secret: z.string().min(1).optional(),
});

function adminGuard(req: any) {
  if (!env.HARMONIA_ADMIN_KEY) return true; // dev convenience
  const key = req.headers["x-harmonia-admin-key"];
  return typeof key === "string" && key === env.HARMONIA_ADMIN_KEY;
}

export async function projectsRoutes(app: FastifyInstance) {
  // Create project (admin)
  app.post("/v1/projects", async (req, reply) => {
    if (!adminGuard(req)) return reply.code(401).send({ error: "unauthorized" });

    const body = CreateProjectBody.parse(req.body);
    const id = "proj_" + crypto.randomBytes(10).toString("hex");

    await query(
      `INSERT INTO projects (id, name, mode, created_at) VALUES ($1, $2, 'sandbox', now())`,
      [id, body.name]
    );

    return { id, name: body.name, mode: "sandbox" };
  });

  // List projects (admin)
  app.get("/v1/projects", async (req, reply) => {
    if (!adminGuard(req)) return reply.code(401).send({ error: "unauthorized" });
    const rows = await query<{ id: string; name: string; mode: string; created_at: string }>(
      `SELECT id, name, mode, created_at FROM projects ORDER BY created_at DESC LIMIT 200`
    );
    return { projects: rows };
  });

  // Get project (admin)
  app.get("/v1/projects/:projectId", async (req, reply) => {
    if (!adminGuard(req)) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = req.params as any;

    const rows = await query<any>(`SELECT * FROM projects WHERE id=$1`, [projectId]);
    if (rows.length === 0) return reply.code(404).send({ error: "not_found" });

    const sec = await query<any>(`SELECT * FROM project_secrets WHERE project_id=$1`, [projectId]);
    const secrets = sec[0]
      ? {
          has_stripe_secret: Boolean(sec[0].stripe_secret_enc),
          has_stripe_publishable: Boolean(sec[0].stripe_publishable_enc),
          has_stripe_webhook_secret: Boolean(sec[0].stripe_webhook_secret_enc),
        }
      : { has_stripe_secret: false, has_stripe_publishable: false, has_stripe_webhook_secret: false };

    return { project: rows[0], secrets };
  });

  // Public config (safe for client SDK)
  app.get("/v1/projects/:projectId/public-config", async (req, reply) => {
    const { projectId } = req.params as any;

    const rows = await query<any>(`SELECT id, name, mode, theme, features FROM projects WHERE id=$1`, [projectId]);
    if (rows.length === 0) return reply.code(404).send({ error: "not_found" });

    const project = rows[0];

    // Resolve publishable key:
    // - live: project-provided publishable (if present)
    // - sandbox: platform publishable (if present)
    let publishableKey = "";
    if (project.mode === "live") {
      const sec = await query<any>(`SELECT stripe_publishable_enc FROM project_secrets WHERE project_id=$1`, [projectId]);
      if (sec[0]?.stripe_publishable_enc) publishableKey = decrypt(sec[0].stripe_publishable_enc);
    } else {
      publishableKey = env.PLATFORM_STRIPE_TEST_PUBLISHABLE || "";
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        mode: project.mode,
        theme: project.theme ?? {},
        features: project.features ?? {},
      },
      billing: {
        provider: "stripe",
        publishableKey,
        mode: env.BILLING_MODE,
      },
      apiBaseUrl: env.PUBLIC_BASE_URL,
    };
  });

  // Update project (admin)
  app.patch("/v1/projects/:projectId", async (req, reply) => {
    if (!adminGuard(req)) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = req.params as any;
    const body = UpdateProjectBody.parse(req.body);

    const rows = await query<any>(`SELECT * FROM projects WHERE id=$1`, [projectId]);
    if (rows.length === 0) return reply.code(404).send({ error: "not_found" });

    const next = {
      name: body.name ?? rows[0].name,
      mode: body.mode ?? rows[0].mode,
      theme: body.theme ?? rows[0].theme ?? {},
      features: body.features ?? rows[0].features ?? {},
    };

    await query(
      `UPDATE projects SET name=$2, mode=$3, theme=$4, features=$5 WHERE id=$1`,
      [projectId, next.name, next.mode, JSON.stringify(next.theme), JSON.stringify(next.features)]
    );

    return { project: { id: projectId, ...next } };
  });

  // Store secrets (admin)
  app.put("/v1/projects/:projectId/secrets", async (req, reply) => {
    if (!adminGuard(req)) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = req.params as any;
    const body = PutSecretsBody.parse(req.body);

    // Ensure project exists
    const rows = await query<any>(`SELECT id FROM projects WHERE id=$1`, [projectId]);
    if (rows.length === 0) return reply.code(404).send({ error: "not_found" });

    const stripe_secret_enc = body.stripe_secret ? encrypt(body.stripe_secret) : null;
    const stripe_publishable_enc = body.stripe_publishable ? encrypt(body.stripe_publishable) : null;
    const stripe_webhook_secret_enc = body.stripe_webhook_secret ? encrypt(body.stripe_webhook_secret) : null;

    await query(
      `INSERT INTO project_secrets (project_id, stripe_secret_enc, stripe_publishable_enc, stripe_webhook_secret_enc, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (project_id)
       DO UPDATE SET
         stripe_secret_enc = COALESCE(EXCLUDED.stripe_secret_enc, project_secrets.stripe_secret_enc),
         stripe_publishable_enc = COALESCE(EXCLUDED.stripe_publishable_enc, project_secrets.stripe_publishable_enc),
         stripe_webhook_secret_enc = COALESCE(EXCLUDED.stripe_webhook_secret_enc, project_secrets.stripe_webhook_secret_enc),
         updated_at = now()`,
      [projectId, stripe_secret_enc, stripe_publishable_enc, stripe_webhook_secret_enc]
    );

    return { ok: true };
  });
}
