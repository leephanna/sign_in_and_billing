import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import { getBearerToken, signSession, verifySession } from "../auth.js";

const SignUpBody = z.object({
  projectId: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const SignInBody = z.object({
  projectId: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/v1/auth/signup", async (req, reply) => {
    const body = SignUpBody.parse(req.body);

    const project = await query<any>(`SELECT id FROM projects WHERE id=$1`, [body.projectId]);
    if (project.length === 0) return reply.code(404).send({ error: "project_not_found" });

    const password_hash = await bcrypt.hash(body.password, 10);
    const userId = "usr_" + crypto.randomBytes(10).toString("hex");

    try {
      await query(
        `INSERT INTO users (id, project_id, email, password_hash, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [userId, body.projectId, body.email.toLowerCase(), password_hash]
      );
    } catch (e: any) {
      // unique violation
      return reply.code(400).send({ error: "email_in_use" });
    }

    const token = signSession({ sub: userId, project_id: body.projectId, email: body.email.toLowerCase() });
    return { token, user: { id: userId, email: body.email.toLowerCase(), projectId: body.projectId } };
  });

  app.post("/v1/auth/signin", async (req, reply) => {
    const body = SignInBody.parse(req.body);

    const rows = await query<any>(
      `SELECT id, email, password_hash FROM users WHERE project_id=$1 AND email=$2 LIMIT 1`,
      [body.projectId, body.email.toLowerCase()]
    );
    if (rows.length === 0) return reply.code(401).send({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(body.password, rows[0].password_hash);
    if (!ok) return reply.code(401).send({ error: "invalid_credentials" });

    const token = signSession({ sub: rows[0].id, project_id: body.projectId, email: rows[0].email });
    return { token, user: { id: rows[0].id, email: rows[0].email, projectId: body.projectId } };
  });

  app.get("/v1/auth/me", async (req, reply) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return reply.code(401).send({ error: "unauthorized" });

    const claims = verifySession(token);
    if (!claims) return reply.code(401).send({ error: "unauthorized" });

    const rows = await query<any>(`SELECT id, email, project_id FROM users WHERE id=$1`, [claims.sub]);
    if (rows.length === 0) return reply.code(401).send({ error: "unauthorized" });

    return { user: { id: rows[0].id, email: rows[0].email, projectId: rows[0].project_id } };
  });
}
