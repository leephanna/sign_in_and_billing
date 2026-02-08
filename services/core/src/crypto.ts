import crypto from "node:crypto";
import { env } from "./env.js";

function keyBytes(): Buffer {
  // derive stable 32-byte key from arbitrary string
  if (!env.HARMONIA_MASTER_KEY) throw new Error("Missing HARMONIA_MASTER_KEY");
  return crypto.createHash("sha256").update(env.HARMONIA_MASTER_KEY).digest();
}

export function encrypt(plain: string): string {
  const key = keyBytes();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decrypt(enc: string): string {
  const key = keyBytes();
  const buf = Buffer.from(enc, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
