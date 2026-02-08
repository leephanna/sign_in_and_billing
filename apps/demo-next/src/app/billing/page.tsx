"use client";
import React from "react";
import { BillingPortal, HarmoniaProvider } from "@harmonia/sdk-react";

export default function Page() {
  const projectId = process.env.NEXT_PUBLIC_HARMONIA_PROJECT_ID || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_HARMONIA_API_BASE_URL || "http://localhost:4000";
  return (
    <HarmoniaProvider projectId={projectId} apiBaseUrl={apiBaseUrl}>
      <BillingPortal defaultPriceId={"price_YOUR_PRICE_ID"} />
    </HarmoniaProvider>
  );
}
