// Vercel handler with diagnostic capture
import type { IncomingMessage, ServerResponse } from "http";

let serverHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;
let initError: any = null;

(async () => {
  try {
    const mod = await import("../server.ts");
    serverHandler = mod.default;
    console.log("[bmb-seminar] server.ts loaded successfully");
  } catch (err) {
    initError = err;
    console.error("[bmb-seminar] Failed to import server.ts:", err);
  }
})();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (initError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Server module failed to load",
      message: initError?.message,
      stack: initError?.stack?.split("\n").slice(0, 15)
    }));
    return;
  }
  if (!serverHandler) {
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (serverHandler || initError) break;
    }
  }
  if (serverHandler) {
    try {
      await serverHandler(req, res);
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "Handler threw",
        message: err?.message,
        stack: err?.stack?.split("\n").slice(0, 10)
      }));
    }
  } else {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server module never loaded" }));
  }
}
