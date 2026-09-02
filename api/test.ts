// Minimal test endpoint to verify Vercel serverless functions work
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    message: "Minimal test endpoint works",
    timestamp: new Date().toISOString(),
    env: {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: Boolean(process.env.JWT_SECRET)
    }
  }));
}
