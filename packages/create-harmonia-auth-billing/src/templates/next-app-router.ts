export function nextAppRouterFiles(opts: { projectId: string; apiBaseUrl: string }) {
  const { projectId, apiBaseUrl } = opts;
  return {
    "src/app/harmonia/layout.tsx": `import React from "react";
import { HarmoniaProvider } from "@harmonia/sdk-react";

export default function HarmoniaLayout({ children }: { children: React.ReactNode }) {
  return (
    <HarmoniaProvider projectId="${projectId}" apiBaseUrl="${apiBaseUrl}">
      {children}
    </HarmoniaProvider>
  );
}
`,
    "src/app/harmonia/auth/sign-in/page.tsx": `"use client";
import React from "react";
import { SignInPage } from "@harmonia/sdk-react";

export default function Page() {
  return <SignInPage />;
}
`,
    "src/app/harmonia/auth/sign-up/page.tsx": `"use client";
import React from "react";
import { SignUpPage } from "@harmonia/sdk-react";

export default function Page() {
  return <SignUpPage />;
}
`,
    "src/app/harmonia/billing/page.tsx": `"use client";
import React from "react";
import { BillingPortal } from "@harmonia/sdk-react";

export default function Page() {
  return <BillingPortal defaultPriceId={"price_YOUR_PRICE_ID"} />;
}
`,
    "HARMONIA.md": `# Harmonia Auth + Billing (Drop-in)

Routes added:
- /harmonia/auth/sign-in
- /harmonia/auth/sign-up
- /harmonia/billing

Config:
- projectId: ${projectId}
- apiBaseUrl: ${apiBaseUrl}

Next steps:
1) Replace price_YOUR_PRICE_ID with a real Stripe Price ID.
2) In Harmonia Dashboard, paste Stripe keys for this project.
3) Deploy (Vercel) and ensure the Core API is reachable from the browser.
`,
  } as const;
}
