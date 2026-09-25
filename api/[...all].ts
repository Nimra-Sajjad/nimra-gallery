import serverless from 'serverless-http';
import { createApp } from '../server/app.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless entry point. The [...all] filename makes this function
// respond to every request under /api/*, matching the Express routes
// defined in server/app.ts exactly as they are.
let cachedHandler: ReturnType<typeof serverless> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(req as any, res as any);
}
