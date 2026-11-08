import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, HOSTING_STORAGE_DIR, UPLOADS_DIR } from './server/db.js';
import { authRouter } from './server/routes/auth.js';
import { domainsRouter } from './server/routes/domains.js';
import { hostingRouter } from './server/routes/hosting.js';
import { fileManagerRouter } from './server/routes/filemanager.js';
import { dnsRouter } from './server/routes/dns.js';
import { sslRouter } from './server/routes/ssl.js';
import { billingRouter } from './server/routes/billing.js';
import { ticketsRouter } from './server/routes/tickets.js';
import { adminRouter } from './server/routes/admin.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { cronService } from './server/cron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize Background Cron Engine
  cronService.start();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads
  app.use('/storage/uploads', express.static(UPLOADS_DIR));

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/domains', domainsRouter);
  app.use('/api/hosting', hostingRouter);
  app.use('/api/filemanager', fileManagerRouter);
  app.use('/api/dns', dnsRouter);
  app.use('/api/ssl', sslRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);

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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'Nexora Cloud Engine',
      timestamp: new Date().toISOString(),
      activeHostingNodes: 4,
    });
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
