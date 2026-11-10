import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, HOSTING_STORAGE_DIR } from './server/db.js';
import { createExpressApp } from './server/app.js';
import { cronService } from './server/cron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createExpressApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize Background Cron Engine
  cronService.start();

  // Serve live deployed websites at /sites/:hostingId/*
  // This delivers actual extracted user HTML, CSS, JS from their public_html directory!
  app.use('/sites/:hostingId', (req, res, next) => {
    const hostingId = req.params.hostingId;
    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) {
      return res.status(404).send('Hosting account not found on this server.');
    }

    if (account.status === 'suspended') {
      return res.status(403).send(`<h1>Website Suspended</h1><p>${account.suspendedReason || 'This hosting service is suspended.'}</p>`);
    }

    const customerDir = path.join(HOSTING_STORAGE_DIR, account.customerId, account.id, 'public_html');
    if (!fs.existsSync(customerDir)) {
      return res.status(404).send('Website document root not yet initialized.');
    }

    // Serve static files from the customer's public_html
    express.static(customerDir, { index: ['index.html', 'index.htm'] })(req, res, next);
  });

  // Vite middleware in dev or static dist in prod
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora Cloud Platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
