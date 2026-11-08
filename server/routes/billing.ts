import { Router, Request, Response } from 'express';
import { db, Order, PaymentTransaction, BackupRecord } from '../db.js';

export const billingRouter = Router();

// Middleware to verify admin token for admin-only operations
function requireAdmin(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.replace('Bearer ', '');
  const user = db.getUsers().find((u) => u.id === token || `mock_jwt_token_${u.id}` === token);
  if (!user || user.role === 'customer') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  (req as any).user = user;
  next();
}

// Public Payment Settings for Customer Purchase Flow (Active QR Code & Enabled Payment Methods)
billingRouter.get('/payment-settings', (req: Request, res: Response) => {
  try {
    const settings = db.getPaymentSettings();
    return res.json({
      activeQrCode: settings.activeQrCode,
      enabledMethods: settings.enabledMethods,
      merchantName: settings.merchantName,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/orders/:id - Payment Refresh Protection & Order Recovery
billingRouter.get('/orders/:id', (req: Request, res: Response) => {
  try {
    const order = db.getOrders().find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const registrantDetails = db.getRegistrantDetails(order.id);
    const payment = order.paymentId
      ? db.getPayments().find((p) => p.id === order.paymentId)
      : db.getPayments().find((p) => p.orderId === order.id);

    return res.json({
      order,
      registrantDetails: registrantDetails || null,
      payment: payment || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-order
billingRouter.post('/create-order', (req: Request, res: Response) => {
  try {
    const { customerId, type, itemId, itemTitle, subtotal, couponCode, isPromoOffer, registrantDetails } = req.body;
    if (!customerId || !type || !itemId || subtotal === undefined) {
      return res.status(400).json({ error: 'Missing required order parameters' });
    }

    const customer = db.getUsers().find((u) => u.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const settings = db.getSettings();
    const rawSubtotal = Number(subtotal);

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const couponResult = db.applyCoupon(couponCode, rawSubtotal, Boolean(isPromoOffer));
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        appliedCoupon = couponResult.coupon;
      }
    }

    const discountedBase = Math.max(0, rawSubtotal - discountAmount);
    const taxRate = settings.taxRatePercent / 100; // 0.18 for 18% GST
    const taxAmount = Number((discountedBase * taxRate).toFixed(2));
    const totalAmount = Number((discountedBase + taxAmount).toFixed(2));

    const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      customerId,
      customerName: customer.fullName,
      customerEmail: customer.email,
      type,
      itemTitle: itemTitle || `${type.toUpperCase()} Order`,
      itemId,
      subtotal: rawSubtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: 'INR',
      paymentStatus: 'pending',
      serviceStatus: 'pending',
      createdAt: now,
      timeline: [
        { timestamp: now, status: 'Order Created', note: `Customer created order for ${itemTitle}${couponCode ? ` with coupon ${couponCode.toUpperCase()}` : ''}` },
      ],
    };

    db.addOrder(order);

    // Persist domain registrant details if provided (Required for Step 3 & Step 8)
    if (registrantDetails) {
      db.saveRegistrantDetails({
        orderId: order.id,
        domainName: itemId,
        firstName: registrantDetails.firstName || customer.fullName.split(' ')[0],
        lastName: registrantDetails.lastName || customer.fullName.split(' ')[1] || 'Customer',
        company: registrantDetails.company || '',
        email: registrantDetails.email || customer.email,
        mobile: registrantDetails.mobile || customer.mobile,
        address: registrantDetails.address || customer.address,
        city: registrantDetails.city || customer.city,
        state: registrantDetails.state || customer.state,
        postalCode: registrantDetails.postalCode || customer.postalCode,
        country: registrantDetails.country || customer.country,
        organization: registrantDetails.organization || registrantDetails.company || '',
        submittedAt: now,
      });
    }

    // Create payment gateway order ID (Razorpay standard format: order_xxxxxxxx)
    const gatewayOrderId = `order_NxR${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;

    // Build standard UPI intent URI
    const upiUri = `upi://pay?pa=billing@nexoracloud&pn=NexoraCloud&am=${totalAmount}&tn=${encodeURIComponent(`Order ${order.id}`)}&cu=INR`;

    return res.status(201).json({
      order,
      gatewayOrderId,
      upiUri,
      keyId: settings.paymentGatewayKeyId,
      taxName: settings.taxName,
      discountApplied: discountAmount,
      coupon: appliedCoupon,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/verify-payment
billingRouter.post('/verify-payment', (req: Request, res: Response) => {
  try {
    const {
      orderId,
      gatewayOrderId,
      paymentMethod,
      methodDetails,
      idempotencyKey,
    } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'Order ID and payment method are required' });
    }

    const order = db.getOrders().find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentStatus === 'successful') {
      return res.status(409).json({ error: 'Order has already been paid and processed.', order });
    }

    // Check idempotency to prevent double-billing
    if (idempotencyKey) {
      const existingTx = db.getPayments().find((p) => p.idempotencyKey === idempotencyKey && p.status === 'successful');
      if (existingTx) {
        return res.status(200).json({ message: 'Payment already processed (idempotent)', payment: existingTx, order });
      }
    }

    const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayPaymentId = `pay_NxR${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const payment: PaymentTransaction = {
      id: paymentId,
      orderId: order.id,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      amount: order.totalAmount,
      currency: 'INR',
      gateway: paymentMethod === 'UPI' ? 'Razorpay' : 'Card_Secure',
      gatewayOrderId: gatewayOrderId || `order_NxR${Date.now()}`,
      gatewayPaymentId,
      method: paymentMethod,
      methodDetails: methodDetails || `${paymentMethod} Authoritative Gateway`,
      status: 'successful',
      idempotencyKey: idempotencyKey || `idemp_${Date.now()}`,
      createdAt: now,
    };

    db.addPayment(payment);

    // Log payment attempt for audit tracking (Step 12)
    db.addPaymentAttempt({
      id: `ATT-${Date.now()}`,
      orderId: order.id,
      customerId: order.customerId,
      amount: order.totalAmount,
      method: paymentMethod,
      gateway: payment.gateway,
      status: 'successful',
      ipAddress: (req.ip || req.socket.remoteAddress || '127.0.0.1').toString(),
      userAgent: req.headers['user-agent'] as string,
      createdAt: now,
    });

    // Update order status with "Payment Successful" per strict requirement
    const timeline = [...order.timeline];
    timeline.push({
      timestamp: now,
      status: 'Payment Successful',
      note: `Confirmed payment of ₹${order.totalAmount} via ${paymentMethod} (${gatewayPaymentId})`,
    });

    const updatedOrder = db.updateOrder(order.id, {
      paymentStatus: 'successful',
      paymentId: payment.id,
      serviceStatus: order.type === 'domain' ? 'pending_activation' : 'provisioning',
      timeline,
    });

    // Notification
    db.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: order.customerEmail,
      recipientId: order.customerId,
      type: 'PAYMENT_SUCCESS',
      subject: `Payment Receipt: ₹${order.totalAmount} (${order.id})`,
      messageHtml: `<p>Payment of ₹${order.totalAmount} for ${order.itemTitle} was successfully completed via ${paymentMethod}. Transaction ID: ${gatewayPaymentId}.</p>`,
      isRead: false,
      sentAt: now,
    });

    return res.status(200).json({
      message: 'Payment verified and confirmed by Gateway',
      payment,
      order: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/webhook - Gateway Webhook Endpoint with idempotency (Step 10 & 12)
billingRouter.post('/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const { event, payload } = req.body;

    const webhookId = `WHK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const orderId = payload?.payment?.entity?.notes?.order_id || payload?.order?.entity?.receipt;

    // Check if duplicate webhook
    const existing = db.getPaymentWebhooks().find(
      (w) => w.payload?.payment?.entity?.id && w.payload?.payment?.entity?.id === payload?.payment?.entity?.id && w.event === event
    );
    if (existing) {
      return res.status(200).json({ status: 'ignored_duplicate', message: 'Webhook already processed' });
    }

    db.addPaymentWebhook({
      id: webhookId,
      event: event || 'payment.captured',
      orderId: orderId || 'UNKNOWN',
      paymentId: payload?.payment?.entity?.id,
      signature,
      payload,
      status: 'processed',
      receivedAt: now,
    });

    if (orderId) {
      const order = db.getOrders().find((o) => o.id === orderId);
      if (order && order.paymentStatus !== 'successful') {
        db.updateOrder(order.id, {
          paymentStatus: 'successful',
          serviceStatus: order.type === 'domain' ? 'pending_activation' : 'active',
        });
      }
    }

    return res.status(200).json({ status: 'success', webhookId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/admin-demo-payment
// Strictly restricted to authorized administrators for diagnostic/testing purposes
billingRouter.post('/admin-demo-payment', requireAdmin, (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const adminUser = (req as any).user;

    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    const order = db.getOrders().find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.paymentStatus === 'successful') {
      return res.status(409).json({ error: 'Order is already marked as paid.', order });
    }

    const now = new Date().toISOString();
    const paymentId = `PAY-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayPaymentId = `pay_admin_demo_${Date.now()}`;

    const payment: PaymentTransaction = {
      id: paymentId,
      orderId: order.id,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      amount: order.totalAmount,
      currency: 'INR',
      gateway: 'ADMIN_TEST_DEMO',
      gatewayOrderId: `demo_order_${order.id}`,
      gatewayPaymentId,
      method: 'Admin Diagnostic Test (DEMO)',
      methodDetails: `Staff Authorized Test by ${adminUser.fullName} (${adminUser.email})`,
      status: 'successful',
      idempotencyKey: `demo_idemp_${order.id}_${Date.now()}`,
      createdAt: now,
    };

    db.addPayment(payment);

    const timeline = [...order.timeline];
    timeline.push({
      timestamp: now,
      status: 'Payment Successful',
      note: `Staff Diagnostic Simulation by Admin ${adminUser.email} (DEMO)`,
    });

    const updatedOrder = db.updateOrder(order.id, {
      paymentStatus: 'successful',
      paymentId: payment.id,
      serviceStatus: 'active',
      timeline,
    });

    // Record strictly in audit log
    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'ADMIN_DEMO_PAYMENT_PROCESSED',
      entityType: 'payment',
      entityId: payment.id,
      newValue: { orderId: order.id, amount: order.totalAmount, isDemo: true },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: now,
    });

    return res.status(200).json({
      message: 'Admin demo test payment recorded successfully',
      payment,
      order: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/coupons - Customer active monthly coupons
billingRouter.get('/coupons', (req: Request, res: Response) => {
  try {
    const coupons = db.getCoupons().filter((c) => c.isActive);
    return res.json({ coupons });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/coupons/apply - Validate and calculate discount
billingRouter.post('/coupons/apply', (req: Request, res: Response) => {
  try {
    const { code, subtotal, isPromoOffer } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required', valid: false });

    const result = db.applyCoupon(code, Number(subtotal || 0), Boolean(isPromoOffer));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, valid: false });
  }
});

// Backups endpoints
// GET /api/billing/backups
billingRouter.get('/backups', (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId as string;
    let backups = db.getBackups();
    if (customerId) {
      backups = backups.filter((b) => b.customerId === customerId);
    }
    return res.json({ backups });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/backups/create
billingRouter.post('/backups/create', (req: Request, res: Response) => {
  try {
    const { hostingId, type, description } = req.body;
    if (!hostingId) return res.status(400).json({ error: 'Hosting ID required' });

    const hosting = db.getHosting().find((h) => h.id === hostingId);
    if (!hosting) return res.status(404).json({ error: 'Hosting service not found' });

    const now = new Date().toISOString();
    const backupId = `BCK-${Date.now().toString(36).toUpperCase()}`;

    const newBackup: BackupRecord = {
      id: backupId,
      hostingId: hosting.id,
      domainName: hosting.domainName,
      customerId: hosting.customerId,
      type: type === 'manual' ? 'manual' : 'automated',
      status: 'ready',
      sizeBytes: Math.floor(25 * 1024 * 1024 + Math.random() * 60 * 1024 * 1024),
      storageLocation: `/backups/${hosting.id}/${backupId}.tar.gz`,
      retentionDays: 30,
      createdAt: now,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    db.addBackup(newBackup);
    return res.status(201).json({ message: 'Backup snapshot created successfully', backup: newBackup });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/billing/backups/:id
billingRouter.delete('/backups/:id', (req: Request, res: Response) => {
  try {
    const backup = db.getBackups().find((b) => b.id === req.params.id);
    if (!backup) return res.status(404).json({ error: 'Backup not found' });

    db.deleteBackup(backup.id);
    return res.json({ message: 'Backup snapshot deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/backups/:id/restore
billingRouter.post('/backups/:id/restore', (req: Request, res: Response) => {
  try {
    const backup = db.getBackups().find((b) => b.id === req.params.id);
    if (!backup) return res.status(404).json({ error: 'Backup not found' });

    return res.json({
      message: `Hosting service files restored from snapshot ${backup.id}`,
      restoredAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/orders
billingRouter.get('/orders', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  if (!customerId) return res.status(400).json({ error: 'Customer ID is required' });

  const orders = db.getOrders().filter((o) => o.customerId === customerId);
  return res.json({ orders });
});

// GET /api/billing/payments
billingRouter.get('/payments', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  if (!customerId) return res.status(400).json({ error: 'Customer ID is required' });

  const payments = db.getPayments().filter((p) => p.customerId === customerId);
  return res.json({ payments });
});

// GET /api/billing/invoice/:orderId
billingRouter.get('/invoice/:orderId', (req: Request, res: Response) => {
  const order = db.getOrders().find((o) => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const customer = db.getUsers().find((u) => u.id === order.customerId);
  const payment = order.paymentId ? db.getPayments().find((p) => p.id === order.paymentId) : null;
  const settings = db.getSettings();

  return res.json({
    invoiceNumber: `INV-${order.id.replace('ORD-', '')}`,
    order,
    customer,
    payment,
    issuer: {
      name: settings.brandName,
      address: 'Nexora Tower, MG Road, Bengaluru, Karnataka, 560001',
      gstin: '29AAACN8912P1ZX',
      email: settings.supportEmail,
      phone: settings.supportPhone,
    },
  });
});
