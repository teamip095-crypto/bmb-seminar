import express from "express";
import type { IncomingMessage, ServerResponse } from "http";

const app = express();
app.get("/api/health", (req, res) => {
  res.json({ ok: true, msg: "express works in vercel", time: new Date().toISOString() });
});

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  (app as any)(req, res);
}
