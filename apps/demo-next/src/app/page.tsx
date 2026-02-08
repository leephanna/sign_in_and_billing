import React from "react";

export default function Page() {
  return (
    <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 16 }}>
      <h2 style={{ marginTop: 0 }}>It’s wired.</h2>
      <p>
        This demo app uses <code>@harmonia/sdk-react</code> to render drop-in auth pages and a billing portal.
      </p>
      <ol>
        <li>Set <code>NEXT_PUBLIC_HARMONIA_PROJECT_ID</code> in <code>.env.local</code></li>
        <li>Go to <a href="/auth/sign-up">Sign up</a></li>
        <li>Then open <a href="/billing">Billing</a></li>
      </ol>
    </div>
  );
}
