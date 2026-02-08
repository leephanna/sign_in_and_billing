#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { nextAppRouterFiles } from "./templates/next-app-router.js";

function writeFileSafe(baseDir: string, rel: string, content: string) {
  const p = path.join(baseDir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || process.cwd();

  const answers = await prompts([
    { type: "text", name: "projectId", message: "Harmonia projectId (proj_...)", validate: (v) => (v?.startsWith("proj_") ? true : "Must start with proj_") },
    { type: "text", name: "apiBaseUrl", message: "Core API base URL", initial: "http://localhost:4000" },
    { type: "select", name: "framework", message: "Framework", choices: [{ title: "Next.js (App Router)", value: "next-app" }], initial: 0 },
  ]);

  if (!answers.projectId || !answers.apiBaseUrl) {
    console.error("Cancelled.");
    process.exit(1);
  }

  const files = nextAppRouterFiles({ projectId: answers.projectId, apiBaseUrl: answers.apiBaseUrl });
  for (const [rel, content] of Object.entries(files)) {
    writeFileSafe(target, rel, content);
  }

  console.log("\n✅ Added Harmonia routes and docs.");
  console.log("Open HARMONIA.md for next steps.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
