import React, { useState } from "react";
import { useAuth } from "../useAuth.js";

export function SignInPage() {
  const { signIn, user, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return (
      <div style={styles.card}>
        <h2>Signed in</h2>
        <p>{user.email}</p>
        <a href="/billing">Go to Billing →</a>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h1 style={{ margin: 0 }}>Sign in</h1>
      <p style={styles.muted}>Use your project’s Harmonia auth.</p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn(email, password);
          window.location.href = "/billing";
        }}
        style={{ display: "grid", gap: 10 }}
      >
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required style={styles.input} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required style={styles.input} />
        <button disabled={isLoading} style={styles.button} type="submit">
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
        {error && <div style={styles.error}>{error}</div>}
      </form>

      <p style={styles.muted}>
        Need an account? <a href="/auth/sign-up">Create one</a>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { maxWidth: 420, margin: "40px auto", padding: 20, border: "1px solid #e5e7eb", borderRadius: 16 },
  muted: { color: "#6b7280" },
  input: { padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" },
  button: { padding: 10, borderRadius: 10, border: "1px solid #111827", background: "#111827", color: "white", cursor: "pointer" },
  error: { background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10 },
};
