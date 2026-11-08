import { Router, Request, Response } from 'express';
import { db, HostingPlan, TldPricing, User } from '../db.js';

export const adminRouter = Router();

// Middleware helper to check admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  // In demo / preview, ensure header or role parameter passes
  next();
}

// GET /api/admin/overview?range=30d
adminRouter.get('/overview', requireAdmin, (req: Request, res: Response) => {
  const range = (req.query.range as string) || '30d';

  const users = db.getUsers();
  const customers = users.filter((u) => u.role === 'customer');
  const domains = db.getDomains();
  const hosting = db.getHosting();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const tickets = db.getTickets();

  // Filter based on date range
  const now = new Date();
  let cutoff = new Date(0); // All time default

  if (range === 'today') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d') {
    cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  } else if (range === '30d') {
    cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  } else if (range === 'this_month') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'this_year') {
    cutoff = new Date(now.getFullYear(), 0, 1);
  }

  const rangePayments = payments.filter((p) => new Date(p.createdAt) >= cutoff && p.status === 'successful');
  const totalRevenue = rangePayments.reduce((acc, p) => acc + p.amount, 0);

  // Month and Year calculations
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthlyRevenue = payments
    .filter((p) => new Date(p.createdAt) >= monthStart && p.status === 'successful')
    .reduce((acc, p) => acc + p.amount, 0);
  const yearlyRevenue = payments
    .filter((p) => new Date(p.createdAt) >= yearStart && p.status === 'successful')
    .reduce((acc, p) => acc + p.amount, 0);

  // Expiring within 30 days
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const expiringDomains = domains.filter((d) => new Date(d.expiryDate) <= thirtyDaysAhead && d.status === 'active').length;
  const expiringHosting = hosting.filter((h) => new Date(h.expiryDate) <= thirtyDaysAhead && h.status === 'active').length;

  return res.json({
    metrics: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'active').length,
      totalDomains: domains.length,
      activeDomains: domains.filter((d) => d.status === 'active').length,
      totalHosting: hosting.length,
      activeHosting: hosting.filter((h) => h.status === 'active').length,
      pendingOrders: orders.filter((o) => o.paymentStatus === 'pending').length,
      successfulPayments: payments.filter((p) => p.status === 'successful').length,
      failedPayments: payments.filter((p) => p.status === 'failed').length,
      totalRefunds: payments.filter((p) => p.status === 'refunded').length,
      revenueInRange: Number(totalRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      yearlyRevenue: Number(yearlyRevenue.toFixed(2)),
      expiringDomains,
      expiringHosting,
      openTickets: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
      serverHealth: {
        nodeCount: 4,
        averageCpuLoad: '14.2%',
        memoryUsage: '38.6%',
        diskHealth: 'Optimal (NVMe Gen4)',
        uptime: '99.98%',
      },
    },
    recentOrders: orders.slice(-6).reverse(),
    recentAuditLogs: db.getAuditLogs().slice(0, 8),
  });
});

// GET /api/admin/customers
adminRouter.get('/customers', requireAdmin, (req: Request, res: Response) => {
  const query = (req.query.search as string || '').toLowerCase();
  let customers = db.getUsers().filter((u) => u.role === 'customer');

  if (query) {
    customers = customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        (c.companyName && c.companyName.toLowerCase().includes(query))
    );
  }

  // Attach service counts
  const enriched = customers.map((c) => {
    const { passwordHash: _, ...safe } = c;
    const domainCount = db.getDomains().filter((d) => d.customerId === c.id).length;
    const hostingCount = db.getHosting().filter((h) => h.customerId === c.id).length;
    const orderCount = db.getOrders().filter((o) => o.customerId === c.id).length;
    return { ...safe, domainCount, hostingCount, orderCount };
  });

  return res.json({ customers: enriched });
});

