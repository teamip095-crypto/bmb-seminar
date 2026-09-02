// Test importing vite — it's a heavy dependency that may cause issues in serverless
import { createServer as createViteServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    step: "vite-import-succeeded",
    hasVite: typeof createViteServer,
    timestamp: new Date().toISOString()
  }));
}
