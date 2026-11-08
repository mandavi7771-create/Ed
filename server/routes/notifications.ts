import { Router, Request, Response } from 'express';
import { db, NotificationItem } from '../db.js';

export const notificationsRouter = Router();

// GET /api/notifications/my
notificationsRouter.get('/my', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  const email = req.query.email as string;

  let notifications = db.getNotifications();
  if (customerId) {
    notifications = notifications.filter((n) => n.recipientId === customerId || (email && n.recipientEmail === email));
  }

  return res.json({ notifications });
});

// PUT /api/notifications/:id/read
notificationsRouter.put('/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  return res.json({ success });
});

// POST /api/notifications/trigger-renewals
// Runs automated scanner for 30d, 15d, 7d, 1d notices per Part 11
notificationsRouter.post('/trigger-renewals', (req: Request, res: Response) => {
  const now = new Date();
  const domains = db.getDomains().filter((d) => d.status === 'active');
  const hosting = db.getHosting().filter((h) => h.status === 'active');

  const dispatched: NotificationItem[] = [];

  // Helper to compute day difference
  const daysDiff = (targetIso: string) => {
    const diffMs = new Date(targetIso).getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 3600 * 24));
  };

  // Check Domains
  for (const d of domains) {
    const remainingDays = daysDiff(d.expiryDate);
    if ([30, 15, 7, 1, 0].includes(remainingDays)) {
      const notif: NotificationItem = {
        id: `NOTIF-REN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        recipientEmail: d.customerEmail,
        recipientId: d.customerId,
        type: 'DOMAIN_RENEWAL_ALERT',
        subject: `Renewal Alert: ${d.domainName} expires in ${remainingDays === 0 ? 'today' : `${remainingDays} days`}`,
        messageHtml: `<p>Your domain <strong>${d.domainName}</strong> is scheduled to expire on ${new Date(d.expiryDate).toLocaleDateString()}. Renewal fee: ₹${d.renewalPrice}. Auto-renew is ${d.autoRenew ? 'ENABLED' : 'DISABLED'}.</p>`,
        isRead: false,
        sentAt: now.toISOString(),
      };
      db.addNotification(notif);
      dispatched.push(notif);
    }
  }

  // Check Hosting
  for (const h of hosting) {
    const remainingDays = daysDiff(h.expiryDate);
    if ([30, 15, 7, 1, 0].includes(remainingDays)) {
      const notif: NotificationItem = {
        id: `NOTIF-REN-H-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        recipientEmail: h.customerEmail,
        recipientId: h.customerId,
        type: 'HOSTING_RENEWAL_ALERT',
        subject: `Hosting Renewal Notice: ${h.domainName} (${remainingDays === 0 ? 'Expiring Today' : `${remainingDays} days remaining`})`,
        messageHtml: `<p>Your cloud hosting account for <strong>${h.domainName}</strong> will expire on ${new Date(h.expiryDate).toLocaleDateString()}. Please ensure renewal before expiry to prevent site downtime.</p>`,
        isRead: false,
        sentAt: now.toISOString(),
      };
      db.addNotification(notif);
      dispatched.push(notif);
    }
  }

  return res.json({
    message: `Renewal check completed. Dispatched ${dispatched.length} notifications.`,
    count: dispatched.length,
    items: dispatched,
  });
});
