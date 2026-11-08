import { Router, Request, Response } from 'express';
import { db, DnsEntry } from '../db.js';

export const dnsRouter = Router();

// GET /api/dns/:domainId
dnsRouter.get('/:domainId', (req: Request, res: Response) => {
  const domain = db.getDomains().find((d) => d.id === req.params.domainId);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  const records = db.getDns().filter((r) => r.domainId === domain.id);
  const settings = db.getSettings();

  return res.json({
    domain: {
      id: domain.id,
      name: domain.domainName,
      nameservers: domain.nameservers,
      defaultNameservers: [settings.defaultNameserver1, settings.defaultNameserver2],
    },
    records,
  });
});

// POST /api/dns/:domainId
dnsRouter.post('/:domainId', (req: Request, res: Response) => {
  try {
    const domain = db.getDomains().find((d) => d.id === req.params.domainId);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const { type, name, content, ttl, priority } = req.body;
    if (!type || !name || !content) {
      return res.status(400).json({ error: 'Record type, name, and content are required' });
    }

    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid DNS record type. Must be one of: ${validTypes.join(', ')}` });
    }

    const newRecord: DnsEntry = {
      id: `DNS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      domainId: domain.id,
      domainName: domain.domainName,
      type,
      name: name.trim(),
      content: content.trim(),
      ttl: Number(ttl) || 3600,
      priority: priority !== undefined ? Number(priority) : undefined,
      createdAt: new Date().toISOString(),
    };

    db.addDns(newRecord);

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: domain.customerId,
      adminEmail: domain.customerEmail,
      action: 'DNS_RECORD_ADDED',
      entityType: 'domain',
      entityId: domain.id,
      newValue: { type, name, content, ttl },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ message: 'DNS record created', record: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/dns/:domainId/:recordId
dnsRouter.put('/:domainId/:recordId', (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    const { name, content, ttl, priority } = req.body;

    const existing = db.getDns().find((r) => r.id === recordId);
    if (!existing) return res.status(404).json({ error: 'DNS record not found' });

    const updated = db.updateDns(recordId, {
      name: name !== undefined ? name.trim() : existing.name,
      content: content !== undefined ? content.trim() : existing.content,
      ttl: ttl !== undefined ? Number(ttl) : existing.ttl,
      priority: priority !== undefined ? Number(priority) : existing.priority,
    });

    return res.json({ message: 'DNS record updated', record: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dns/:domainId/:recordId
dnsRouter.delete('/:domainId/:recordId', (req: Request, res: Response) => {
  const { recordId } = req.params;
  const deleted = db.deleteDns(recordId);
  if (!deleted) return res.status(404).json({ error: 'DNS record not found' });

  return res.json({ message: 'DNS record deleted successfully' });
});

// GET /api/dns/:domainId/verify
dnsRouter.get('/:domainId/verify', (req: Request, res: Response) => {
  const domain = db.getDomains().find((d) => d.id === req.params.domainId);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  const records = db.getDns().filter((r) => r.domainId === domain.id);

  return res.json({
    domain: domain.domainName,
    nameserversPropagated: true,
    propagationPercentage: 100,
    activeRecordsCount: records.length,
    status: 'propagated',
    testedAt: new Date().toISOString(),
  });
});
