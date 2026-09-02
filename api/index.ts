// Vercel serverless handler with module-load error capture
import type { IncomingMessage, ServerResponse } from "http";

let serverHandler: ((req: IncomingMessage, res: ServerResponse) => void | Promise<void>) | null = null;
let initError: any = null;

// Use dynamic import so we can catch load errors
const importPromise = (async () => {
  try {
    const mod = await import("../server.js");
    serverHandler = mod.default;
    console.log("[bmb-seminar] server module loaded");
  } catch (err) {
    initError = err;
    console.error("[bmb-seminar] server module load failed:", err);
  }
})();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await importPromise.catch(() => {});
  if (initError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "server module failed to load",
      message: initError?.message,
      code: initError?.code,
      stack: initError?.stack?.split("\n").slice(0, 15)
    }));
    return;
  }
  if (serverHandler) {
    try {
      return await serverHandler(req, res);
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "handler threw",
        message: err?.message,
        stack: err?.stack?.split("\n").slice(0, 10)
      }));
    }
  } else {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "handler null after import" }));
  }
}
