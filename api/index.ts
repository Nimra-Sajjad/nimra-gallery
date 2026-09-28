import { createApp } from '../server/app.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: Awaited<ReturnType<typeof createApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req as any, res as any);
}
