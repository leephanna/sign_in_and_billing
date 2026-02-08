import React from "react";

export const metadata = { title: "Harmonia Demo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", margin: 0, background: "#ffffff", color: "#111827" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ textDecoration: "none", color: "#111827" }}>
              <b>Harmonia Demo</b>
            </a>
            <nav style={{ display: "flex", gap: 12 }}>
              <a href="/auth/sign-in">Sign in</a>
              <a href="/auth/sign-up">Sign up</a>
              <a href="/billing">Billing</a>
            </nav>
          </header>
          <main style={{ marginTop: 18 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
