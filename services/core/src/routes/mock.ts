import { FastifyInstance } from "fastify";

export async function mockRoutes(app: FastifyInstance) {
  app.get("/mock/billing-portal", async () => {
    return {
      ok: true,
      mode: "MOCK",
      message:
        "This is a placeholder billing portal. Set Stripe keys (platform test or project live) and switch billing mode to STRIPE for real portal sessions.",
    };
  });

  app.get("/mock/checkout", async (req) => {
    const q = req.query as any;
    return {
      ok: true,
      mode: "MOCK",
      message: "This is a placeholder checkout session. Configure Stripe to generate a real Checkout URL.",
      project_id: q?.project_id,
      price: q?.price,
    };
  });
}