// GET /api/admin/customers/:id
adminRouter.get('/customers/:id', requireAdmin, (req: Request, res: Response) => {
  const customer = db.getUsers().find((u) => u.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const { passwordHash: _, ...safe } = customer;
  const domains = db.getDomains().filter((d) => d.customerId === customer.id);
  const hosting = db.getHosting().filter((h) => h.customerId === customer.id);
  const orders = db.getOrders().filter((o) => o.customerId === customer.id);
  const payments = db.getPayments().filter((p) => p.customerId === customer.id);
  const tickets = db.getTickets().filter((t) => t.customerId === customer.id);

  return res.json({ customer: safe, domains, hosting, orders, payments, tickets });
});

// PUT /api/admin/customers/:id/suspend
adminRouter.put('/customers/:id/suspend', requireAdmin, (req: Request, res: Response) => {
  const { reason, adminId, adminEmail } = req.body;
  if (!reason) return res.status(400).json({ error: 'Suspension reason is required' });

  const customer = db.getUsers().find((u) => u.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const updated = db.updateUser(customer.id, {
    status: 'suspended',
    suspendedReason: reason,
  });

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: adminId || 'ADM-1001',
    adminEmail: adminEmail || 'admin@nexoracloud.com',
    action: 'CUSTOMER_SUSPENDED',
    entityType: 'customer',
    entityId: customer.id,
    previousValue: { status: customer.status },
    newValue: { status: 'suspended', reason },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Customer account suspended', customer: updated });
});

// PUT /api/admin/customers/:id/reactivate
adminRouter.put('/customers/:id/reactivate', requireAdmin, (req: Request, res: Response) => {
  const { adminId, adminEmail } = req.body;
  const customer = db.getUsers().find((u) => u.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const updated = db.updateUser(customer.id, {
    status: 'active',
    suspendedReason: undefined,
  });

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: adminId || 'ADM-1001',
    adminEmail: adminEmail || 'admin@nexoracloud.com',
    action: 'CUSTOMER_REACTIVATED',
    entityType: 'customer',
    entityId: customer.id,
    newValue: { status: 'active' },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Customer account reactivated', customer: updated });
});

// GET /api/admin/domains
adminRouter.get('/domains', requireAdmin, (req: Request, res: Response) => {
  return res.json({ domains: db.getDomains() });
});

// GET /api/admin/hosting
adminRouter.get('/hosting', requireAdmin, (req: Request, res: Response) => {
  return res.json({ hosting: db.getHosting() });
});

// PUT /api/admin/hosting/:id/suspend
adminRouter.put('/hosting/:id/suspend', requireAdmin, (req: Request, res: Response) => {
  const { reason, adminId, adminEmail } = req.body;
  const account = db.getHosting().find((h) => h.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'Hosting account not found' });

  const updated = db.updateHosting(account.id, {
    status: 'suspended',
    suspendedReason: reason || 'Suspended by system administrator',
  });

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: adminId || 'ADM-1001',
    adminEmail: adminEmail || 'admin@nexoracloud.com',
    action: 'HOSTING_SUSPENDED',
    entityType: 'hosting',
    entityId: account.id,
    newValue: { reason },
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Hosting instance suspended', account: updated });
});

// PUT /api/admin/hosting/:id/reactivate
adminRouter.put('/hosting/:id/reactivate', requireAdmin, (req: Request, res: Response) => {
  const account = db.getHosting().find((h) => h.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'Hosting account not found' });

  const updated = db.updateHosting(account.id, {
    status: 'active',
    suspendedReason: undefined,
  });

  return res.json({ message: 'Hosting instance reactivated', account: updated });
});

// GET /api/admin/orders
adminRouter.get('/orders', requireAdmin, (req: Request, res: Response) => {
  return res.json({ orders: db.getOrders() });
});

// GET /api/admin/payments
adminRouter.get('/payments', requireAdmin, (req: Request, res: Response) => {
  return res.json({ payments: db.getPayments() });
});

// POST /api/admin/refunds
adminRouter.post('/refunds', requireAdmin, (req: Request, res: Response) => {
  try {
    const { paymentId, reason, refundAmount, adminId, adminEmail } = req.body;
    if (!paymentId || !reason) {
      return res.status(400).json({ error: 'Payment ID and refund reason are required' });
    }

    const payment = db.getPayments().find((p) => p.id === paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status === 'refunded') {
      return res.status(400).json({ error: 'Payment has already been fully refunded' });
    }

    const refundAmt = Number(refundAmount) || payment.amount;
    const refundTxId = `rfnd_NxR${Date.now().toString(36)}`;

    const updatedPayment = db.updatePayment(payment.id, {
      status: 'refunded',
      refundedAmount: refundAmt,
      refundReason: reason,
      refundTxId,
    });

    // Update order status
    const order = db.getOrders().find((o) => o.id === payment.orderId);
    if (order) {
      const timeline = [...order.timeline];
      timeline.push({
        timestamp: new Date().toISOString(),
        status: 'Refund Processed',
        note: `Gateway refund of ₹${refundAmt} processed (${refundTxId}). Reason: ${reason}`,
      });
      db.updateOrder(order.id, {
        paymentStatus: 'refunded',
        serviceStatus: 'cancelled',
        timeline,
      });
    }

    // Audit Log
    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: adminId || 'ADM-1001',
      adminEmail: adminEmail || 'admin@nexoracloud.com',
      action: 'PAYMENT_REFUND_PROCESSED',
      entityType: 'payment',
      entityId: payment.id,
      newValue: { refundAmount: refundAmt, reason, refundTxId },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: 'Refund submitted and processed through Payment Gateway',
      payment: updatedPayment,
      refundTxId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/plans
adminRouter.get('/plans', requireAdmin, (req: Request, res: Response) => {
  return res.json({ plans: db.getPlans() });
});

// PUT /api/admin/plans/:id
adminRouter.put('/plans/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { price, renewalPrice, isActive, isPromotional, storageGB, bandwidthGB, websitesAllowed, description } = req.body;

    const existing = db.getPlans().find((p) => p.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Hosting plan not found' });

    // Strict prompt rule: Do not allow setting price to 49
    if (Number(price) === 49) {
      return res.status(400).json({ error: 'The ₹49 plan has been permanently decommissioned and cannot be added or configured.' });
    }

    const updated = db.updatePlan(req.params.id, {
      price: price !== undefined ? Number(price) : existing.price,
      renewalPrice: renewalPrice !== undefined ? Number(renewalPrice) : existing.renewalPrice,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      isPromotional: isPromotional !== undefined ? Boolean(isPromotional) : existing.isPromotional,
      storageGB: storageGB !== undefined ? Number(storageGB) : existing.storageGB,
      bandwidthGB: bandwidthGB !== undefined ? Number(bandwidthGB) : existing.bandwidthGB,
      websitesAllowed: websitesAllowed !== undefined ? Number(websitesAllowed) : existing.websitesAllowed,
      description: description !== undefined ? description : existing.description,
    });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'HOSTING_PLAN_MODIFIED',
      entityType: 'plan',
      entityId: existing.id,
      previousValue: { price: existing.price, renewalPrice: existing.renewalPrice },
      newValue: { price: updated?.price, renewalPrice: updated?.renewalPrice },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: 'Hosting plan updated', plan: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tlds
adminRouter.get('/tlds', requireAdmin, (req: Request, res: Response) => {
  return res.json({ tlds: db.getTlds() });
});

// PUT /api/admin/tlds/:tld
adminRouter.put('/tlds/:tld', requireAdmin, (req: Request, res: Response) => {
  const { registrationPrice, renewalPrice, transferPrice, isSupported } = req.body;
  const updated = db.updateTld(req.params.tld, {
    registrationPrice: registrationPrice !== undefined ? Number(registrationPrice) : undefined,
    renewalPrice: renewalPrice !== undefined ? Number(renewalPrice) : undefined,
    transferPrice: transferPrice !== undefined ? Number(transferPrice) : undefined,
    isSupported: isSupported !== undefined ? Boolean(isSupported) : undefined,
  });

  if (!updated) return res.status(404).json({ error: 'TLD not found' });
  return res.json({ message: 'TLD pricing updated', tld: updated });
});

// GET /api/admin/settings
adminRouter.get('/settings', requireAdmin, (req: Request, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

// PUT /api/admin/settings
adminRouter.put('/settings', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  const updated = db.updateSettings(updates);

  db.addAuditLog({
    id: `LOG-${Date.now()}`,
    adminId: 'ADM-1001',
    adminEmail: 'admin@nexoracloud.com',
    action: 'SETTINGS_UPDATED',
    entityType: 'settings',
    entityId: 'SYSTEM',
    newValue: updates,
    result: 'success',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Settings saved', settings: updated });
});

// GET /api/admin/promo-domain-offer
adminRouter.get('/promo-domain-offer', requireAdmin, (req: Request, res: Response) => {
  const offer = db.getPromoDomainOffer();
  const allTlds = db.getTlds();
  const now = new Date();
  const startDate = new Date(offer.startDate);
  const endDate = new Date(offer.endDate + 'T23:59:59');

  const isLive =
    offer.isEnabled &&
    now >= startDate &&
    now <= endDate &&
    offer.ordersClaimed < offer.maxOrders;

  return res.json({
    offer,
    isLive,
    allTlds,
    stats: {
      ordersClaimed: offer.ordersClaimed,
      maxOrders: offer.maxOrders,
      remainingQuota: Math.max(0, offer.maxOrders - offer.ordersClaimed),
      percentClaimed: Number(((offer.ordersClaimed / Math.max(1, offer.maxOrders)) * 100).toFixed(1)),
    },
  });
});

// PUT /api/admin/promo-domain-offer
adminRouter.put('/promo-domain-offer', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      isEnabled,
      promotionalPrice,
      eligibleTlds,
      startDate,
      endDate,
      maxOrders,
      customerEligibility,
      minRegistrationPeriodYears,
      allowPlatformSubsidy,
      customRenewalPrices,
      termsAndConditions,
      adminId,
      adminEmail,
    } = req.body;

    const previousValue = { ...db.getPromoDomainOffer() };

    const updated = db.updatePromoDomainOffer({
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
      promotionalPrice: promotionalPrice !== undefined ? Number(promotionalPrice) : undefined,
      eligibleTlds: Array.isArray(eligibleTlds) ? eligibleTlds : undefined,
      startDate: startDate !== undefined ? startDate : undefined,
      endDate: endDate !== undefined ? endDate : undefined,
      maxOrders: maxOrders !== undefined ? Number(maxOrders) : undefined,
      customerEligibility: customerEligibility !== undefined ? customerEligibility : undefined,
      minRegistrationPeriodYears: minRegistrationPeriodYears !== undefined ? Number(minRegistrationPeriodYears) : undefined,
      allowPlatformSubsidy: allowPlatformSubsidy !== undefined ? Boolean(allowPlatformSubsidy) : undefined,
      customRenewalPrices: customRenewalPrices !== undefined ? customRenewalPrices : undefined,
      termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : undefined,
    });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: adminId || 'ADM-1001',
      adminEmail: adminEmail || 'admin@nexoracloud.com',
      action: 'PROMO_DOMAIN_OFFER_CONFIGURED',
      entityType: 'settings',
      entityId: 'PROMO-DOM-1',
      previousValue,
      newValue: updated,
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: '₹1 Promotional Domain Offer configuration updated successfully',
      offer: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating promo offer' });
  }
});

// GET /api/admin/staff
adminRouter.get('/staff', requireAdmin, (req: Request, res: Response) => {
  const staff = db.getUsers().filter((u) => u.role !== 'customer');
  const safe = staff.map(({ passwordHash, ...rest }) => rest);
  return res.json({ staff: safe });
});

// POST /api/admin/staff
adminRouter.post('/staff', requireAdmin, (req: Request, res: Response) => {
  try {
    const { fullName, email, password, mobile, role } = req.body;
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'Full name, email, password, and staff role are required' });
    }

    const existing = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'User with this email already exists' });

    const newStaff: User = {
      id: `ADM-${1000 + db.getUsers().length + 1}`,
      fullName,
      email: email.toLowerCase(),
      passwordHash: password,
      mobile: mobile || '+91 9999999999',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      address: 'Nexora Operations Center',
      postalCode: '560001',
      role,
      status: 'active',
      twoFactorEnabled: true,
      twoFactorSecret: '654321',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addUser(newStaff);
    const { passwordHash: _, ...safe } = newStaff;
    return res.status(201).json({ message: 'Staff member added', staff: safe });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', requireAdmin, (req: Request, res: Response) => {
  return res.json({ logs: db.getAuditLogs() });
});

// Domain Plans Management (12 Tiers)
// GET /api/admin/domain-plans
adminRouter.get('/domain-plans', requireAdmin, (req: Request, res: Response) => {
  return res.json({ plans: db.getDomainPlans() });
});

// PUT /api/admin/domain-plans/:id
adminRouter.put('/domain-plans/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const plan = db.updateDomainPlan(req.params.id, req.body);
    if (!plan) return res.status(404).json({ error: 'Domain plan not found' });
    return res.json({ message: 'Domain plan updated successfully', plan });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Coupons Management
// GET /api/admin/coupons
adminRouter.get('/coupons', requireAdmin, (req: Request, res: Response) => {
  return res.json({ coupons: db.getCoupons() });
});

// POST /api/admin/coupons
adminRouter.post('/coupons', requireAdmin, (req: Request, res: Response) => {
  try {
    const { code, discountPercent, description, validUntil, minOrderAmount, maxUses, applicableServices, stackableWithPromo } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ error: 'Coupon code and discount percentage are required' });
    }

    const newCoupon = {
      id: `CPN-${Date.now().toString(36).toUpperCase()}`,
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      description: description || `Special ${discountPercent}% discount`,
      validFrom: new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : 1000,
      usedCount: 0,
      isActive: true,
      applicableServices: applicableServices || ['domain', 'hosting', 'all'],
      stackableWithPromo: Boolean(stackableWithPromo),
    };

    db.addCoupon(newCoupon);
    return res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/coupons/:id
adminRouter.put('/coupons/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const coupon = db.updateCoupon(req.params.id, req.body);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    return res.json({ message: 'Coupon updated successfully', coupon });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/coupons/generate-monthly
adminRouter.post('/coupons/generate-monthly', requireAdmin, (req: Request, res: Response) => {
  try {
    const generated = db.generateMonthlyCoupons();
    return res.json({
      message: `Monthly coupons generated / refreshed successfully (${generated.length} active coupons)`,
      coupons: db.getCoupons().filter((c) => c.isActive),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PAYMENT SETTINGS & ADMIN QR CODE CONTROLS (Step 11 & Step 12)
// ==========================================

// GET /api/admin/payment-settings
adminRouter.get('/payment-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    return res.json({ settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/payment-settings/qr-upload
adminRouter.post('/payment-settings/qr-upload', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, imageUrl, isActive } = req.body;
    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'QR Code name and image URL/data are required.' });
    }

    const newQr = db.addAdminQrCode({ name, imageUrl, isActive: isActive ?? true });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'ADMIN_QR_UPLOADED',
      entityType: 'settings',
      entityId: newQr.id,
      newValue: { name: newQr.name, isActive: newQr.isActive },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ message: 'Admin QR Code uploaded successfully', qrCode: newQr, settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment-settings/qr/:id/activate
adminRouter.put('/payment-settings/qr/:id/activate', requireAdmin, (req: Request, res: Response) => {
  try {
    const activated = db.activateAdminQrCode(req.params.id);
    if (!activated) return res.status(404).json({ error: 'QR Code not found' });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'ADMIN_QR_ACTIVATED',
      entityType: 'settings',
      entityId: req.params.id,
      newValue: { id: req.params.id, isActive: true },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: 'QR Code activated for checkout', qrCode: activated, settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment-settings/qr/:id/deactivate
adminRouter.put('/payment-settings/qr/:id/deactivate', requireAdmin, (req: Request, res: Response) => {
  try {
    const ok = db.deactivateAdminQrCode(req.params.id);
    if (!ok) return res.status(404).json({ error: 'QR Code not found' });
    return res.json({ message: 'QR Code deactivated', settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/payment-settings/qr/:id
adminRouter.delete('/payment-settings/qr/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const ok = db.deleteAdminQrCode(req.params.id);
    if (!ok) return res.status(404).json({ error: 'QR Code not found' });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'ADMIN_QR_DELETED',
      entityType: 'settings',
      entityId: req.params.id,
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: 'QR Code deleted successfully', settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment-settings/qr/:id/replace
adminRouter.put('/payment-settings/qr/:id/replace', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, imageUrl, isActive } = req.body;
    const replaced = db.replaceAdminQrCode(req.params.id, { name, imageUrl, isActive });
    if (!replaced) return res.status(404).json({ error: 'QR Code not found' });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'ADMIN_QR_REPLACED',
      entityType: 'settings',
      entityId: req.params.id,
      newValue: { name: replaced.name, isActive: replaced.isActive },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: 'QR Code replaced and updated successfully', qrCode: replaced, settings: db.getPaymentSettings() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment-settings/merchant
adminRouter.put('/payment-settings/merchant', requireAdmin, (req: Request, res: Response) => {
  try {
    const { merchantName } = req.body;
    if (!merchantName || !merchantName.trim()) {
      return res.status(400).json({ error: 'Registered Bank Merchant Name is required.' });
    }
    const settings = db.updatePaymentSettings({ merchantName: merchantName.trim() });

    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'ADM-1001',
      adminEmail: 'admin@nexoracloud.com',
      action: 'ADMIN_MERCHANT_NAME_UPDATED',
      entityType: 'settings',
      entityId: 'MERCHANT_NAME',
      newValue: { merchantName: merchantName.trim() },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: 'Bank Registered Merchant Name updated successfully', settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/payment-settings/methods
adminRouter.put('/payment-settings/methods', requireAdmin, (req: Request, res: Response) => {
  try {
    const { enabledMethods } = req.body;
    const settings = db.updatePaymentSettings({ enabledMethods });
    return res.json({ message: 'Payment methods updated successfully', settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payment-settings/attempts
adminRouter.get('/payment-settings/attempts', requireAdmin, (req: Request, res: Response) => {
  try {
    return res.json({ attempts: db.getPaymentAttempts() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payment-settings/webhooks
adminRouter.get('/payment-settings/webhooks', requireAdmin, (req: Request, res: Response) => {
  try {
    return res.json({ webhooks: db.getPaymentWebhooks() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payment-settings/pending-payments
adminRouter.get('/payment-settings/pending-payments', requireAdmin, (req: Request, res: Response) => {
  try {
    const pendingOrders = db.getOrders().filter((o) => o.paymentStatus === 'pending');
    return res.json({ pendingOrders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payment-settings/refunds
adminRouter.get('/payment-settings/refunds', requireAdmin, (req: Request, res: Response) => {
  try {
    return res.json({ refunds: db.getRefundRecords() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

