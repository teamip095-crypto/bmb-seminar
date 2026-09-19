// Vercel serverless catch-all handler.
// Uses the pre-built bundle at dist/server.cjs (built by esbuild via npm run build).
// The bundle is self-contained — all internal imports are resolved at build time,
// avoiding ESM directory import issues.
import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bundledHandler = require("../dist/server.cjs");

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const fn = bundledHandler.default || bundledHandler;
  return fn(req, res);
}
