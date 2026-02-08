import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { projectsRoutes } from "./routes/projects.js";
import { authRoutes } from "./routes/auth.js";
import { billingRoutes } from "./routes/billing.js";
import { mockRoutes } from "./routes/mock.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // Parse JSON as a raw buffer so webhook signatures can be verified.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    const buf = body as Buffer;
    // @ts-ignore
    req.rawBody = buf;

    if (req.url === "/v1/billing/webhook") {
      return done(null, buf);
    }

    try {
      const parsed = buf.length ? JSON.parse(buf.toString("utf8")) : {};
      return done(null, parsed);
    } catch {
      return done(new Error("invalid_json"));
    }
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  await app.register(swagger, {
    swagger: { info: { title: "Harmonia Core Service", version: "0.1.0" } },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  app.get("/health", async () => ({ ok: true }));

  await app.register(projectsRoutes);
  await app.register(authRoutes);
  await app.register(billingRoutes);
  await app.register(mockRoutes);

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    reply.code(400).send({ error: "bad_request", message: err.message });
  });

  return app;
}
