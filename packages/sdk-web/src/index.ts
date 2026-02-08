import { HarmoniaClient } from "@harmonia/sdk-core";

function styleTag() {
  return `
  <style>
    .card { max-width: 420px; margin: 24px auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 16px; font-family: ui-sans-serif, system-ui; }
    .muted { color: #6b7280; font-size: 14px; }
    input { width: 100%; box-sizing: border-box; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; margin-top: 8px; }
    button { padding: 10px; border-radius: 10px; border: 1px solid #111827; background: #111827; color: white; width: 100%; margin-top: 12px; cursor: pointer; }
    .error { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 10px; margin-top: 10px; }
    a { color: inherit; }
  </style>
  `;
}

abstract class HarmoniaBase extends HTMLElement {
  projectId = "";
  apiBaseUrl = "";

  client: HarmoniaClient | null = null;

  connectedCallback() {
    this.projectId = this.getAttribute("project-id") || "";
    this.apiBaseUrl = this.getAttribute("api-base-url") || "";
    if (!this.projectId || !this.apiBaseUrl) {
      this.attachShadow({ mode: "open" }).innerHTML = `${styleTag()}<div class="card"><h3>Harmonia</h3><p class="muted">Missing project-id or api-base-url</p></div>`;
      return;
    }
    this.client = new HarmoniaClient({ projectId: this.projectId, apiBaseUrl: this.apiBaseUrl });
    this.render();
  }

  abstract render(): void;
}

export class HarmoniaSignIn extends HarmoniaBase {
  render() {
    const root = this.shadowRoot || this.attachShadow({ mode: "open" });
    root.innerHTML = `${styleTag()}
      <div class="card">
        <h2 style="margin:0">Sign in</h2>
        <p class="muted">Harmonia Auth</p>
        <form id="f">
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Sign in</button>
          <div id="err"></div>
        </form>
      </div>
    `;
    const form = root.querySelector("#f") as HTMLFormElement;
    const err = root.querySelector("#err") as HTMLDivElement;
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.innerHTML = "";
      const fd = new FormData(form);
      try {
        await this.client!.signIn(String(fd.get("email")), String(fd.get("password")));
        this.dispatchEvent(new CustomEvent("harmonia:signin", { bubbles: true }));
      } catch (ex: any) {
        err.innerHTML = `<div class="error">${ex?.message || "Sign in failed"}</div>`;
      }
    };
  }
}

export class HarmoniaBillingPortal extends HarmoniaBase {
  render() {
    const root = this.shadowRoot || this.attachShadow({ mode: "open" });
    root.innerHTML = `${styleTag()}
      <div class="card">
        <h2 style="margin:0">Billing</h2>
        <p class="muted">Open customer portal</p>
        <button id="b">Open portal</button>
        <div id="err"></div>
      </div>
    `;
    const btn = root.querySelector("#b") as HTMLButtonElement;
    const err = root.querySelector("#err") as HTMLDivElement;
    btn.onclick = async () => {
      err.innerHTML = "";
      try {
        const url = await this.client!.createPortalSession(window.location.href);
        window.location.href = url;
      } catch (ex: any) {
        err.innerHTML = `<div class="error">${ex?.message || "Billing failed"}</div>`;
      }
    };
  }
}

customElements.define("harmonia-sign-in", HarmoniaSignIn);
customElements.define("harmonia-billing-portal", HarmoniaBillingPortal);
