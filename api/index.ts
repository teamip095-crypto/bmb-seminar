// Vercel serverless handler.
// Vercel's @vercel/node builder compiles server.ts -> server.js (since type=module).
// We import using .js extension (Node ESM convention) since the source will be compiled.
import handler from "../server.js";

export default handler;
