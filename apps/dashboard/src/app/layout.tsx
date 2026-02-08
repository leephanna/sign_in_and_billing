import React from "react";

export const metadata = {
  title: "Harmonia Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", margin: 0, background: "#0b0f19", color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Project Harmonia</div>
              <h1 style={{ margin: "6px 0 0 0" }}>Auth + Billing Dashboard</h1>
            </div>
            <a href="/" style={{ color: "white", opacity: 0.85 }}>
              Projects
            </a>
          </header>

          <main style={{ marginTop: 24 }}>{children}</main>

          <footer style={{ marginTop: 40, opacity: 0.6, fontSize: 12 }}>
            © 2026 AI4Utech LLC — Harmonia
          </footer>
        </div>
      </body>
    </html>
  );
}
