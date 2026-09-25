import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

// This entry point is for traditional / VPS / Docker hosting (npm run dev,
// npm start). If you're deploying to Vercel, api/[...all].ts is used
// instead and this file isn't invoked.
async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nimra Gallery server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
