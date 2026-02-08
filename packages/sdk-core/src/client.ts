import { HarmoniaAuthSession, HarmoniaPublicConfig, HarmoniaSubscription, HarmoniaUser } from "./types.js";
import { TokenStore, createBrowserTokenStore, createMemoryTokenStore } from "./storage.js";

export type HarmoniaClientOptions = {
  projectId: string;
  apiBaseUrl?: string; // optional; if omitted, read from public-config
  tokenStore?: TokenStore;
};

export class HarmoniaClient {
  projectId: string;
  apiBaseUrl: string | null;
  tokenStore: TokenStore;
  config: HarmoniaPublicConfig | null = null;

  constructor(opts: HarmoniaClientOptions) {
    this.projectId = opts.projectId;
    this.apiBaseUrl = opts.apiBaseUrl ?? null;
    this.tokenStore = opts.tokenStore ?? (typeof window !== "undefined" ? createBrowserTokenStore() : createMemoryTokenStore());
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const base = this.apiBaseUrl || (this.config?.apiBaseUrl ?? "");
    if (!base) throw new Error("HarmoniaClient missing apiBaseUrl (call loadConfig first or pass apiBaseUrl)");
    const token = this.tokenStore.get();

    const headers: Record<string, string> = {
      ...(init.headers as any),
    };
    if (!headers["content-type"] && init.body) headers["content-type"] = "application/json";
    if (token) headers["authorization"] = `Bearer ${token}`;

    const res = await fetch(`${base}${path}`, { ...init, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (json && (json.message || json.error)) || `Request failed: ${res.status}`;
      throw new Error(msg);
    }
    return json as T;
  }

  async loadConfig(): Promise<HarmoniaPublicConfig> {
    const base = this.apiBaseUrl || "";
    // if apiBaseUrl not supplied, assume same-origin is not available; require base to be passed
    if (!base) throw new Error("Pass apiBaseUrl to HarmoniaClient or set it in your env.");
    const cfg = await this.request<HarmoniaPublicConfig>(`/v1/projects/${this.projectId}/public-config`, { method: "GET" });
    this.config = cfg;
    this.apiBaseUrl = cfg.apiBaseUrl;
    return cfg;
  }

  async signUp(email: string, password: string): Promise<HarmoniaAuthSession> {
    const session = await this.request<HarmoniaAuthSession>("/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ projectId: this.projectId, email, password }),
    });
    this.tokenStore.set(session.token);
    return session;
  }

  async signIn(email: string, password: string): Promise<HarmoniaAuthSession> {
    const session = await this.request<HarmoniaAuthSession>("/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify({ projectId: this.projectId, email, password }),
    });
    this.tokenStore.set(session.token);
    return session;
  }

  async signOut(): Promise<void> {
    this.tokenStore.set(null);
  }

  async me(): Promise<HarmoniaUser> {
    const res = await this.request<{ user: HarmoniaUser }>("/v1/auth/me", { method: "GET" });
    return res.user;
  }

  async subscriptionStatus(): Promise<HarmoniaSubscription> {
    const res = await this.request<{ subscription: HarmoniaSubscription }>("/v1/billing/status", { method: "GET" });
    return res.subscription;
  }

  async createPortalSession(returnUrl?: string): Promise<string> {
    const res = await this.request<{ url: string }>("/v1/billing/portal-session", {
      method: "POST",
      body: JSON.stringify({ returnUrl }),
    });
    return res.url;
  }

  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const res = await this.request<{ url: string }>("/v1/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({ priceId, successUrl, cancelUrl }),
    });
    return res.url;
  }
}
