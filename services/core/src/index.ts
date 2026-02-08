import { env } from "./env.js";
import { buildApp } from "./app.js";

const app = await buildApp();

await app.listen({ port: env.PORT, host: "0.0.0.0" });
app.log.info(`Core service listening on ${env.PUBLIC_BASE_URL}`);
