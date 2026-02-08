import jwt from "jsonwebtoken";
import { env } from "./env.js";

export type SessionClaims = {
  sub: string;
  project_id: string;
  email: string;
};

export function signSession(claims: SessionClaims): string {
  if (!env.HARMONIA_JWT_SECRET) throw new Error("Missing HARMONIA_JWT_SECRET");
  return jwt.sign(claims, env.HARMONIA_JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionClaims | null {
  if (!env.HARMONIA_JWT_SECRET) throw new Error("Missing HARMONIA_JWT_SECRET");
  try {
    return jwt.verify(token, env.HARMONIA_JWT_SECRET) as SessionClaims;
  } catch {
    return null;
  }
}

export function getBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}
