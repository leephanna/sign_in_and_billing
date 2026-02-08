import { useEffect, useState } from "react";
import { HarmoniaSubscription } from "@harmonia/sdk-core";
import { useHarmonia } from "./context.js";

export function useBilling() {
  const { client, ready } = useHarmonia();
  const [subscription, setSubscription] = useState<HarmoniaSubscription>({ status: "none" } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const s = await client.subscriptionStatus();
      setSubscription(s);
      return s;
    } catch (e: any) {
      setError(e?.message || "Failed to fetch billing status");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function openPortal(returnUrl?: string) {
    const url = await client.createPortalSession(returnUrl);
    window.location.href = url;
  }

  async function startCheckout(priceId: string, successUrl: string, cancelUrl: string) {
    const url = await client.createCheckoutSession(priceId, successUrl, cancelUrl);
    window.location.href = url;
  }

  return { subscription, isLoading, error, refresh, openPortal, startCheckout };
}
