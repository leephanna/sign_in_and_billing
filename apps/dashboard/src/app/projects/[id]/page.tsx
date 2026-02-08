import React from "react";
import { coreFetch, CORE_API } from "../../../lib/core";

type Project = { id: string; name: string; mode: "sandbox" | "live"; theme: any; features: any; created_at: string };
type ProjectResp = { project: Project; secrets: { has_stripe_secret: boolean; has_stripe_publishable: boolean; has_stripe_webhook_secret: boolean } };

async function updateProject(id: string, formData: FormData) {
  "use server";
  const mode = String(formData.get("mode") || "");
  await coreFetch(`/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify({ mode }) });
}

async function saveSecrets(id: string, formData: FormData) {
  "use server";
  const stripe_secret = String(formData.get("stripe_secret") || "").trim();
  const stripe_publishable = String(formData.get("stripe_publishable") || "").trim();
  const stripe_webhook_secret = String(formData.get("stripe_webhook_secret") || "").trim();

  await coreFetch(`/v1/projects/${id}/secrets`, {
    method: "PUT",
    body: JSON.stringify({
      stripe_secret: stripe_secret || undefined,
      stripe_publishable: stripe_publishable || undefined,
      stripe_webhook_secret: stripe_webhook_secret || undefined,
    }),
  });
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await coreFetch<ProjectResp>(`/v1/projects/${params.id}`, { method: "GET" });

  const snippet = `import { HarmoniaProvider, SignInPage, SignUpPage, BillingPortal } from "@harmonia/sdk-react";

export default function App() {
  return (
    <HarmoniaProvider projectId="${data.project.id}" apiBaseUrl="${CORE_API}">
      {/* routes/pages */}
    </HarmoniaProvider>
  );
}
`;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>{data.project.name}</h2>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{data.project.id}</div>
          </div>
          <div style={{ opacity: 0.9, fontWeight: 700 }}>{data.project.mode.toUpperCase()}</div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form action={updateProject.bind(null, data.project.id)} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ opacity: 0.8 }}>Mode</label>
            <select name="mode" defaultValue={data.project.mode} style={select()}>
              <option value="sandbox">sandbox</option>
              <option value="live">live</option>
            </select>
            <button style={button()} type="submit">
              Save
            </button>
          </form>

          <a href="http://localhost:3001" style={{ ...buttonGhost(), textDecoration: "none" }}>
            Open demo app →
          </a>
        </div>
      </section>

      <section style={card()}>
        <h3 style={{ marginTop: 0 }}>Stripe keys (encrypted)</h3>
        <div style={{ opacity: 0.7, fontSize: 13, marginBottom: 10 }}>
          For sandbox, you can rely on platform test keys (core env). For live, paste your project’s keys here and flip mode to <b>live</b>.
        </div>

        <form action={saveSecrets.bind(null, data.project.id)} style={{ display: "grid", gap: 10 }}>
          <input name="stripe_publishable" placeholder="Stripe publishable key (pk_...)" style={input()} />
          <input name="stripe_secret" placeholder="Stripe secret key (sk_...)" style={input()} />
          <input name="stripe_webhook_secret" placeholder="Stripe webhook signing secret (whsec_...)" style={input()} />
          <button style={button()} type="submit">
            Save secrets
          </button>
        </form>

        <div style={{ opacity: 0.7, fontSize: 13, marginTop: 10 }}>
          Saved? publishable={String(data.secrets.has_stripe_publishable)} secret={String(data.secrets.has_stripe_secret)} webhook={String(
            data.secrets.has_stripe_webhook_secret
          )}
        </div>
      </section>

      <section style={card()}>
        <h3 style={{ marginTop: 0 }}>SDK snippet</h3>
        <pre style={pre()}>{snippet}</pre>
      </section>
    </div>
  );
}

function card(): React.CSSProperties {
  return { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16 };
}
function input(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0b1220", color: "white", width: "100%" };
}
function select(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0b1220", color: "white" };
}
function button(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #60a5fa", background: "#60a5fa", color: "#0b0f19", fontWeight: 700 };
}
function buttonGhost(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0b1220", color: "white", fontWeight: 700 };
}
function pre(): React.CSSProperties {
  return { padding: 12, borderRadius: 12, border: "1px solid #1f2937", background: "#0b1220", overflowX: "auto", fontSize: 13, margin: 0 };
}
