export const CORE_API = process.env.NEXT_PUBLIC_CORE_API || "http://localhost:4000";
export const ADMIN_KEY = process.env.HARMONIA_ADMIN_KEY || "";

export async function coreFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as any),
  };
  if (ADMIN_KEY) headers["x-harmonia-admin-key"] = ADMIN_KEY;
  if (!headers["content-type"] && init.body) headers["content-type"] = "application/json";

  const res = await fetch(`${CORE_API}${path}`, { ...init, headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json && (json.message || json.error)) || `Core API error (${res.status})`);
  return json as T;
}
