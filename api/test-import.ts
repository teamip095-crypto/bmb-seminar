// Test that imports the Express app to see if it loads
import type { IncomingMessage, ServerResponse } from "http";
import serverHandler from "../server";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    // Just check that the import succeeded
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      ok: true,
      step: "import-succeeded",
      handlerType: typeof serverHandler,
      timestamp: new Date().toISOString()
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Import or setup failed",
      message: err?.message,
      stack: err?.stack?.split("\n").slice(0, 5)
    }));
  }
}
