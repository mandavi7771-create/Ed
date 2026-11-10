import express, { Express } from 'express';
import { db, HOSTING_STORAGE_DIR, UPLOADS_DIR } from './db.js';
import { authRouter } from './routes/auth.js';
import { domainsRouter } from './routes/domains.js';
import { hostingRouter } from './routes/hosting.js';
import { fileManagerRouter } from './routes/filemanager.js';
import { dnsRouter } from './routes/dns.js';
import { sslRouter } from './routes/ssl.js';
import { billingRouter } from './routes/billing.js';
import { ticketsRouter } from './routes/tickets.js';
import { adminRouter } from './routes/admin.js';
import { notificationsRouter } from './routes/notifications.js';

export function createExpressApp(): Express {
  const app = express();

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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'Nexora Cloud Engine',
      timestamp: new Date().toISOString(),
      activeHostingNodes: 4,
    });
  });

  return app;
}
