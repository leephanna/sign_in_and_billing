import React from "react";
import { coreFetch } from "../lib/core";

type Project = { id: string; name: string; mode: string; created_at: string };

async function createProject(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await coreFetch("/v1/projects", { method: "POST", body: JSON.stringify({ name }) });
}

export default async function Page() {
  const data = await coreFetch<{ projects: Project[] }>("/v1/projects", { method: "GET" });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={card()}>
        <h2 style={{ marginTop: 0 }}>Create project</h2>
        <form action={createProject} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input name="name" placeholder="Project name" style={input()} required />
          <button style={button()} type="submit">
            Create
          </button>
        </form>
        <div style={{ opacity: 0.7, marginTop: 10, fontSize: 13 }}>
          New projects start in <b>sandbox</b> mode using platform test keys (or mock billing).
        </div>
      </section>

      <section style={card()}>
        <h2 style={{ marginTop: 0 }}>Projects</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {data.projects.map((p) => (
            <a key={p.id} href={`/projects/${p.id}`} style={linkRow()}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ opacity: 0.7, fontSize: 13 }}>{p.id}</div>
              <div style={{ marginLeft: "auto", opacity: 0.9 }}>{p.mode.toUpperCase()}</div>
            </a>
          ))}
          {data.projects.length === 0 && <div style={{ opacity: 0.7 }}>No projects yet.</div>}
        </div>
      </section>
    </div>
  );
}

function card(): React.CSSProperties {
  return { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16 };
}
function input(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #374151", background: "#0b1220", color: "white", minWidth: 320 };
}
function button(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 10, border: "1px solid #60a5fa", background: "#60a5fa", color: "#0b0f19", fontWeight: 700 };
}
function linkRow(): React.CSSProperties {
  return { padding: 12, borderRadius: 12, border: "1px solid #1f2937", background: "#0b1220", color: "white", textDecoration: "none", display: "flex", gap: 10, alignItems: "center" };
}
