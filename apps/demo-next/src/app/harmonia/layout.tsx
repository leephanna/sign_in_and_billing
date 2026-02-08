"use client";
import React from "react";
import { HarmoniaProvider } from "@harmonia/sdk-react";

export default function HarmoniaLayout({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_HARMONIA_PROJECT_ID || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_HARMONIA_API_BASE_URL || "http://localhost:4000";

  if (!projectId) {
    return (
      <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <h3 style={{ marginTop: 0 }}>Missing env</h3>
        <p>
          Set <code>NEXT_PUBLIC_HARMONIA_PROJECT_ID</code> in <code>.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <HarmoniaProvider projectId={projectId} apiBaseUrl={apiBaseUrl}>
      {children}
    </HarmoniaProvider>
  );
}
