import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createIceTrayRouter } from './icetray-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createStandaloneApp(options = {}) {
  const app = express();
  app.disable('x-powered-by');

  const dataDir = options.dataDir || process.env.DATA_DIR || path.join(ROOT, 'data');
  const apiRouter = createIceTrayRouter({ dataDir, ...options });

  app.use('/api/v1', apiRouter);
  app.use('/api/ice-tray/v1', apiRouter);
  app.use('/ice-tray-diamonds/api/v1', apiRouter);

  // Serve optical frame sequence from /frames
  app.use(
    ['/frames', '/ice-tray-diamonds/frames'],
    express.static(path.join(ROOT, 'frames'), { maxAge: '7d' }),
  );

  // Serve built Vite bundle if present
  const distDir = path.join(ROOT, 'dist');
  if (existsSync(distDir)) {
    app.use(['/', '/ice-tray-diamonds'], express.static(distDir, { maxAge: '1h' }));
  }

  app.get(['/', '/ice-tray-diamonds', '/ice-tray-diamonds/'], (req, res) => {
    const distIndex = path.join(ROOT, 'dist/index.html');
    const rootIndex = path.join(ROOT, 'index.html');
    res.set('Cache-Control', 'no-cache').sendFile(existsSync(distIndex) ? distIndex : rootIndex);
  });

  app.locals.close = () => apiRouter.locals.store.close();
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8096);
  const host = process.env.HOST || '127.0.0.1';
  const app = createStandaloneApp();
  const server = app.listen(port, host, () => {
    console.log(`Ice Tray Diamonds Atelier System listening on http://${host}:${port}`);
  });
  process.on('SIGTERM', () => {
    server.close(() => app.locals.close());
  });
}
