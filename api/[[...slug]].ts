// Vercel serverless catch-all handler.
// All requests under /api/* are routed here by Vercel's file-system routing.
// We re-export the Express app from ../server.ts as the function handler.
//
// On Vercel, the VERCEL env var is set, so server.ts skips app.listen() and
// exposes a default async handler that forwards to the Express app.
import handler from "../server";

export default handler;
