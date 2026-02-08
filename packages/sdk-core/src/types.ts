export type HarmoniaPublicConfig = {
  apiBaseUrl: string;
  project: {
    id: string;
    name: string;
    mode: "sandbox" | "live";
    theme: Record<string, any>;
    features: Record<string, any>;
  };
  billing: {
    provider: "stripe";
    publishableKey: string;
    mode: string; // STRIPE|MOCK
  };
};

export type HarmoniaUser = { id: string; email: string; projectId: string };

export type HarmoniaAuthSession = { token: string; user: HarmoniaUser };

export type HarmoniaSubscription =
  | { status: "none" }
  | {
      status: string;
      current_period_end?: string | null;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
    };
