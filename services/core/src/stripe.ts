import Stripe from "stripe";
import { env } from "./env.js";
import { query } from "./db.js";
import { decrypt } from "./crypto.js";

export type StripeResolution =
  | { mode: "MOCK"; reason: string }
  | { mode: "STRIPE"; stripe: Stripe; secretKey: string; webhookSecret?: string };

export async function resolveStripeForProject(projectId: string): Promise<StripeResolution> {
  const proj = await query<any>(`SELECT id, mode FROM projects WHERE id=$1`, [projectId]);
  if (proj.length === 0) return { mode: "MOCK", reason: "project_not_found" };

  const mode = proj[0].mode as "sandbox" | "live";
  let secretKey = "";
  let webhookSecret = "";

  if (mode === "live") {
    const sec = await query<any>(`SELECT stripe_secret_enc, stripe_webhook_secret_enc FROM project_secrets WHERE project_id=$1`, [projectId]);
    if (sec[0]?.stripe_secret_enc) secretKey = decrypt(sec[0].stripe_secret_enc);
    if (sec[0]?.stripe_webhook_secret_enc) webhookSecret = decrypt(sec[0].stripe_webhook_secret_enc);
  } else {
    secretKey = env.PLATFORM_STRIPE_TEST_SECRET || "";
    webhookSecret = env.PLATFORM_STRIPE_WEBHOOK_SECRET || "";
  }

  if (!secretKey || env.BILLING_MODE === "MOCK") {
    return { mode: "MOCK", reason: !secretKey ? "missing_stripe_secret" : "billing_mode_mock" };
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  return { mode: "STRIPE", stripe, secretKey, webhookSecret: webhookSecret || undefined };
}
