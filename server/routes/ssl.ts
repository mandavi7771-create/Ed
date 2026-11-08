import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const sslRouter = Router();

// GET /api/ssl/:hostingId
sslRouter.get('/:hostingId', (req: Request, res: Response) => {
  const account = db.getHosting().find((h) => h.id === req.params.hostingId);
  if (!account) return res.status(404).json({ error: 'Hosting account not found' });

  return res.json({
    hostingId: account.id,
    domain: account.domainName,
    sslStatus: account.sslStatus,
    sslIssuer: account.sslIssuer || "Let's Encrypt Authority X3",
    sslExpiry: account.sslExpiry || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    httpsEnforced: true,
    certificateType: 'ECDSA 384 bits (TLS 1.3)',
    domainsCovered: [account.domainName, `www.${account.domainName}`],
  });
});

// POST /api/ssl/:hostingId/provision
sslRouter.post('/:hostingId/provision', (req: Request, res: Response) => {
  const account = db.getHosting().find((h) => h.id === req.params.hostingId);
  if (!account) return res.status(404).json({ error: 'Hosting account not found' });

  const now = new Date();
  const expiry = new Date(now.getTime() + 90 * 24 * 3600 * 1000);

  const updated = db.updateHosting(account.id, {
    sslStatus: 'active',
    sslIssuer: "Let's Encrypt Authority X3 (ACME v2)",
    sslExpiry: expiry.toISOString(),
  });

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: account.customerId,
    adminEmail: account.customerEmail,
    action: 'SSL_CERTIFICATE_ISSUED',
    entityType: 'hosting',
    entityId: account.id,
    newValue: { domain: account.domainName, issuer: "Let's Encrypt Authority X3" },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: now.toISOString(),
  });

  return res.json({
    message: "Let's Encrypt SSL certificate provisioned and installed successfully.",
    account: updated,
  });
});
