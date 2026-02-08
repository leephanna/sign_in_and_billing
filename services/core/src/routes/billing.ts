import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getBearerToken, verifySession } from "../auth.js";
import { query } from "../db.js";
import { env } from "../env.js";
import { resolveStripeForProject } from "../stripe.js";

const PortalBody = z.object({
  returnUrl: z.string().url().optional(),
});

const CheckoutBody = z.object({
  priceId: z.string().min(3),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function billingRoutes(app: FastifyInstance) {
  // Get subscription status for the current user
  app.get("/v1/billing/status", async (req, reply) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return reply.code(401).send({ error: "unauthorized" });
    const claims = verifySession(token);
    if (!claims) return reply.code(401).send({ error: "unauthorized" });

    const rows = await query<any>(
      `SELECT status, current_period_end, stripe_customer_id, stripe_subscription_id
       FROM subscriptions
       WHERE project_id=$1 AND user_id=$2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [claims.project_id, claims.sub]
    );

    return { subscription: rows[0] || { status: "none" } };
  });

  // Create a Stripe Customer Portal session (or mock URL)
  app.post("/v1/billing/portal-session", async (req, reply) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return reply.code(401).send({ error: "unauthorized" });
    const claims = verifySession(token);
    if (!claims) return reply.code(401).send({ error: "unauthorized" });

    const body = PortalBody.parse(req.body);

    const stripeRes = await resolveStripeForProject(claims.project_id);
    if (stripeRes.mode === "MOCK") {
      return { url: `${env.PUBLIC_BASE_URL}/mock/billing-portal?project_id=${claims.project_id}` };
    }

    // Ensure customer exists (create if needed)
    const existing = await query<any>(
      `SELECT stripe_customer_id FROM subscriptions WHERE project_id=$1 AND user_id=$2 LIMIT 1`,
      [claims.project_id, claims.sub]
    );
    let customerId = existing[0]?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripeRes.stripe.customers.create({
        email: claims.email,
        metadata: { project_id: claims.project_id, user_id: claims.sub },
      });
      customerId = customer.id;

      await query(
        `INSERT INTO subscriptions (id, project_id, user_id, provider, status, stripe_customer_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'stripe', 'none', $4, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        [`sub_${claims.sub}`, claims.project_id, claims.sub, customerId]
      );
    }

    const session = await stripeRes.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: body.returnUrl || "http://localhost:3001/billing",
    });

    return { url: session.url };
  });

  // Create a Stripe Checkout Session for a subscription priceId (or mock)
  app.post("/v1/billing/checkout-session", async (req, reply) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return reply.code(401).send({ error: "unauthorized" });
    const claims = verifySession(token);
    if (!claims) return reply.code(401).send({ error: "unauthorized" });

    const body = CheckoutBody.parse(req.body);

    const stripeRes = await resolveStripeForProject(claims.project_id);
    if (stripeRes.mode === "MOCK") {
      return { url: `${env.PUBLIC_BASE_URL}/mock/checkout?project_id=${claims.project_id}&price=${encodeURIComponent(body.priceId)}` };
    }

    // Ensure customer exists
    const existing = await query<any>(
      `SELECT stripe_customer_id FROM subscriptions WHERE project_id=$1 AND user_id=$2 LIMIT 1`,
      [claims.project_id, claims.sub]
    );
    let customerId = existing[0]?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripeRes.stripe.customers.create({
        email: claims.email,
        metadata: { project_id: claims.project_id, user_id: claims.sub },
      });
      customerId = customer.id;
    }

    const session = await stripeRes.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: { project_id: claims.project_id, user_id: claims.sub },
    });

    return { url: session.url };
  });

  // Stripe webhook (use ?project_id=proj_xxx)
  app.post("/v1/billing/webhook", { config: { rawBody: true } } as any, async (req, reply) => {
    const projectId = (req.query as any)?.project_id as string | undefined;
    if (!projectId) return reply.code(400).send({ error: "missing_project_id" });

    const stripeRes = await resolveStripeForProject(projectId);
    if (stripeRes.mode === "MOCK") return reply.code(200).send({ ok: true, mode: "MOCK" });

    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string") return reply.code(400).send({ error: "missing_signature" });

    const webhookSecret = stripeRes.webhookSecret;
    if (!webhookSecret) return reply.code(400).send({ error: "missing_webhook_secret_for_project" });

    let event;
    try {
      // @ts-ignore - fastify rawBody enabled in server
      const body = req.rawBody as Buffer;
      event = stripeRes.stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      return reply.code(400).send({ error: "invalid_signature", message: err.message });
    }

    // Handle a few core events for subscription state
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const subscriptionId = sub.id as string;
      const status = sub.status as string;
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

      // best-effort map: find by customer id
      const rows = await query<any>(
        `SELECT id, user_id FROM subscriptions WHERE project_id=$1 AND stripe_customer_id=$2 LIMIT 1`,
        [projectId, customerId]
      );

      const rowId = rows[0]?.id || `sub_${customerId}`;
      const userId = rows[0]?.user_id || "unknown";

      await query(
        `INSERT INTO subscriptions (id, project_id, user_id, provider, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at)
         VALUES ($1,$2,$3,'stripe',$4,$5,$6,$7, now(), now())
         ON CONFLICT (id)
         DO UPDATE SET status=EXCLUDED.status, stripe_subscription_id=EXCLUDED.stripe_subscription_id, current_period_end=EXCLUDED.current_period_end, updated_at=now()`,
        [rowId, projectId, userId, status, customerId, subscriptionId, currentPeriodEnd]
      );
    }

    return reply.code(200).send({ received: true });
  });
}
