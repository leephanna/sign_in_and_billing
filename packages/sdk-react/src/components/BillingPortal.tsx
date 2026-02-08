import React, { useMemo } from "react";
import { useAuth } from "../useAuth.js";
import { useBilling } from "../useBilling.js";

export type BillingPortalProps = {
  defaultPriceId?: string; // Stripe price id for checkout
};

export function BillingPortal(props: BillingPortalProps) {
  const { user } = useAuth();
  const { subscription, isLoading, error, openPortal, startCheckout, refresh } = useBilling();

  const priceId = useMemo(() => props.defaultPriceId || "price_YOUR_PRICE_ID", [props.defaultPriceId]);

  if (!user) {
    return (
      <div style={styles.card}>
        <h2>Billing</h2>
        <p>You’re not signed in.</p>
        <a href="/auth/sign-in">Sign in →</a>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h1 style={{ margin: 0 }}>Billing</h1>
      <p style={styles.muted}>Manage subscriptions for {user.email}</p>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={styles.box}>
          <div style={{ fontWeight: 600 }}>Status</div>
          <div>{(subscription as any)?.status || "none"}</div>
          {(subscription as any)?.current_period_end && (
            <div style={styles.muted}>Renews/ends: {(subscription as any).current_period_end}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.button} onClick={() => openPortal(window.location.href)} disabled={isLoading}>
            Open customer portal
          </button>

          <button
            style={styles.buttonSecondary}
            onClick={() => startCheckout(priceId, `${window.location.origin}/billing?success=1`, `${window.location.origin}/billing?canceled=1`)}
            disabled={isLoading}
            title="Starts a subscription checkout for the configured Stripe Price ID"
          >
            Start checkout
          </button>

          <button style={styles.buttonGhost} onClick={() => refresh()} disabled={isLoading}>
            Refresh
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.muted}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>What to configure</div>
          <ol style={{ marginTop: 0 }}>
            <li>In Dashboard, paste Stripe keys for this project.</li>
            <li>Replace <code>defaultPriceId</code> with your Stripe Price ID.</li>
            <li>Flip project to <b>live</b> when ready.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { maxWidth: 680, margin: "40px auto", padding: 20, border: "1px solid #e5e7eb", borderRadius: 16 },
  muted: { color: "#6b7280" },
  box: { padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fafafa" },
  button: { padding: "10px 12px", borderRadius: 10, border: "1px solid #111827", background: "#111827", color: "white", cursor: "pointer" },
  buttonSecondary: { padding: "10px 12px", borderRadius: 10, border: "1px solid #111827", background: "white", color: "#111827", cursor: "pointer" },
  buttonGhost: { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#111827", cursor: "pointer" },
  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10 },
};
