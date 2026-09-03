// Vercel serverless handler.
// Uses the pre-built bundle at dist/server.cjs (built by esbuild via npm run build).
// The bundle is self-contained — all internal imports are resolved at build time.
import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// The bundle exports Express app's default handler via module.exports = handler
const bundledHandler = require("../dist/server.cjs");

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const fn = bundledHandler.default || bundledHandler;
  return fn(req, res);
}
