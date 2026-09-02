// Vercel serverless catch-all handler.
// All requests under /api/* are routed here by Vercel's file-system routing.
// We re-export the Express app from ../server.ts as the function handler.
//
// Note: We use a static import with explicit .ts extension because Node ESM
// does not support directory imports (resolving "../server" to "../server/index.js").
// Vercel's @vercel/node builder handles TypeScript compilation transparently.
import handler from "../server.ts";

export default handler;
