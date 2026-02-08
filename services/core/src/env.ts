import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,

  DATABASE_URL: process.env.DATABASE_URL || "postgres://harmonia:harmonia@localhost:5432/harmonia",

  HARMONIA_MASTER_KEY: process.env.HARMONIA_MASTER_KEY || "",
  HARMONIA_JWT_SECRET: process.env.HARMONIA_JWT_SECRET || "",

  HARMONIA_ADMIN_KEY: process.env.HARMONIA_ADMIN_KEY || "",

  PLATFORM_STRIPE_TEST_SECRET: process.env.HARMONIA_PLATFORM_STRIPE_TEST_SECRET || "",
  PLATFORM_STRIPE_TEST_PUBLISHABLE: process.env.HARMONIA_PLATFORM_STRIPE_TEST_PUBLISHABLE || "",
  PLATFORM_STRIPE_WEBHOOK_SECRET: process.env.HARMONIA_PLATFORM_STRIPE_WEBHOOK_SECRET || "",

  BILLING_MODE: (process.env.HARMONIA_BILLING_MODE || "MOCK").toUpperCase(), // STRIPE | MOCK
} as const;

export function requireEnv(name: keyof typeof env) {
  const v = env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
